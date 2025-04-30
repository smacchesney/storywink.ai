/* eslint-disable @typescript-eslint/no-var-requires */
// Using CommonJS syntax as this file is required by workers run via ts-node

// Import logger (assuming relative path works, adjust if needed)
import logger from '@/lib/logger';

const STYLE_LIBRARY = {
  cartoonBrights: {
    label: 'Cartoon Brights',
    descriptor:
      'bold flat shading, thick 6-px clean black outlines, smooth digital vector look, sample all colours and overall layout directly from the reference photo',
  },
  softWatercolor: {
    label: 'Soft Watercolor',
    descriptor:
      'loose watercolor wash on cold-press paper, no hard outlines, soft edge bleeding, subtle paper texture, reuse the hues and composition of the reference photo',
  },
  crayonScribble: {
    label: 'Crayon Scribble',
    descriptor:
      'wax-crayon strokes with visible grain, wobbly hand-drawn outlines, uneven fill, child-like energy, colours should be sampled from the reference photo',
  },
  digitalGouache: {
    label: 'Digital Gouache',
    descriptor:
      'opaque gouache strokes with dry-brush texture, chunky shapes, flat perspective, soft paper tooth, colour choices mirror the reference photo',
  },
  paperCutCollage: {
    label: 'Paper-Cut Collage',
    descriptor:
      'layered coloured-paper shapes with subtle drop shadows, crisp scissor edges, slight 3-D feel, replicate the colour palette and subject placement from the reference photo',
  },
  pixelQuest: {
    label: 'Pixel Quest',
    descriptor:
      'retro 16-bit pixel art, 1-px black outlines, visible dithering, blocky 64x64 grid then upscaled, derive sprite colours and layout from the reference photo', // Corrected 64x64
  },
  kawaiiMinimal: {
    label: 'Kawaii Minimal',
    descriptor:
      'super-deformed cute style, big round eyes, 2-px pastel outlines, minimal details, soft gradients, take colours and object positions from the reference photo',
  },
  chalkboard: {
    label: 'Chalkboard',
    descriptor:
      'white chalk strokes on dusty dark-green chalkboard, slightly smeared edges, hand lettering feel, chalk dust particles; copy shapes from the reference photo',
  },
} as const;

type StyleKey = keyof typeof STYLE_LIBRARY;

interface IllustrationPromptOptions {
  style: StyleKey;
  theme: string | null;
  tone: string | null;
  pageText: string | null;
  bookTitle: string | null;
  isTitlePage?: boolean;
  illustrationNotes?: string | null;
  isWinkifyEnabled?: boolean; // Include Winkify flag
}

const MAX_PROMPT_CHARS = 30000; // gpt-image-1 safe ceiling (Adjust if needed for actual model)

export function createIllustrationPrompt(
  opts: IllustrationPromptOptions
): string {
  // **** TEMP LOG: Log received options at INFO level ****
  logger.info({ optionsReceived: opts }, `[createIllustrationPrompt] Received opts`);
  // ***************************************************

  const styleDesc = STYLE_LIBRARY[opts.style]?.descriptor ??
    STYLE_LIBRARY.cartoonBrights.descriptor;

  // Base instructions common to both
  const base = [
    `Style: ${styleDesc}.`,
    'Preserve every face, pose and background layout from the reference exactly.',
    'Maintain original colour palette. White balance 6000 K.',
  ];

  // Winkify specific instructions (added only if enabled and notes exist)
  const winkBits = opts.isWinkifyEnabled && opts.illustrationNotes
    ? [
        'Add subtle dynamic effects (zoom lines, sparkles, motion blur) to enhance action without altering characters or faces. Effects should cover less than 20% of the scene.', // Fixed <= symbol
        `Creative effect: ${opts.illustrationNotes}.`,
      ]
    : [];

  // Page-specific instructions (Title vs Story)
  const titleBits = opts.isTitlePage
    ? [ // Title Page specific instructions
        `Integrate the book title "${opts.bookTitle}" in-scene, highly legible, not blocking key details.`,
        opts.theme && `Theme: ${opts.theme}.`,
        opts.tone && `Mood: ${opts.tone}.`,
        'Create a captivating 1024x1024 cover image.', // Corrected size format
        // Ensure title page doesn't get text cloud instructions
      ]
    : [ // Story Page specific instructions
        'Add a soft-edged white text container cloud (70% opacity) for the narrative text; ensure it does not cover faces (note: NOT A SPEECH CLOUD/BUBBLE).', // Clarified it's not a speech bubble
        `Inside the cloud print: "${(opts.pageText ?? '').trim()}" in Comic Neue Bold navy (#1A2A6B) ≈80 pt, exactly once.`, // Corrected font name, size symbol
        `Ensure the entire sentence fits comfortably within the image with adequate padding from the edges -- fully visible, and not cut off by image edges.`, // NEW layout constraint
        opts.tone && `Mood: ${opts.tone}.`,
        // Add other story-page specific needs here if any
      ];

  // Combine all parts: Base + Winkify (if applicable) + Page-Specific
  const prompt = [...base, ...winkBits, ...titleBits]
    .filter(Boolean) // Remove any null/undefined/empty parts
    .join(' '); // Join with spaces

  // Truncate if necessary
  return prompt.length > MAX_PROMPT_CHARS
    ? prompt.slice(0, MAX_PROMPT_CHARS - 1) + '…' // Use ellipsis
    : prompt;
}

// Exports for other modules
export { STYLE_LIBRARY };
export type { StyleKey, IllustrationPromptOptions };

// Remove CommonJS export block 