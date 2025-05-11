import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { db as prisma } from '@/lib/db';
import logger from '@/lib/logger';

// Zod schema for validating each item in the pages array
const pageOrderSchema = z.object({
  pageId: z.string().cuid(),
  index: z.number().int().min(0),
  // Add pageNumber if needed for validation, though index is primary for update
});

// Zod schema for the request body
const reorderRequestSchema = z.object({
  pages: z.array(pageOrderSchema).min(1, { message: 'At least one page required for reordering.' }),
});

type Context = { params: Promise<{ bookId: string }> };

export async function POST(
  req: NextRequest,
  { params }: Context
) {
  const { userId } = await auth();
  const { bookId } = await params;

  if (!userId) {
    logger.warn('API: Book reorder attempt without authentication.');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!bookId) {
    logger.warn({ userId }, 'API: Book reorder attempt missing bookId.');
    return NextResponse.json({ error: 'Missing bookId parameter' }, { status: 400 });
  }

  let validatedData;
  try {
    const body = await req.json();
    validatedData = reorderRequestSchema.parse(body);
    logger.info({ userId, bookId, pageCount: validatedData.pages.length }, 'API: Validated book reorder request.');
  } catch (error) {
    logger.warn({ userId, bookId, error }, 'API: Invalid book reorder request body.');
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request body', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { pages } = validatedData;

  try {
    // Verify user owns the book before proceeding
    const bookOwnerCheck = await prisma.book.findUnique({
      where: { id: bookId, userId: userId },
      select: { id: true }, // Select minimal field
    });

    if (!bookOwnerCheck) {
      logger.warn({ userId, bookId }, 'API: Reorder attempt failed - Book not found or user does not own it.');
      return NextResponse.json({ error: 'Book not found or you do not have permission.' }, { status: 403 }); // Forbidden or 404
    }

    // Use a transaction to update all page indices atomically
    await prisma.$transaction(async (tx) => {
      logger.info({ userId, bookId }, 'API: Starting page reorder transaction.');
      const updatePromises = pages.map(page => 
        tx.page.updateMany({ // Use updateMany to ensure page belongs to the correct book
          where: {
            id: page.pageId,
            bookId: bookId, // Ensure the page belongs to this book
          },
          data: {
            index: page.index,
            // Optionally update pageNumber as well if needed
            pageNumber: page.index + 1, 
          },
        })
      );
      const results = await Promise.all(updatePromises);
      
      // Optional: Check results to ensure all updates affected 1 row
      const failedUpdates = results.filter(result => result.count !== 1);
      if (failedUpdates.length > 0) {
         logger.error({ userId, bookId, failedUpdates }, 'API: Some pages failed to update during reorder transaction.');
         // Rollback happens automatically due to the error
         throw new Error('Failed to update one or more pages during reorder. Mismatched page IDs or book association?');
      }

      logger.info({ userId, bookId, updatedCount: results.length }, 'API: Page reorder transaction committed.');
    });

    return NextResponse.json({ message: 'Page order updated successfully' }, { status: 200 });

  } catch (error) {
    logger.error({ userId, bookId, error }, 'API: Error during page reorder transaction.');
    return NextResponse.json({ error: 'Failed to update page order' }, { status: 500 });
  }
} 