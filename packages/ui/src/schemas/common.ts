import { z } from 'astro/zod';

/** Root-relative path with trailing slash, external URL, in-page anchor, or mailto/tel. */
export const hrefSchema = z
  .string()
  .regex(/^(\/([a-z0-9-]+\/)*([?#].*)?|https?:\/\/.+|#.+|mailto:.+|tel:.+)$/, {
    message: 'Use a root-relative path with trailing slash (/pricing/), a full URL, or #anchor',
  });

/**
 * Text with a length budget. Limits keep every section scannable (claude-design.md §4,
 * "Density"): if copy doesn't fit, cut it or split the idea into another section.
 */
export const text = (max: number) =>
  z
    .string()
    .min(1)
    .max(max, { message: `Keep this under ${max} characters so the section stays scannable.` });

export const ctaSchema = z.strictObject({
  label: z.string().min(1),
  href: hrefSchema,
  variant: z.enum(['primary', 'secondary', 'link']).default('primary'),
});

export const iconNames = [
  'apps',
  'arrow-right',
  'audit',
  'badge',
  'bell',
  'blocks',
  'bot',
  'boxes',
  'building',
  'cable',
  'calendar',
  'chart',
  'chat',
  'check',
  'check-circle',
  'chevron-right',
  'clock',
  'cloud',
  'database',
  'document',
  'form',
  'gauge',
  'globe',
  'handshake',
  'hard-hat',
  'home',
  'key',
  'layers',
  'link',
  'list',
  'lock',
  'mail',
  'merge',
  'minus',
  'network',
  'plug',
  'rocket',
  'route',
  'search',
  'server',
  'settings',
  'shield',
  'sliders',
  'sparkle',
  'timer',
  'tree',
  'users',
  'workflow',
  'wrench',
  'zap',
] as const;
export const iconSchema = z.enum(iconNames);
export type IconName = (typeof iconNames)[number];

/**
 * A file in the repo's `assets/` folder, e.g. `assets/logo.svg`. Folders are allowed, `..` and
 * `//` are not, so a path can never point outside `assets/`.
 */
export const assetPathSchema = z
  .string()
  .regex(/^(?!.*\.\.)(?!.*\/\/)assets\/[A-Za-z0-9._/-]+\.(svg|png|jpe?g|webp|avif|ico)$/, {
    message: 'Use a file in the assets/ folder, e.g. assets/logo.svg',
  });

/**
 * Where an image comes from: a file in `assets/` (uploaded through the site builder) or a full
 * https address.
 */
export const imageSrcSchema = z
  .string()
  .regex(
    /^((?!.*\.\.)(?!.*\/\/)assets\/[A-Za-z0-9._/-]+\.(svg|png|jpe?g|webp|avif)|https:\/\/[^\s]+)$/,
    {
      message: 'Use an image in the assets/ folder (assets/hero.webp) or a full https:// address',
    },
  );

/** An image on the page. `alt` is required: it is what screen readers and search engines read. */
export const imageSchema = z.strictObject({
  src: imageSrcSchema,
  alt: z.string().min(1).max(160),
});

/** Fields every section shares. `hidden` keeps a section in `site.json` but off the page. */
export const sectionBase = {
  hidden: z.boolean().optional(),
};

export type Image = z.infer<typeof imageSchema>;

/** Section background band (claude-design.md §4). */
export const bandSchema = z.enum(['base', 'surface', 'panel', 'accent', 'dark']);

/** Fields every section heading shares. The accent is the second sentence (claude-design.md §14). */
export const headingFields = {
  /** Optional id for in-page links (#faq). Lowercase-kebab. */
  anchor: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  /** Optional icon in a tile above the heading — use it to introduce a topic, not to decorate. */
  icon: iconSchema.optional(),
  title: text(60),
  titleAccent: text(40).optional(),
  lede: text(130).optional(),
  band: bandSchema.optional(),
};

/** A product-window mock-up: one screen, or several the viewer can switch between. */
export const mediaSchema = z.strictObject({
  screens: z.array(z.strictObject({ label: z.string().min(1), screen: z.string().min(1) })).min(1),
  /** Shown under the window; mock-ups carry illustrative data (content rule). */
  caption: z.string().min(1).default('Illustrative example'),
  /**
   * Cycle through the screens on its own (about every 5s). Pauses on hover or focus, stops
   * for good once the visitor picks a view, and never runs with reduced motion. Hero only.
   */
  autoplay: z.boolean().default(false),
});

/**
 * Email-first capture: one field and a button. Saves the email as step 1 of `form` (a partial
 * lead) and continues to the page with the full form (`continueTo`), which opens on step 2.
 */
export const captureSchema = z.strictObject({
  form: z.string().min(1),
  continueTo: hrefSchema,
  label: text(24),
  placeholder: z.string().default('Work email'),
  note: text(80).optional(),
});

export type Cta = z.infer<typeof ctaSchema>;
export type Capture = z.infer<typeof captureSchema>;
export type Media = z.infer<typeof mediaSchema>;
export type Band = z.infer<typeof bandSchema>;
