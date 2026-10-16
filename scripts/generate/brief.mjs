// The customer's brief: what the Create Website form collects. Everything is plain text so the
// HIL form needs no special field types. Unknown fields are refused so a mapping slip in the
// workflow shows up as an error instead of being silently dropped.
import { z } from 'astro/zod';

export const PAGE_CHOICES = [
  'home',
  'about',
  'services',
  'pricing',
  'faq',
  'contact',
  'privacy',
  'terms',
];
export const TONES = ['friendly', 'professional', 'playful', 'premium', 'technical', 'warm'];
export const GOALS = ['contact', 'book', 'buy', 'signup', 'visit', 'call'];
export const MAX_BRIEF_CHARS = 12000;

const blankToUndefined = (value) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;
const optionalText = (max) => z.preprocess(blankToUndefined, z.string().trim().max(max).optional());
const optionalColor = z.preprocess(
  blankToUndefined,
  z
    .string()
    .trim()
    .regex(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, { message: 'Use a hex colour such as #2563eb' })
    .optional(),
);

/** Pages can arrive as a list (checkboxes) or as text ("home, about"). */
const pages = z.preprocess(
  (value) => {
    const list = Array.isArray(value)
      ? value
      : typeof value === 'string'
        ? value.split(/[,\n]/)
        : undefined;
    const cleaned = list?.map((item) => String(item).trim().toLowerCase()).filter(Boolean);
    return cleaned?.length ? [...new Set(cleaned)] : undefined;
  },
  z.array(z.enum(PAGE_CHOICES)).min(1).max(8).default(['home', 'about', 'contact']),
);

export const briefSchema = z.strictObject({
  business: z.string().trim().min(2).max(80),
  summary: z.string().trim().min(10).max(300),
  offerings: z.string().trim().min(5).max(3000),
  audience: optionalText(500),
  tone: z.preprocess(blankToUndefined, z.enum(TONES).default('friendly')),
  goal: z.preprocess(blankToUndefined, z.enum(GOALS).default('contact')),
  pages,
  color_primary: optionalColor,
  color_secondary: optionalColor,
  color_tertiary: optionalColor,
  email: z.preprocess(blankToUndefined, z.email().optional()),
  phone: optionalText(30),
  address: optionalText(200),
  hours: optionalText(300),
  social: optionalText(500),
  location: optionalText(120),
  keywords: optionalText(300),
  avoid: optionalText(500),
  language: z.preprocess(blankToUndefined, z.string().trim().max(40).default('English')),
  notes: optionalText(3000),
});

/** Returns `{ ok: true, brief }` or `{ ok: false, problems: string[] }` in plain words. */
export function normaliseBrief(raw) {
  let input = raw;
  // A brief may arrive as an object, as JSON text, or as JSON text inside JSON text (a workflow
  // that sent it as a string field); unwrap up to twice.
  for (let i = 0; i < 2 && typeof input === 'string'; i += 1) {
    try {
      input = JSON.parse(input);
    } catch {
      return { ok: false, problems: ['The brief is not valid JSON.'] };
    }
  }
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, problems: ['The brief must be an object of answers.'] };
  }
  if (JSON.stringify(input).length > MAX_BRIEF_CHARS) {
    return {
      ok: false,
      problems: [`The brief is longer than ${MAX_BRIEF_CHARS} characters. Shorten it.`],
    };
  }
  const result = briefSchema.safeParse(input);
  if (!result.success) {
    return {
      ok: false,
      problems: result.error.issues.map((issue) => {
        const where = issue.path.join('.') || 'brief';
        return issue.code === 'unrecognized_keys'
          ? `Unknown field(s): ${issue.keys.join(', ')}`
          : `${where}: ${issue.message}`;
      }),
    };
  }
  return { ok: true, brief: result.data };
}
