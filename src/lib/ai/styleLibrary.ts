/* eslint-disable @typescript-eslint/no-var-requires */
// Using CommonJS syntax as this file is required by workers run via ts-node

// Import logger (assuming relative path works, adjust if needed)
import logger from '@/lib/logger';

// Define the new style library
const STYLE_LIBRARY = {
  anime: {
    label: 'Anime',
    referenceImageUrl: 'https://res.cloudinary.com/storywink/image/upload/v1746284318/Anime_USETHIS_qmgm0i.png',
  },
  pen: {
    label: 'Pen',
    referenceImageUrl: 'https://res.cloudinary.com/storywink/image/upload/v1746283996/pen_USETHIS_nqfnel.png',
  },
  watercolor: {
    label: 'Watercolor',
    referenceImageUrl: 'https://res.cloudinary.com/storywink/image/upload/v1746284308/Watercolor_USETHIS3_n2giqf.png',
  },
  modern: {
    label: 'Modern',
    referenceImageUrl: 'https://res.cloudinary.com/storywink/image/upload/v1746283996/modern_USETHIS_dukxgz.png',
  },
  pencil: {
    label: 'Pencil',
    referenceImageUrl: 'https://res.cloudinary.com/storywink/image/upload/v1746283997/pencil_USEHTIS_htcslm.png',
  },
  bwPlusOne: { // Using camelCase for the key
    label: 'B&W +1 Color',
    referenceImageUrl: 'https://res.cloudinary.com/storywink/image/upload/v1746283997/bw_1col_USETHIS_pvbovo.png',
    description: "As per the reference image, black and white EXCEPT exactly one prominent object (not people) of the model's choosing",
  },
} as const;

// Type for the structure of each style object
interface StyleDefinition {
  label: string;
  referenceImageUrl: string;
  description?: string | null; // Added optional description field
}

// Update StyleKey type to reflect the new keys
type StyleKey = keyof typeof STYLE_LIBRARY;

// Ensure the library conforms to the type (for safety, though `as const` helps)
const TypedStyleLibrary: Record<StyleKey, StyleDefinition> = STYLE_LIBRARY;

// Simplified Interface - Removed theme and tone
interface IllustrationPromptOptions {
  style: StyleKey;
  pageText: string | null;
  bookTitle: string | null;
  isTitlePage?: boolean;
  illustrationNotes?: string | null; // For Winkify or general notes
  isWinkifyEnabled?: boolean;
}

const MAX_PROMPT_CHARS = 30000; // gpt-image-1 safe ceiling (Adjust if needed)

// Rewritten function using simplified options
export function createIllustrationPrompt(
  opts: IllustrationPromptOptions
): string {
  logger.info({ optionsReceived: opts }, `[createIllustrationPrompt] Received opts`);

  // Get the style definition including the optional description
  const styleDefinition = TypedStyleLibrary[opts.style];
  const styleDescription = styleDefinition?.description;

  // Base instructions defining the roles of the two input images
  const base = [
    `Task: Apply the artistic style from the second input image (Style Reference) to the content of the first input image (Content Source).`,
    `Content Source (Image 1): Use this image EXCLUSIVELY for all content elements: characters, objects, faces, poses, and the overall background layout. Preserve these content elements and their composition exactly as they appear in Image 1. Do not add, remove, or significantly alter any content from Image 1.`,
    `Style Source (Image 2): Use this image PURELY as the visual reference for the artistic style. Apply its color palette, texture, line work, shading, rendering techniques, and overall aesthetic faithfully to the content derived from Image 1. The style should ONLY come from Image 2.${styleDescription ? ` Specific Style Notes: ${styleDescription}` : ''}`,
  ];

  // Winkify specific instructions (added only if enabled and notes exist)
  const winkBits = opts.isWinkifyEnabled && opts.illustrationNotes
    ? [
        'Subtle Dynamic Effects: Enhance the action with effects like zoom lines, sparkles, or motion blur, covering less than 20% of the scene. These effects should NOT alter the core characters, faces, or poses derived from Image 1. Apply effects in the style derived from Image 2.',
        `Specific Effect Request: ${opts.illustrationNotes}.`,
      ]
    : [];

  // Page-specific instructions (Title vs Story) - Simplified
  const titleBits = opts.isTitlePage
    ? [ // Title Page specific instructions
        `Book Title Integration: Integrate the book title "${opts.bookTitle}" naturally within the scene. Ensure it is highly legible and does not obscure key details from Image 1 content. The title's visual style (font, color, placement) should be inspired by text elements or the overall aesthetic found in the Style Source (Image 2).`,,
      ]
    : [ // Story Page specific instructions
        // Removed text cloud logic, direct replication instruction
        `Text Rendering: Render the following text exactly once within the image: "${(opts.pageText ?? '').trim()}". Replicate the exact font style, size, color, and positioning characteristics demonstrated by the text elements present in the Style Source (Image 2). Ensure all provided text is fully visible and not cut off.`,
        // tone removed
      ];

  // Combine all parts: Base + Winkify (if applicable) + Page-Specific
  const prompt = [...base, ...winkBits, ...titleBits]
    .filter(Boolean) // Remove any null/undefined/empty parts
    .join(' '); // Join with spaces

  // Truncate if necessary
  const finalPrompt = prompt.length > MAX_PROMPT_CHARS
    ? prompt.slice(0, MAX_PROMPT_CHARS - 1) + '…' // Use ellipsis
    : prompt;

  logger.info({ finalPromptLength: finalPrompt.length }, "[createIllustrationPrompt] Generated final prompt"); // Log length
  return finalPrompt;
}

// Exports for other modules
export { STYLE_LIBRARY, TypedStyleLibrary };
export type { StyleKey, IllustrationPromptOptions, StyleDefinition };

// Removed CommonJS export block comment 