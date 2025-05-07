import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { getQueue, QueueName } from '@/lib/queue'; // Correct queue import
// Import types from the default client path
import { Asset, BookStatus, Prisma } from '@prisma/client';
// Import shared prisma instance
import { db as prisma } from '@/lib/db'; 
import logger from '@/lib/logger';
import type { StoryGenerationInput } from '@/lib/openai/prompts'; // Import type for context

// REMOVED local BookStatus enum workaround (Task 7.8)

// REMOVED type Asset = any; workaround (Task 7.8)

// Define the expected input schema using Zod
const storyRequestSchema = z.object({
  childName: z.string().min(1, { message: "Child's name is required" }),
  bookTitle: z.string().min(1, { message: "Book title is required" }),
  pageCount: z.union([
    z.literal(8),
    z.literal(12),
    z.literal(16),
  ]),
  isDoubleSpread: z.boolean(),
  droppedAssets: z.record(
    z.string(), // Allow any string key (numeric index OR 'title-page')
    z.string().nullable() // Value: assetId or null
  ),
  // Optional fields - ensure they are strings or undefined
  storyTone: z.string().optional(),
  artStyle: z.string().optional(),
  theme: z.string().optional().default(''), // Use default to avoid undefined
  people: z.string().optional().default(''),
  objects: z.string().optional().default(''),
  excitementElement: z.string().optional().default(''),
  isWinkifyEnabled: z.boolean().optional().default(false), // Add field to schema
});

// Define the data structure required by the story generation worker job
export interface StoryGenerationJobData {
  userId: string;
  bookId: string;
  // Context needed for prompt generation
  promptContext: Omit<StoryGenerationInput, 'assets' | 'droppedAssets' | 'pageCount' | 'storyPages'>;
  // Array of story pages needing text generation
  storyPages: {
    pageId: string;       
    pageNumber: number;   
    assetId: string | null; 
    originalImageUrl: string | null; 
  }[];
  isWinkifyEnabled: boolean;
}

// Zod schema for the NEW request body
const triggerStoryRequestSchema = z.object({
  bookId: z.string().cuid(),
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    logger.warn('API: /generate/story attempt without authentication.');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let validatedData;
  try {
    const body = await req.json();
    validatedData = triggerStoryRequestSchema.parse(body);
    logger.info({ userId, bookId: validatedData.bookId }, 'API: Validated /generate/story request.');
  } catch (error) {
    logger.warn({ userId, error }, 'API: Invalid /generate/story request body.');
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request body', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { bookId } = validatedData;

  try {
    // 1. Fetch Book, Pages, and Assets (ensure user owns the book)
    const book = await prisma.book.findUnique({
      where: { id: bookId, userId: userId },
      include: {
        pages: {
          orderBy: { index: 'asc' }, // Fetch sorted by saved index
          include: { 
            asset: { select: { id: true, url: true, thumbnailUrl: true } } 
          }
        },
      },
    });

    if (!book) {
      logger.warn({ userId, bookId }, 'API: /generate/story - Book not found or permission denied.');
      return NextResponse.json({ error: 'Book not found or permission denied' }, { status: 404 });
    }

    // 2. Validate required fields for generation
    if (!book.title?.trim() || !book.childName?.trim() || !book.artStyle) {
        logger.warn({ userId, bookId }, 'API: /generate/story - Missing required book details (title, childName, artStyle).');
        return NextResponse.json({ error: 'Missing required book details: Title, Child\'s Name, and Art Style must be set.' }, { status: 400 });
    }
    
    // Ensure book is in a state where generation can be started (e.g., DRAFT or maybe FAILED)
    if (book.status !== BookStatus.DRAFT && book.status !== BookStatus.FAILED && book.status !== BookStatus.COMPLETED) { // Allow re-gen from COMPLETED? Maybe not.
        logger.warn({ userId, bookId, status: book.status }, 'API: /generate/story - Book not in DRAFT or FAILED state.');
        return NextResponse.json({ error: `Book generation cannot be started from current status: ${book.status}` }, { status: 409 }); // Conflict
    }

    // 3. Filter out cover page and prepare storyPages for the job
    const coverAssetId = book.coverAssetId;
    const pagesForStory = book.pages
      .filter(p => p.assetId !== coverAssetId) // Exclude cover page
      .map((page, storyIndex) => ({ // Map to the structure worker needs
        pageId: page.id,
        pageNumber: storyIndex + 1, // Recalculate pageNumber based on filtered/sorted list (1-based)
        assetId: page.assetId,
        originalImageUrl: page.asset?.thumbnailUrl || page.asset?.url || page.originalImageUrl // Ensure URL is passed
      }));
      
    if (pagesForStory.length === 0) {
        logger.error({ userId, bookId }, 'API: /generate/story - No pages available for story generation after filtering cover.');
        return NextResponse.json({ error: 'No pages found to generate story for (after excluding cover).' }, { status: 400 });
    }

    logger.info({ userId, bookId, pageCount: pagesForStory.length }, 'API: /generate/story - Prepared pages for job queue.');

    // 4. Update Book status to GENERATING
    await prisma.book.update({
      where: { id: bookId },
      data: { status: BookStatus.GENERATING },
    });
    logger.info({ userId, bookId }, 'API: /generate/story - Set book status to GENERATING.');

    // 5. Prepare Job Data
    const jobData: StoryGenerationJobData = {
      userId,
      bookId,
      promptContext: { // Simplified prompt context
        bookTitle: book.title,
        childName: book.childName,
        artStyle: book.artStyle, 
        // Removed tone, theme, keyCharacters, specialObjects, excitementElement 
        // Assuming these are not in StoryGenerationInput type
        isDoubleSpread: false, 
      },
      storyPages: pagesForStory,
      isWinkifyEnabled: book.isWinkifyEnabled,
    };

    // 6. Add job to queue using getQueue
    const storyQueue = getQueue(QueueName.StoryGeneration);
    await storyQueue.add(`generate-story-${bookId}`, jobData, {
        attempts: 3, 
        backoff: {
          type: 'exponential',
          delay: 10000, 
        },
    });
    logger.info({ userId, bookId }, 'API: /generate/story - Job added to StoryGeneration queue.');

    // 7. Return Accepted response
    return NextResponse.json({ message: 'Story generation initiated', bookId: bookId }, { status: 202 });

  } catch (error) {
    logger.error({ userId, bookId, error }, 'API: Error in /generate/story endpoint.');
    // Attempt to reset status to FAILED if something went wrong after setting GENERATING
    try {
        await prisma.book.updateMany({
            where: { id: bookId, userId: userId, status: BookStatus.GENERATING },
            data: { status: BookStatus.FAILED }
        });
    } catch (resetError) {
        logger.error({ userId, bookId, resetError }, 'API: Failed to reset book status to FAILED after error.');
    }
    return NextResponse.json({ error: 'Failed to initiate story generation' }, { status: 500 });
  }
} 