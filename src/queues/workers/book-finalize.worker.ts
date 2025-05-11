import { Worker, Job } from 'bullmq';
import { db as prisma } from '@/lib/db';
import { QueueName, workerConnectionOptions } from '@/lib/queue/index';
import { BookStatus } from '@prisma/client';
import logger from '@/lib/logger';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config(); // Use standard dotenv loading

interface BookFinalizeJobData {
  bookId: string;
  userId: string;
}

async function processFinalizeBookJob(job: Job<BookFinalizeJobData>) {
  const { bookId, userId } = job.data;
  logger.info({ jobId: job.id, bookId, userId }, 'Processing book finalization job...');

  try {
    // 1. Fetch final page statuses for the book
    const pages = await prisma.page.findMany({
        where: { bookId: bookId },
        select: { 
            id: true, // Include id for potential logging/debugging
            pageNumber: true, // Include pageNumber for logging
            generatedImageUrl: true,
            moderationStatus: true 
        }
    });

    if (!pages || pages.length === 0) {
        logger.error({ jobId: job.id, bookId }, 'No pages found during finalization. Setting book status to FAILED.');
        await prisma.book.update({
            where: { id: bookId },
            data: { status: BookStatus.FAILED },
        });
        return { status: BookStatus.FAILED, reason: 'No pages found' };
    }

    // For enhanced debugging:
    const pageStatusesSummary = pages.reduce((acc, page) => {
      const statusKey = `${page.moderationStatus || 'UNKNOWN'}${page.generatedImageUrl ? '_WITH_IMAGE' : '_NO_IMAGE'}`;
      acc[statusKey] = (acc[statusKey] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    logger.info({ jobId: job.id, bookId, pageStatusesSummary, totalPages: pages.length }, 'Page statuses snapshot for finalization.');

    // 2. Determine final book status
    const totalPageCount = pages.length;
    // Count only pages that are OK and have an image URL
    const successfulPages = pages.filter(p => p.moderationStatus === "OK" && p.generatedImageUrl);
    // Count pages explicitly flagged (ignore other statuses like PENDING)
    const flaggedPages = pages.filter(p => p.moderationStatus === "FLAGGED");
    
    let finalBookStatus: BookStatus;
    if (successfulPages.length === totalPageCount) {
        finalBookStatus = BookStatus.COMPLETED; // Ready for preview/export
        logger.info({ jobId: job.id, bookId, pageCount: totalPageCount }, 'All pages OK. Setting book status to COMPLETED.');
    } else if (successfulPages.length > 0 || flaggedPages.length > 0) {
        // If at least one page is OK or one is FLAGGED, mark as PARTIAL
        finalBookStatus = BookStatus.PARTIAL;
        logger.warn({ jobId: job.id, bookId, okCount: successfulPages.length, flaggedCount: flaggedPages.length, totalCount: totalPageCount }, 'Some pages OK or flagged. Setting book status to PARTIAL.');
    } else {
        // If no pages succeeded and none were flagged (all failed implicitly or errored?), mark as FAILED
        finalBookStatus = BookStatus.FAILED;
        logger.error({ jobId: job.id, bookId, totalCount: totalPageCount }, 'No pages completed successfully or were flagged. Setting book status to FAILED.');
    }

    // 3. Update the book status
    await prisma.book.update({
      where: { id: bookId },
      data: { status: finalBookStatus },
    });
    logger.info({ jobId: job.id, bookId, finalStatus: finalBookStatus }, 'Final book status updated.');

    return { status: finalBookStatus };

  } catch (error: any) {
    logger.error({ jobId: job.id, bookId, error: error.message, stack: error.stack }, 'Error processing book finalization job');
    // Don't automatically set to FAILED here, let the job fail and potentially retry
    throw error; // Re-throw error for BullMQ
  }
}

// --- Worker Initialization ---

logger.info('Initializing Book Finalize Worker...');

const finalizeWorker = new Worker<BookFinalizeJobData>(
  QueueName.BookFinalize,
  processFinalizeBookJob,
  {
    ...workerConnectionOptions,
    concurrency: 5, // Can handle more finalization jobs concurrently
    removeOnComplete: { count: 500 }, 
    removeOnFail: { count: 1000 },
  }
);

finalizeWorker.on('completed', (job, result) => {
  logger.info({ jobId: job.id, bookId: job.data.bookId, finalStatus: result?.status }, `Book finalize job completed.`);
});

finalizeWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, bookId: job?.data?.bookId, error: err.message, stack: err.stack }, `Book finalize job failed.`);
});

finalizeWorker.on('error', err => {
  logger.error({ error: err.message }, 'Book finalize worker error');
});

logger.info('Book Finalize Worker started.');

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing book finalize worker...');
  await finalizeWorker.close();
  logger.info('Book finalize worker closed.');
  process.exit(0);
}); 