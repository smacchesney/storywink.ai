import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/db/ensureUser';
import { z } from 'zod';
import { QueueName, flowProducer } from '@/lib/queue/index';
import { db as prisma } from '@/lib/db';
import { BookStatus, Prisma } from '@prisma/client';
import logger from '@/lib/logger';

// Define the expected input schema using Zod
const illustrationRequestSchema = z.object({
  bookId: z.string().cuid({ message: "Valid Book ID (CUID) is required" }),
});

// Re-define the structure of the job data needed by the ILLUSTRATION WORKER (Simplified)
export interface IllustrationGenerationJobData {
  userId: string;
  bookId: string;
  pageId: string;
  pageNumber: number;
  text: string | null;
  artStyle: string | null | undefined;
  bookTitle: string | null | undefined;
  isTitlePage: boolean;
  illustrationNotes: string | null | undefined;
  originalImageUrl: string | null;
  isWinkifyEnabled: boolean;
}

// Define job data structure for the BookFinalize parent job (used locally)
interface BookFinalizeJobData {
    bookId: string;
    userId: string;
}

export async function POST(request: Request) {
  try {
    const { dbUser, clerkId } = await getAuthenticatedUser();

    let requestData;
    try {
      const rawData = await request.json();
      requestData = illustrationRequestSchema.parse(rawData);
      logger.info({ clerkId, dbUserId: dbUser.id, bookId: requestData.bookId }, 'Received illustration generation request');
    } catch (error) {
      logger.error({ clerkId, dbUserId: dbUser.id, error }, 'Invalid illustration generation request data');
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
      }
      return NextResponse.json({ error: 'Failed to parse request data' }, { status: 400 });
    }

    // Step 1: Validate Book Ownership and Status
    logger.info({ clerkId, dbUserId: dbUser.id, bookId: requestData.bookId }, 'Validating book...');
    const book = await prisma.book.findUnique({
      where: {
        id: requestData.bookId,
        userId: dbUser.id, // Use database user ID for ownership check
      },
      select: {
        id: true,
        title: true,
        artStyle: true,
        status: true,
        isWinkifyEnabled: true, 
        pages: {
          orderBy: { index: 'asc' },
          select: {
            id: true,
            text: true,
            originalImageUrl: true,
            illustrationNotes: true,
            assetId: true,
            index: true
          }
        }
      }
    });

    if (!book) {
      logger.warn({ clerkId, dbUserId: dbUser.id, bookId: requestData.bookId }, 'Book not found or user mismatch for illustration generation.');
      return NextResponse.json({ error: 'Book not found or access denied.' }, { status: 404 });
    }

    if (book.status !== BookStatus.COMPLETED) {
      logger.warn({ clerkId, dbUserId: dbUser.id, bookId: requestData.bookId, status: book.status }, 'Book not in correct state for illustration generation.');
      return NextResponse.json({ error: `Book must be in COMPLETED state to start illustration (current: ${book.status})` }, { status: 409 }); // Conflict status
    }

    if (!book.pages || book.pages.length === 0) {
       logger.error({ clerkId, dbUserId: dbUser.id, bookId: book.id }, 'No pages found for this book to illustrate.');
       return NextResponse.json({ error: 'Cannot illustrate a book with no pages.' }, { status: 400 });
    }

    logger.info({ clerkId, dbUserId: dbUser.id, bookId: book.id }, 'Book validation successful.');

    // Step 2: Update Book Status to ILLUSTRATING
    await prisma.book.update({
        where: { id: book.id },
        data: { status: BookStatus.ILLUSTRATING }
    });
    logger.info({ clerkId, dbUserId: dbUser.id, bookId: book.id }, 'Book status updated to ILLUSTRATING.');

    // Step 3: Create child job definitions for each page
    const pageChildren = book.pages.map((page, index) => {
        const isActualTitlePage = index === 0;
        const logicalPageNumber = index + 1;
        
        const illustrationJobData: IllustrationGenerationJobData = {
            userId: dbUser.id, // Use database user ID
            bookId: book.id,
            pageId: page.id,
            pageNumber: logicalPageNumber,
            text: page.text,
            artStyle: book.artStyle,
            bookTitle: book.title,
            isWinkifyEnabled: book.isWinkifyEnabled || false,
            isTitlePage: isActualTitlePage,
            illustrationNotes: page.illustrationNotes,
            originalImageUrl: page.originalImageUrl,
        };
        const jobName = `generate-illustration-${book.id}-p${logicalPageNumber}`;
        logger.info({ clerkId, dbUserId: dbUser.id, bookId: book.id, pageId: page.id, pageNumber: logicalPageNumber, isTitle: isActualTitlePage }, `Queueing job: ${jobName}`);
        return {
            name: jobName,
            queueName: QueueName.IllustrationGeneration,
            data: illustrationJobData,
            opts: { 
                attempts: 3,
                backoff: { type: 'exponential', delay: 10000 }, 
                removeOnComplete: { count: 1000 },
                removeOnFail: { count: 5000 },
                failParentOnFailure: false, 
                removeDependencyOnFailure: true 
            }
        };
    });

    // Step 4: Add the flow (parent job + children) atomically (remains the same)
    const finalizeJobData: BookFinalizeJobData = {
        bookId: book.id,
        userId: dbUser.id, // Use database user ID
    };

    await flowProducer.add({
        name: `finalize-book-${book.id}`,
        queueName: QueueName.BookFinalize, // Parent job goes to the new queue
        data: finalizeJobData,
        opts: { 
            removeOnComplete: { count: 100 }, // Keep fewer parent jobs
            removeOnFail: { count: 500 }
        },
        children: pageChildren // Link the page illustration jobs
    });

    logger.info({ clerkId, dbUserId: dbUser.id, bookId: book.id, childJobCount: pageChildren.length }, 'Added illustration flow to queue (parent + children)');

    // Step 5: Return confirmation (remains the same)
    return NextResponse.json({ message: `Illustration flow initiated for ${pageChildren.length} pages.`, bookId: book.id }, { status: 202 });

  } catch (error: any) {
    // Handle authentication errors first
    if (error instanceof Error && (
      error.message.includes('not authenticated') ||
      error.message.includes('ID mismatch') ||
      error.message.includes('primary email not found')
    )) {
      logger.warn('Unauthorized illustration generation attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For other errors, extract bookId if available
    const bookId = error?.requestData?.bookId || 'unknown';
    logger.error({ bookId, error: error.message }, 'Error during illustration job queuing or validation');
    // Attempt to revert status - maybe move status update to finalize job?
    // For now, just log the error and return 500
    return NextResponse.json({ error: error.message || 'An unexpected error occurred' }, { status: 500 });
  }
} 