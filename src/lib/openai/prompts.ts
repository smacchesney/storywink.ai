import { Asset } from '@/generated/prisma/client';

// ----------------------------------
// TYPES
// ----------------------------------

type MessageContentPart =
  | { type: 'text'; text: string }
  | {
      type: 'image_url';
      image_url: { url: string; detail?: 'low' | 'high' | 'auto' };
    };

export interface StoryGenerationInput {
  childName: string;
  bookTitle: string;
  pageCount: 8 | 12 | 16;
  isDoubleSpread: boolean;
  storyTone?: string;
  artStyle?: string;
  theme?: string;
  people?: string;
  objects?: string;
  excitementElement?: string;
  droppedAssets: Record<number, string | null>;
  assets: Asset[];
  isWinkifyEnabled?: boolean; // NEW
}

// ----------------------------------
// SYSTEM PROMPT (StoryGen)
// ----------------------------------

export const systemPrompt =
  "You are an expert children's picture‑book author for toddlers (ages 2‑5). Your task is to write engaging story text for a personalised picture book based on the user's photos and inputs.";

// ----------------------------------
// STORY GENERATION – VISION PROMPT
// ----------------------------------

export function createVisionStoryGenerationPrompt(
  input: StoryGenerationInput
): MessageContentPart[] {
  const msg: MessageContentPart[] = [];

  // ---------- CONFIG ----------
  msg.push({
    type: 'text',
    text: `# Configuration\nChild's Name: ${input.childName || 'the child'}\nBook Title: ${
      input.bookTitle || 'My Special Story'
    }\nPage Count: ${input.pageCount}\nStory Tone: ${
      input.storyTone || 'Default (Engaging)'
    }`,
  });

  // ---------- OPTIONAL DETAILS ----------
  let opt = '# Optional Details\n';
  let has = false;
  if (input.theme) {
    opt += `Theme: ${input.theme}\n`;
    has = true;
  }
  if (input.people) {
    opt += `Key People: ${input.people}\n`;
    has = true;
  }
  if (input.objects) {
    opt += `Key Objects: ${input.objects}\n`;
    has = true;
  }
  if (input.excitementElement) {
    opt += `Excitement Element: ${input.excitementElement}\n`;
    has = true;
  }
  if (!has) opt += '(None provided)\n';
  msg.push({ type: 'text', text: opt });

  // ---------- STORYBOARD (IMAGES) ----------
  msg.push({ type: 'text', text: '# Storyboard Sequence' });

  const gridLen = input.isDoubleSpread ? input.pageCount / 2 : input.pageCount;

  for (let i = 0; i < gridLen; i++) {
    const assetId = input.droppedAssets[i];
    const asset = assetId ? input.assets.find((a) => a.id === assetId) : null;
    msg.push({ type: 'text', text: `--- Page ${i + 1} ---` });
    if (asset?.url) {
      msg.push({
        type: 'image_url',
        image_url: { url: asset.url, detail: 'high' },
      });
    } else {
      msg.push({
        type: 'text',
        text: `[No Image Provided for Page ${i + 1}]`,
      });
    }
  }
  msg.push({ type: 'text', text: '--- End Storyboard ---' });

  // ---------- INSTRUCTIONS ----------
  const baseInstructions = [
    `# Instructions & Guiding Principles:`,
    `- You are an award-winning children's book author${input.isWinkifyEnabled ? ' and illustrator' : ''}.`,
    `- Your task is to craft a **cohesive and delightful story** matching the provided sequence of user-uploaded images.`,
    `- Each story should have a **clear beginning, middle, and end**, grounded in the sequence order.`,
    `- Write from a **toddler's perspective**, highlighting familiar experiences and relatable emotions (joy, frustration, silliness, pride).`,
    `- Keep sentences **short, simple, and concrete**. Use vivid nouns, strong action verbs, and sensory language.`,
    `- Use **rhythm, repetition, and fun sounds (onomatopoeia)** naturally to enhance read-aloud appeal.`,
    `- Incorporate **gentle, age-appropriate humor** (mild mischief, small surprises) when fitting.`,
    `- **Seamlessly weave in** user details where applicable:`,
    `  - Child's Name: \\"${input.childName || '(Not Provided)'}\\" (Use this name in the story text!)`,
    `  - Book Title: \\"${input.bookTitle || '(Not Provided)'}\\"`,
    `  - Story Tone: \\"${input.storyTone || '(Default)'}\\"`,
    `  - Theme or Excitement Element: \\"${input.theme || input.excitementElement || '(None)'}\\"`,
    `- Generate **1-3 simple sentences per page** (Page 1, Page 2, etc.).`,
    `  - Adjust slightly across pages to maintain good narrative flow.`
  ].join('\\n');

  const winkifyInstructions = [
    `\\n- For **each** page, also suggest brief \\"illustrationNotes\\" (max 25 words) to dynamically enhance the image with fun effects:`,
    `  - Focus only on **amplifying action** — e.g., "zoom lines", "sparkles", "motion blur", "confetti bursts".`,
    `  - NEVER alter faces, poses, or introduce new characters.`,
    `  - **Specifically for illustrationNotes ONLY:** Use visual language (e.g., 'the boy in red') instead of character names like '${input.childName || 'the child'}'. The illustration AI doesn't know names.`,
    `  - If no dynamic effect fits, set \\"illustrationNotes\\" to null or empty.`,
    `\\n- Effects must feel playful but natural, blending into the scene without overwhelming it.`,
    `\\n- Final Output:`,
    `\\nReturn ONLY a valid JSON object. The keys must be page numbers as strings (e.g., \\"1\\", \\"2\\"). The value for each key must be an object with two keys: \\"text\\" (string, the story text) and \\"illustrationNotes\\" (string or null, the visual suggestion).`,
    `Example format: {\\"1\\":{\\"text\\":\\"Sample text...\\",\\"illustrationNotes\\":\\"Suggestion...\\"},\\"2\\":{\\"text\\":\\"More text...\\",\\"illustrationNotes\\":null}}`
  ];
  const winkifyExtra = winkifyInstructions.join('');

  const nonWinkifyExtra =
    '- Output **ONLY** valid JSON mapping page numbers to text. Example: { "1": "Leo and Mommy went to the park." }';

  msg.push({
    type: 'text',
    text: `${baseInstructions}\n${
      input.isWinkifyEnabled ? winkifyExtra : nonWinkifyExtra
    }`,
  });

  return msg;
}