// Register module alias programmatically FIRST - REMOVE THIS BLOCK
// import path from 'path';
// import moduleAlias from 'module-alias';
// moduleAlias.addAlias('@', path.join(__dirname, '..', '..'));
// END REMOVE BLOCK

// Load environment variables next
import * as dotenv from 'dotenv';
dotenv.config();

import { Worker, Job } from 'bullmq';
// Remove .js extensions
import { QueueName, workerConnectionOptions } from '../../lib/queue/index'; 
import { StoryGenerationJobData } from '../../app/api/generate/story/route';
import { createVisionStoryGenerationPrompt, systemPrompt, StoryGenerationInput } from '../../lib/openai/prompts';
import openai from '../../lib/openai/index';
import { db } from '../../lib/db';
import { Prisma, Asset, BookStatus, PageType } from '@prisma/client';
import logger from '../../lib/logger';
import { z } from 'zod';

// Reverted: Zod schema for the expected multi-page OpenAI JSON response
const openAIResponseSchema = z.record(
    z.string().regex(/^\d+$/), // Key must be string representation of a number (e.g., "1", "2")
    z.string().min(1) // Value must be a non-empty string (the page text)
);

// Zod schema for the "Winkify" response structure
const winkifiedResponseSchema = z.record(
    z.string().regex(/^\d+$/), // Key is page number string "1", "2", etc.
    z.object({ // Value is an object
        text: z.string().min(1).describe("The story text for the page."), // Required text
        illustrationNotes: z.string().nullable().describe("Illustration suggestion or null."), // Notes or null
    })
);

// --- Job Processing Logic ---

// Use the imported job data type definition (matches API route)
type WorkerJobData = StoryGenerationJobData; 

