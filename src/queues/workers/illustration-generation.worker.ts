// Load environment variables next
import * as dotenv from 'dotenv';
import path from 'path'; // Import path

// Explicitly point dotenv to the root .env file using forward slashes
dotenv.config({ path: path.resolve(__dirname, '../../../', '.env') });

// --- DEBUGGING: Log environment variables as seen by the worker ---
console.log(`[ILLUS Worker] NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`[ILLUS Worker] LOG_LEVEL: ${process.env.LOG_LEVEL}`);
console.log('[ILLUS Worker] Logger forced to DEBUG level for this worker.'); // Add confirmation
// --- END DEBUGGING ---

import { Worker, Job } from 'bullmq';
// Remove .js extensions
import { QueueName, workerConnectionOptions } from '../../lib/queue/index';
// Import the job data type from the API route file
import { IllustrationGenerationJobData } from '../../app/api/generate/illustrations/route';
import { db } from '../../lib/db';
import { BookStatus, Page, Book, Prisma } from '@prisma/client';

// Add OpenAI SDK import
import OpenAI, { toFile } from 'openai';

import cloudinary from '../../lib/cloudinary';
import logger from '../../lib/logger'; // Re-enable standard logger

// Use require for the new CJS prompt library
const { createIllustrationPrompt, STYLE_LIBRARY } = require('@/lib/ai/styleLibrary.cjs'); 

// --- Initialize OpenAI Client --- 
const openaiApiKey = process.env.OPENAI_API_KEY;
if (!openaiApiKey) {
  logger.error('OPENAI_API_KEY is not set in environment variables.');
}
const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;
// --- End OpenAI Client Init ---

// --- Define Local Type for Fetched Book Data ---
// Ensure this includes fields needed by the new prompt options
type FetchedPageData = {
  id: string;
  pageNumber: number;
  text: string | null;
  originalImageUrl: string | null;
  generatedImageUrl: string | null;
  isTitlePage?: boolean | null; // Add the optional isTitlePage flag
};
type FetchedBookData = Book & { // Book includes artStyle, tone, theme, etc. 
  pages: FetchedPageData[]; 
};

// --- Job Processing Logic ---

async function processIllustrationGenerationJob(job: Job<IllustrationGenerationJobData>) {
  // Extract all necessary fields from the detailed job data
  logger.info({ jobId: job.id, receivedData: job.data }, "Received illustration job data"); // Temporarily changed to info
  const { 
    userId, bookId, pageId, pageNumber, text, 
    artStyle, tone, theme, bookTitle, isTitlePage,
    illustrationNotes, originalImageUrl,
    isWinkifyEnabled
  } = job.data;
  logger.info({ jobId: job.id, userId, bookId }, 'Processing illustration generation job...');

  // Use the specific local type for the book variable
  // No longer need to fetch the full book here, we have the data
  // let book: FetchedBookData | null = null;

  try {
    // We process ONE page per job now
    // TODO: Optional check: Fetch the current page status? 
    // Maybe not necessary if we trust the queue/job state.

    // **** DEBUG: Check isTitlePage flag ****
    logger.debug({ jobId: job.id, pageNumber: pageNumber, isTitleFlagValue: isTitlePage }, 'Value of isTitlePage for current page');
    // **************************************

    logger.info({ jobId: job.id, bookId, pageId, pageNumber }, 'Generating illustration for page...');

    // --- Step 2a: Fetch original image data and get buffer --- 
    let originalImageBuffer: Buffer | null = null;
    let originalImageMimeType: string | null = null;

    // Ensure page.originalImageUrl is not null before using it
    if (originalImageUrl) {
        try {
            logger.info({ jobId: job.id, pageNumber: pageNumber }, `Fetching original image from ${originalImageUrl}`);
            const imageResponse = await fetch(originalImageUrl);
            if (!imageResponse.ok) {
                throw new Error(`Failed to fetch original image: ${imageResponse.status} ${imageResponse.statusText}`);
            }

            // Get content type from header or infer
            const contentTypeHeader = imageResponse.headers.get('content-type');
            if (contentTypeHeader?.startsWith('image/')) {
                originalImageMimeType = contentTypeHeader;
            } else {
                const extension = originalImageUrl.split('.').pop()?.toLowerCase();
                if (extension === 'jpg' || extension === 'jpeg') originalImageMimeType = 'image/jpeg';
                else if (extension === 'png') originalImageMimeType = 'image/png';
                else originalImageMimeType = 'image/jpeg'; // Default
            }

            // Store buffer directly
            const imageArrayBuffer = await imageResponse.arrayBuffer();
            originalImageBuffer = Buffer.from(imageArrayBuffer);
            logger.info({ jobId: job.id, pageNumber: pageNumber }, `Successfully fetched and stored original image (${originalImageMimeType}).`);

        } catch (fetchError: any) {
            logger.error({ jobId: job.id, pageId, pageNumber, error: fetchError.message }, 'Failed to fetch or store original image.');
            throw fetchError; // Fail the job if image fetch fails
        }
    } else {
         logger.error({ jobId: job.id, pageId, pageNumber }, 'Original image URL is missing in job data.');
         throw new Error('Missing originalImageUrl for illustration generation.');
    }
    // --- End Step 2a ---

    // Check for buffer instead of base64 string
    if (!originalImageBuffer || !originalImageMimeType) {
        logger.error({ jobId: job.id, pageId, pageNumber }, 'Missing image buffer or mime type after fetch attempt.');
        throw new Error('Image buffer or mime type missing after fetch.');
    }

    // --- Step 2b: Create OpenAI prompt using new function --- 
    const promptInput = {
        // Use the style key directly from the book record
        style: artStyle as keyof typeof STYLE_LIBRARY | undefined ?? 'cartoonBrights', 
        theme: theme,
        tone: tone,
        pageText: text,
        bookTitle: bookTitle,
        isTitlePage: isTitlePage,
        illustrationNotes: illustrationNotes,
        isWinkifyEnabled: isWinkifyEnabled
    };
    // Call the NEW prompt function
    logger.info({ jobId: job.id, pageId, promptInput }, "Constructed promptInput for createIllustrationPrompt"); // Temporarily changed to info
    const textPrompt = createIllustrationPrompt(promptInput);
    logger.info({ jobId: job.id, pageId, pageNumber }, 'Generated OpenAI illustration prompt.');
    logger.info({ jobId: job.id, pageId, pageNumber, prompt: textPrompt }, 'OpenAI Illustration Prompt Text:'); // Changed to info
    // --- End Step 2b ---

    // --- Step 2c, 2d: Call OpenAI Edit API and Handle Response --- 
    let generatedImageBase64: string | null = null;
    let moderationBlocked = false; // Flag for moderation rejection
    let moderationReasonText: string | null = null; // Reason if blocked
    try {
       if (!openai) throw new Error("OpenAI Client not initialized.");
       if (!originalImageBuffer) throw new Error("Original image buffer missing.");
       const fileExtension = originalImageMimeType?.split('/')[1] || 'jpg';
       const fileName = `page_${pageNumber}_original.${fileExtension}`;
       const imageFile = await toFile(
           originalImageBuffer,
           fileName,
           { type: originalImageMimeType }
       );
       logger.info({ jobId: job.id, pageId, pageNumber }, 'Calling OpenAI Images Edit API...');

       const result = await openai.images.edit({
           model: "gpt-image-1",
           image: imageFile,
           prompt: textPrompt, // Use the newly generated prompt
           n: 1,
           size: "1024x1024",
           // response_format removed
       });

       logger.info({ jobId: job.id, pageId, pageNumber }, 'Received response from OpenAI.');

        // Check for content policy violations (example structure, adjust if needed)
        // NOTE: The exact structure for moderation feedback in the edit endpoint isn't 
        // clearly documented; this assumes a similar pattern to other endpoints.
        // We might need to inspect the raw `result` object if this doesn't work.
        if (result?.data?.[0]?.revised_prompt && result.data[0].revised_prompt !== textPrompt) {
            logger.warn({ jobId: job.id, pageId, pageNumber, original: textPrompt, revised: result.data[0].revised_prompt }, 'OpenAI revised the prompt.');
            // Decide if revision constitutes a failure or just a warning
        }
        // Check common safety/error fields (adjust based on actual API errors)
        // For example, DALL-E errors might be in error field or data might be empty with a flag
        // Let's assume for now a missing b64_json might indicate blocking or error

        const b64ImageData = result.data[0]?.b64_json;
        if (b64ImageData) {
            generatedImageBase64 = b64ImageData;
            logger.info({ jobId: job.id, pageId, pageNumber }, 'Extracted generated image data (b64_json).');
        } else {
            // If no image data, assume failure/blocking
            moderationBlocked = true;
            moderationReasonText = "Image generation failed or blocked by content policy."; // Generic reason
            // Attempt to get more specific reason if possible from API response structure
            // (e.g., result.error?.message, result.data[0]?.error, etc. - Inspect `result` object)
            logger.warn({ jobId: job.id, pageId, pageNumber, response: JSON.stringify(result) }, 'OpenAI response did not contain b64_json image data.');
        }

    } catch (apiError: any) {
        logger.error({ 
            jobId: job.id, 
            pageId, 
            pageNumber: pageNumber, 
            error: apiError instanceof Error ? apiError.message : String(apiError),
            ...(apiError?.response?.data && { responseData: apiError.response.data }) 
        }, 'Error calling OpenAI Images Edit API.');
        moderationBlocked = true; // Treat API errors as generation failure
        moderationReasonText = apiError instanceof Error ? apiError.message : String(apiError);
        // No need to `continue` here, we want to update the page status below
    }
    // --- End Step 2c & 2d ---
    
    // --- Step 2e: Upload generated buffer to Cloudinary (only if not blocked) --- 
    let finalImageUrl: string | undefined = undefined;
    if (generatedImageBase64 && !moderationBlocked) {
      try {
          logger.info({ jobId: job.id, pageId, pageNumber }, 'Decoding and uploading generated image to Cloudinary...');
          const generatedImageBuffer = Buffer.from(generatedImageBase64, 'base64');
          
          // Upload buffer to Cloudinary
          const uploadResult = await new Promise<any>((resolve, reject) => {
               cloudinary.uploader.upload_stream(
                   {
                       folder: `storywink/${bookId}/generated`, 
                       public_id: `page_${pageNumber}`,
                       overwrite: true,
                       tags: [`book:${bookId}`, `page:${pageId}`, `pageNum:${pageNumber}`],
                       resource_type: "image"
                   },
                   (error, result) => {
                       if (error) { reject(error); } else { resolve(result); }
                   }
               ).end(generatedImageBuffer);
          });

          if (!uploadResult?.secure_url) {
              throw new Error('Cloudinary upload did not return a secure URL.');
          }
          finalImageUrl = uploadResult.secure_url;
          logger.info({ jobId: job.id, pageId, pageNumber, cloudinaryUrl: finalImageUrl }, 'Successfully uploaded generated image to Cloudinary');

      } catch (uploadError: any) {
          logger.error({ jobId: job.id, pageId, pageNumber, error: uploadError.message }, 'Failed to upload generated image to Cloudinary.');
          // If upload fails after generation, mark as failed for this page
          moderationBlocked = true;
          moderationReasonText = moderationReasonText || `Cloudinary upload failed: ${uploadError.message}`;
      }
    } else if (!moderationBlocked) {
        // This case means API call succeeded but somehow no base64 data was extracted - treat as failure
        logger.warn({ jobId: job.id, pageId, pageNumber }, 'Skipping Cloudinary upload because no image data was generated/extracted.');
        moderationBlocked = true;
        moderationReasonText = moderationReasonText || "Image data extraction failed after API call.";
    }
    // --- End Step 2e --- 

    // --- Step 2f: Update Page Status and URL --- 
    // Update the specific page record
    try {
        await db.page.update({
            where: { id: pageId }, // Use pageId received in job data
            data: {
                // Set URL only if successful
                generatedImageUrl: !moderationBlocked ? finalImageUrl : null,
                // Set status based on outcome
                moderationStatus: moderationBlocked ? "FLAGGED" : "OK", // Use FLAGGED for any failure/block
                moderationReason: moderationReasonText,
            },
        });
        logger.info({ 
            jobId: job.id, 
            pageId, 
            pageNumber: pageNumber, 
            status: moderationBlocked ? "FLAGGED" : "OK",
            reason: moderationReasonText
        }, 'Page status updated.');
    } catch (dbError: any) {
         logger.error({ jobId: job.id, pageId, pageNumber, error: dbError.message }, 'Failed to update page status in database.');
         // This is a more critical error, might warrant failing the job
         throw dbError; 
    }
  } catch (error: any) {
    logger.error({ jobId: job.id, bookId, error: error.message, stack: error.stack }, 'Error processing illustration generation job');
    // TODO: Optionally update page status to FAILED here if needed? 
    // Currently, the job will fail and might be retried by BullMQ.
    // No longer updating book status here on error.
    throw error; // Re-throw original error for BullMQ retry logic
  }
}

// --- Worker Initialization ---

logger.info('Initializing Illustration Generation Worker (OpenAI Mode)...');

const worker = new Worker<IllustrationGenerationJobData>(
  QueueName.IllustrationGeneration,
  processIllustrationGenerationJob,
  {
    ...workerConnectionOptions,
    concurrency: 1, // Keep concurrency 1 for now
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  }
);

worker.on('completed', (job) => {
  logger.info({ jobId: job.id }, `Illustration job completed.`);
});

worker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, error: err.message, stack: err.stack }, `Illustration job failed.`);
});

worker.on('error', err => {
  logger.error({ error: err.message }, 'Illustration worker error');
});

logger.info('Illustration Generation Worker started (OpenAI Mode).');

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing illustration worker...');
  await worker.close();
  logger.info('Illustration worker closed.');
  process.exit(0);
}); 