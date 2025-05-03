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
import { FileLike } from 'openai/uploads'; // Import FileLike for casting

import cloudinary from '../../lib/cloudinary';
import logger from '../../lib/logger'; // Re-enable standard logger

// Use require for the new CJS prompt library - ENSURE THE PATH IS CORRECT
// Assuming styleLibrary.ts is compiled to styleLibrary.cjs in the same relative location
const { createIllustrationPrompt, STYLE_LIBRARY } = require('@/lib/ai/styleLibrary.cjs');
// Import the TYPE separately for TypeScript usage
import type { StyleKey } from '@/lib/ai/styleLibrary';

// --- Initialize OpenAI Client --- 
const openaiApiKey = process.env.OPENAI_API_KEY;
if (!openaiApiKey) {
  logger.error('OPENAI_API_KEY is not set in environment variables.');
}
const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;
// --- End OpenAI Client Init ---

// --- Job Processing Logic ---

async function processIllustrationGenerationJob(job: Job<IllustrationGenerationJobData>) {
  // Extract all necessary fields from the detailed job data
  logger.info({ jobId: job.id, receivedData: job.data }, "Received illustration job data");
  const { 
    userId, bookId, pageId, pageNumber, text, 
    artStyle, bookTitle, isTitlePage,
    illustrationNotes, originalImageUrl,
    isWinkifyEnabled
  } = job.data;
  logger.info({ jobId: job.id, userId, bookId }, 'Processing illustration generation job...');

  try {
    logger.info({ jobId: job.id, bookId, pageId, pageNumber }, 'Generating illustration for page...');

    // --- Step 1: Fetch Original Content Image --- 
    let contentImageBuffer: Buffer | null = null;
    let contentImageMimeType: string | null = null;

    if (originalImageUrl) {
        try {
            logger.info({ jobId: job.id, pageNumber: pageNumber }, `Fetching original content image from ${originalImageUrl}`);
            const imageResponse = await fetch(originalImageUrl);
            if (!imageResponse.ok) {
                throw new Error(`Failed to fetch content image: ${imageResponse.status} ${imageResponse.statusText}`);
            }
            const contentTypeHeader = imageResponse.headers.get('content-type');
            contentImageMimeType = contentTypeHeader?.startsWith('image/') 
                ? contentTypeHeader 
                : (originalImageUrl.endsWith('.png') ? 'image/png' : 'image/jpeg'); // Infer simply
            
            const imageArrayBuffer = await imageResponse.arrayBuffer();
            contentImageBuffer = Buffer.from(imageArrayBuffer);
            logger.info({ jobId: job.id, pageNumber: pageNumber }, `Fetched content image (${contentImageMimeType}).`);
        } catch (fetchError: any) {
            logger.error({ jobId: job.id, pageId, pageNumber, error: fetchError.message }, 'Failed to fetch content image.');
            throw fetchError;
        }
    } else {
         logger.error({ jobId: job.id, pageId, pageNumber }, 'Original content image URL is missing.');
         throw new Error('Missing originalImageUrl for illustration generation.');
    }
    if (!contentImageBuffer || !contentImageMimeType) {
        logger.error({ jobId: job.id, pageId, pageNumber }, 'Content image buffer or mime type missing.');
        throw new Error('Content image buffer/mime type missing.');
    }
    // --- End Step 1 ---

    // --- Step 2: Fetch Style Reference Image --- 
    let styleReferenceBuffer: Buffer | null = null;
    let styleReferenceMimeType: string | null = null;
    const styleKey = artStyle as StyleKey; // Cast artStyle using the imported StyleKey type
    const styleData = STYLE_LIBRARY[styleKey];
    const styleReferenceUrl = styleData?.referenceImageUrl;

    if (styleReferenceUrl) {
         try {
            logger.info({ jobId: job.id, pageNumber: pageNumber }, `Fetching style reference image from ${styleReferenceUrl}`);
            const styleResponse = await fetch(styleReferenceUrl);
            if (!styleResponse.ok) {
                throw new Error(`Failed to fetch style image: ${styleResponse.status} ${styleResponse.statusText}`);
            }
            const styleContentTypeHeader = styleResponse.headers.get('content-type');
            styleReferenceMimeType = styleContentTypeHeader?.startsWith('image/') 
                ? styleContentTypeHeader 
                : (styleReferenceUrl.endsWith('.png') ? 'image/png' : 'image/jpeg'); // Infer simply
            
            const styleArrayBuffer = await styleResponse.arrayBuffer();
            styleReferenceBuffer = Buffer.from(styleArrayBuffer);
            logger.info({ jobId: job.id, pageNumber: pageNumber }, `Fetched style reference image (${styleReferenceMimeType}).`);
        } catch (fetchError: any) {
            logger.error({ jobId: job.id, pageId, pageNumber, styleKey, error: fetchError.message }, 'Failed to fetch style reference image.');
            throw fetchError; 
        }
    } else {
         logger.error({ jobId: job.id, pageId, pageNumber, styleKey }, 'Style reference image URL is missing for the selected style.');
         throw new Error(`Missing referenceImageUrl for style: ${styleKey}`);
    }
    if (!styleReferenceBuffer || !styleReferenceMimeType) {
        logger.error({ jobId: job.id, pageId, pageNumber }, 'Style reference image buffer or mime type missing.');
        throw new Error('Style reference image buffer/mime type missing.');
    }
    // --- End Step 2 ---

    // --- Step 3: Create OpenAI prompt using the updated function --- 
    const promptInput = {
        style: styleKey, 
        pageText: text,
        bookTitle: bookTitle,
        isTitlePage: isTitlePage,
        illustrationNotes: illustrationNotes,
        isWinkifyEnabled: isWinkifyEnabled
    };
    logger.info({ jobId: job.id, pageId, promptInput }, "Constructed promptInput for createIllustrationPrompt");
    const textPrompt = createIllustrationPrompt(promptInput);
    logger.info({ jobId: job.id, pageId, pageNumber }, 'Generated OpenAI illustration prompt for two-image input.');
    logger.info({ jobId: job.id, pageId, pageNumber, promptLength: textPrompt.length }, 'OpenAI Illustration Prompt Text: [REDACTED - check logs if needed]');
    // --- End Step 3 ---

    // --- Step 4: Prepare files for API Call --- 
    if (!openai) throw new Error("OpenAI Client not initialized.");
    
    const contentFileExt = contentImageMimeType?.split('/')[1] || 'jpg';
    const contentFileName = `page_${pageNumber}_content.${contentFileExt}`;
    const contentImageFile = await toFile(
        contentImageBuffer,
        contentFileName,
        { type: contentImageMimeType }
    );
    logger.info({ jobId: job.id, pageId, pageNumber }, 'Prepared content image file for API.');

    const styleFileExt = styleReferenceMimeType?.split('/')[1] || 'jpg';
    const styleFileName = `${styleKey}_ref.${styleFileExt}`;
    const styleReferenceImageFile = await toFile(
        styleReferenceBuffer,
        styleFileName,
        { type: styleReferenceMimeType }
    );
    logger.info({ jobId: job.id, pageId, pageNumber }, 'Prepared style reference image file for API.');

    // Create the array of FileLike objects for the API call
    const imageInputArray: FileLike[] = [contentImageFile, styleReferenceImageFile];
    // --- End Step 4 ---

    // --- Step 5: Call OpenAI Edit API with TWO images and Handle Response --- 
    let generatedImageBase64: string | null = null;
    let moderationBlocked = false; // Flag for moderation rejection
    let moderationReasonText: string | null = null; // Reason if blocked
    try {
       logger.info({ jobId: job.id, pageId, pageNumber }, 'Calling OpenAI Images Edit API with two images...');

       const result = await openai.images.edit({
           model: "gpt-image-1",
           image: imageInputArray as any, // Cast to any to bypass Uploadable type check for array
           prompt: textPrompt, 
           n: 1,
           size: "1024x1024", // <--- Reverted size parameter back to square
       });

       logger.info({ jobId: job.id, pageId, pageNumber }, 'Received response from OpenAI (two-image edit).');

        // Moderation checks (remain similar, adapt as needed)
        if (result?.data?.[0]?.revised_prompt && result.data[0].revised_prompt !== textPrompt) {
            logger.warn({ jobId: job.id, pageId, pageNumber, originalLength: textPrompt.length, revisedLength: result.data[0].revised_prompt.length }, 'OpenAI revised the prompt (check details in full logs if needed).');
        }

        const b64ImageData = result.data[0]?.b64_json;
        if (b64ImageData) {
            generatedImageBase64 = b64ImageData;
            logger.info({ jobId: job.id, pageId, pageNumber }, 'Extracted generated image data (b64_json).');
        } else {
            moderationBlocked = true;
            moderationReasonText = "Image generation failed or blocked by content policy (no b64_json data)."; 
            logger.warn({ jobId: job.id, pageId, pageNumber, response: JSON.stringify(result) }, 'OpenAI response did not contain b64_json image data.');
        }

    } catch (apiError: any) {
        logger.error({ 
            jobId: job.id, 
            pageId, 
            pageNumber: pageNumber, 
            error: apiError instanceof Error ? apiError.message : String(apiError),
            ...(apiError?.response?.data && { responseData: apiError.response.data }) 
        }, 'Error calling OpenAI Images Edit API (two-image edit).');
        moderationBlocked = true; // Treat API errors as generation failure
        moderationReasonText = apiError instanceof Error ? apiError.message : String(apiError);
    }
    // --- End Step 5 ---
    
    // --- Step 6: Upload generated buffer to Cloudinary (only if not blocked) --- 
    let finalImageUrl: string | undefined = undefined;
    if (generatedImageBase64 && !moderationBlocked) {
      try {
          logger.info({ jobId: job.id, pageId, pageNumber }, 'Decoding and uploading generated image to Cloudinary...');
          const generatedImageBuffer = Buffer.from(generatedImageBase64, 'base64');
          
          const uploadResult = await new Promise<any>((resolve, reject) => {
               cloudinary.uploader.upload_stream(
                   {
                       folder: `storywink/${bookId}/generated`, 
                       public_id: `page_${pageNumber}`,
                       overwrite: true,
                       tags: [`book:${bookId}`, `page:${pageId}`, `pageNum:${pageNumber}`, `style:${styleKey}`], // Added style tag
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
          moderationBlocked = true;
          moderationReasonText = moderationReasonText || `Cloudinary upload failed: ${uploadError.message}`;
      }
    } else if (!moderationBlocked) {
        logger.warn({ jobId: job.id, pageId, pageNumber }, 'Skipping Cloudinary upload because no image data was generated/extracted.');
        moderationBlocked = true;
        moderationReasonText = moderationReasonText || "Image data extraction failed after API call.";
    }
    // --- End Step 6 --- 

    // --- Step 7: Update Page Status and URL --- 
    try {
        await db.page.update({
            where: { id: pageId },
            data: {
                generatedImageUrl: !moderationBlocked ? finalImageUrl : null,
                moderationStatus: moderationBlocked ? "FLAGGED" : "OK",
                moderationReason: moderationReasonText,
            },
        });
        logger.info({ 
            jobId: job.id, 
            pageId, 
            pageNumber: pageNumber, 
            status: moderationBlocked ? "FLAGGED" : "OK",
            reason: moderationReasonText // Log reason even on OK for potential revisions
        }, 'Page status updated.');
    } catch (dbError: any) {
         logger.error({ jobId: job.id, pageId, pageNumber, error: dbError.message }, 'Failed to update page status in database.');
         throw dbError; 
    }
    // --- End Step 7 ---

  } catch (error: any) {
    logger.error({ jobId: job.id, bookId, error: error.message, stack: error.stack }, 'Error processing illustration generation job');
    // Optionally update page status to FAILED here if needed
    // Consider adding a specific status like 'GENERATION_FAILED'?
    try {
      await db.page.update({
        where: { id: pageId },
        data: { 
          moderationStatus: 'FAILED', 
          moderationReason: `Job failed: ${error.message}`.slice(0, 1000) // Limit reason length
        }
      });
    } catch (dbUpdateError: any) {
       logger.error({ jobId: job.id, bookId, error: dbUpdateError.message }, 'Failed to update page status to FAILED after job error.');
    }
    throw error; // Re-throw original error for BullMQ retry logic
  }
}

// --- Worker Initialization --- (Concurrency remains at 9 as per previous change)

logger.info('Initializing Illustration Generation Worker (OpenAI Two-Image Edit Mode)...');

const worker = new Worker<IllustrationGenerationJobData>(
  QueueName.IllustrationGeneration,
  processIllustrationGenerationJob,
  {
    ...workerConnectionOptions,
    concurrency: 9, // Keep concurrency 9 as previously set
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

logger.info('Illustration Generation Worker started (OpenAI Two-Image Edit Mode).');

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing illustration worker...');
  await worker.close();
  logger.info('Illustration worker closed.');
  process.exit(0);
}); 