async function processStoryGenerationJob(job: Job<WorkerJobData>): Promise<{ message: string; bookId: string; finalStatus: BookStatus }> {
  // Extract data from the job structure
  const { bookId, userId, promptContext, storyPages, isWinkifyEnabled } = job.data;
  
  // Add null/undefined checks just in case
  if (!userId || !bookId || !promptContext || !storyPages || storyPages.length === 0) {
    logger.error({ jobId: job.id, data: job.data }, 'Missing critical job data (userId, bookId, promptContext, or storyPages)');
    throw new Error('Invalid job data received.');
  }

  logger.info({ jobId: job.id, userId, bookId, bookTitle: promptContext.bookTitle, pageCount: storyPages.length }, 'Processing story generation job...');

  try {
    // Step 0: Update status to GENERATING
    await db.book.update({
      where: { id: bookId },
      data: { status: BookStatus.GENERATING }, // Use imported enum
    });
    logger.info({ jobId: job.id, bookId }, 'Book status updated to GENERATING');

    // --- Generate Text for ALL pages --- 

    // Step 1: Construct the prompt input using data directly from the job
    const promptInput: StoryGenerationInput = {
        ...promptContext, // Contains bookTitle, childName, artStyle, etc.
        storyPages: storyPages, // Pass the pre-filtered, pre-sorted pages array
        isWinkifyEnabled: isWinkifyEnabled,
        // isDoubleSpread needs to be in promptContext if still relevant
        isDoubleSpread: promptContext.isDoubleSpread || false 
    };

    logger.info({ jobId: job.id, bookId }, "Constructing story prompt...");
    const messageContent = createVisionStoryGenerationPrompt(promptInput);

    // Log the structured prompt being sent
    logger.info({ jobId: job.id, bookId, messages: JSON.stringify(messageContent, null, 2) }, "OpenAI Story Prompt Messages:");

    // Step 2: Call OpenAI API ONCE
    logger.info({ jobId: job.id, bookId }, "Calling OpenAI for full story...");
    const completion = await openai.chat.completions.create({
        model: "gpt-4o", // Or another vision-capable model
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: messageContent },
        ],
        // Use original parameters for full story generation
        max_tokens: 1500, 
        temperature: 0.7,
        response_format: { type: "json_object" }, // Explicitly ask for JSON
    });

    const rawResult = completion.choices[0]?.message?.content;
    logger.info({ jobId: job.id, bookId }, 'Received response from OpenAI.');

    if (!rawResult) {
        logger.error({ jobId: job.id, bookId }, 'OpenAI returned an empty response.');
        throw new Error('OpenAI returned an empty response.');
    }

    // Step 3: Cleanup and Parse the multi-page JSON response
    let jsonString = rawResult.trim();
    const regexMatch = jsonString.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/m);
    if (regexMatch && regexMatch[1]) {
        jsonString = regexMatch[1].trim();
    } else {
        const lines = jsonString.split('\n');
        if (lines.length >= 2 && lines[0].startsWith('```') && lines[lines.length - 1].endsWith('```')) {
            jsonString = lines.slice(1, -1).join('\n').trim();
        }
        if (jsonString.startsWith('```')) {
            jsonString = jsonString.substring(jsonString.indexOf('\n') + 1).trim();
        }
    }

    let parsedStoryData: Record<string, { text: string; illustrationNotes: string | null } | string>;
    try {
        const parsedJson = JSON.parse(jsonString);
        // Validate against the correct schema based on the flag
        if (isWinkifyEnabled) {
            parsedStoryData = winkifiedResponseSchema.parse(parsedJson);
            logger.info({ jobId: job.id, bookId, pageCount: Object.keys(parsedStoryData).length }, 'Successfully parsed WINKIFIED story JSON');
        } else {
            // Assign to compatible type, ensuring illustrationNotes is null
            const standardData = openAIResponseSchema.parse(parsedJson);
            parsedStoryData = Object.entries(standardData).reduce((acc, [key, value]) => {
                acc[key] = { text: value, illustrationNotes: null };
                return acc;
            }, {} as Record<string, { text: string; illustrationNotes: string | null }>);
            logger.info({ jobId: job.id, bookId, pageCount: Object.keys(parsedStoryData).length }, 'Successfully parsed STANDARD story JSON');
        }
    } catch (parseOrValidationError: any) {
        logger.error({ jobId: job.id, rawResult, jsonString, error: parseOrValidationError.message }, 'Failed to parse/validate OpenAI JSON response');
        const details = parseOrValidationError instanceof z.ZodError ? parseOrValidationError.errors : parseOrValidationError.message;
        throw new Error(`Failed to parse or validate AI response: ${JSON.stringify(details)}`);
    }

    // Step 4: Prepare page update promises
    const pageUpdatePromises: Promise<any>[] = [];
    for (const page of storyPages) {
        const pageNumberStr = String(page.pageNumber);
        let textContent: string | undefined | null = null;
        let notesContent: string | undefined | null = null;

        const pageData = parsedStoryData[pageNumberStr];

        if (typeof pageData === 'object' && pageData !== null) {
            // Winkified format (or standard format mapped to winkified)
            textContent = pageData.text;
            notesContent = pageData.illustrationNotes;
        }

        if (textContent) {
            logger.info({ jobId: job.id, pageId: page.pageId, textToSave: textContent }, "Preparing to update page text in DB");
            // Prepare update data, including illustrationNotes if available
            const updateData: Prisma.PageUpdateInput = {
                text: textContent,
                textConfirmed: false,
            };
            // Only add notes if winkify was enabled AND notes are not null/empty
            if (isWinkifyEnabled && notesContent && notesContent.trim() !== '') {
                updateData.illustrationNotes = notesContent;
            }
            pageUpdatePromises.push(
                db.page.update({
                    where: { id: page.pageId },
                    data: updateData,
                })
            );
        } else {
            logger.warn({ jobId: job.id, pageId: page.pageId, pageNumber: page.pageNumber }, `No text found in OpenAI response for page number ${page.pageNumber}. Skipping update.`);
        }
    }

    // Step 5: Execute all page updates
    if (pageUpdatePromises.length > 0) {
        logger.info({ jobId: job.id, bookId, count: pageUpdatePromises.length }, 'Updating generated page text in database...');
        await Promise.all(pageUpdatePromises);
        logger.info({ jobId: job.id, bookId }, 'Successfully updated page text.');
    } else {
        logger.warn({ jobId: job.id, bookId }, 'No pages were successfully processed to update text.');
        // Consider if this should mark the book as FAILED
    }

    // Step 6: Update final book status and token usage
    const usage = completion.usage; // Extract usage object
    const totalPromptTokens = usage?.prompt_tokens || 0;
    const totalCompletionTokens = usage?.completion_tokens || 0;
    const finalTotalTokens = usage?.total_tokens || 0;
    logger.info({ jobId: job.id, bookId, totalPromptTokens, totalCompletionTokens, finalTotalTokens }, 'Updating final book status and token counts.');
    await db.book.update({
        where: { id: bookId },
        data: {
            status: BookStatus.COMPLETED, // Use imported enum
            promptTokens: totalPromptTokens,
            completionTokens: totalCompletionTokens,
            totalTokens: finalTotalTokens,
        },
    });
    logger.info({ jobId: job.id, bookId }, 'Book status updated to COMPLETED and token counts stored.');

    return { message: `Processed ${pageUpdatePromises.length} pages.`, bookId: bookId, finalStatus: BookStatus.COMPLETED }; // Return summary

  } catch (error: any) {
    logger.error({ jobId: job.id, bookId, error: error.message }, 'Error processing story generation job');
    // Update status to FAILED on error
    try {
      await db.book.update({
        where: { id: bookId },
        data: { status: BookStatus.FAILED }, // Use imported enum
      });
      logger.info({ jobId: job.id, bookId }, 'Book status updated to FAILED');
    } catch (updateError: any) {
      logger.error({ jobId: job.id, bookId, error: updateError.message }, 'Failed to update book status to FAILED');
    }
    throw error; // Re-throw original error for BullMQ retry logic
  }
}

// --- Worker Initialization ---

logger.info('Initializing Story Generation Worker...');

const worker = new Worker<WorkerJobData>(
  QueueName.StoryGeneration,
  processStoryGenerationJob,
  {
    ...workerConnectionOptions,
    concurrency: 5, // Process up to 5 jobs concurrently (adjust as needed)
    removeOnComplete: { count: 1000 }, // Keep last 1000 completed jobs
    removeOnFail: { count: 5000 }, // Keep last 5000 failed jobs
  }
);

worker.on('completed', (job, result) => {
  logger.info({ jobId: job.id }, `Job completed.`);
});

worker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, error: err.message }, `Job failed.`);
});

worker.on('error', err => {
  logger.error({ error: err.message }, 'Worker error');
});

logger.info('Story Generation Worker started.');

// Graceful shutdown (optional but recommended)
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing worker...');
  await worker.close();
  logger.info('Worker closed.');
  process.exit(0);
}); 