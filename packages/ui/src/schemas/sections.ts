import { z } from 'astro/zod';
import {
  captureSchema,
  ctaSchema,
  headingFields,
  hrefSchema,
  iconSchema,
  imageSchema,
  sectionBase,
  text,
} from './common';

/**
 * Page sections as data. Each schema's `type` maps to a component in `sections/`
 * (see sections/SectionRenderer.astro). Content files list sections in order; the build fails on any
 * field that doesn't match these schemas. `text(n)` and `.max(n)` are density budgets.
 */

export const heroSection = z.strictObject({
  type: z.literal('hero'),
  ...sectionBase,
  layout: z.enum(['split', 'centered']).default('split'),
  /** Short context line above the H1 (e.g. the industry); omit unless it informs. */
  context: text(40).optional(),
  /** Hero copy is short on purpose: a 3–6 word headline and a one-line lede. */
  title: text(34),
  titleAccent: text(24).optional(),
  lede: text(100),
  /** Email-first capture shown in place of the primary button. */
  capture: captureSchema.optional(),
  ctas: z.array(ctaSchema).max(2).default([]),
  /** Quiet line under the buttons. */
  note: text(80).optional(),
  /** Picture beside the headline (split layout) or below the buttons (centered). */
  image: imageSchema.optional(),
  band: headingFields.band,
});

export const logoStripSection = z.strictObject({
  type: z.literal('logoStrip'),
  ...sectionBase,
  label: z.string().min(1),
  items: z
    .array(
      z.strictObject({
        name: z.string().min(1),
        href: hrefSchema.optional(),
        /** Logo picture; the name stays as its alt text. */
        image: imageSchema.optional(),
      }),
    )
    .min(1),
  band: headingFields.band,
});

export const statStripSection = z.strictObject({
  type: z.literal('statStrip'),
  ...sectionBase,
  ...headingFields,
  title: z.string().optional(),
  items: z
    .array(z.strictObject({ value: z.string().min(1), label: z.string().min(1) }))
    .min(2)
    .max(4),
  source: z.string().optional(),
});

export const featureGridSection = z.strictObject({
  type: z.literal('featureGrid'),
  ...sectionBase,
  ...headingFields,
  columns: z.union([z.literal(2), z.literal(3), z.literal(4)]).default(3),
  variant: z.enum(['plain', 'cards']).default('plain'),
  items: z
    .array(
      z.strictObject({
        icon: iconSchema.optional(),
        /** Picture on top of the card (used instead of the icon). */
        image: imageSchema.optional(),
        title: text(40),
        body: text(110),
        href: hrefSchema.optional(),
        linkLabel: z.string().optional(),
      }),
    )
    .min(2)
    .max(4),
  ctas: z.array(ctaSchema).max(2).default([]),
});

export const splitSection = z.strictObject({
  type: z.literal('split'),
  ...sectionBase,
  ...headingFields,
  /** Paragraphs; the first should answer the heading on its own (AEO). */
  body: z.array(text(220)).min(1).max(2),
  bullets: z.array(text(60)).max(3).default([]),
  ctas: z.array(ctaSchema).max(2).default([]),
  image: imageSchema.optional(),
  /** Put the image on the left. */
  reverse: z.boolean().default(false),
});

export const stepsSection = z.strictObject({
  type: z.literal('steps'),
  ...sectionBase,
  ...headingFields,
  steps: z
    .array(z.strictObject({ icon: iconSchema.optional(), title: text(32), body: text(80) }))
    .min(2)
    .max(5),
  ctas: z.array(ctaSchema).max(2).default([]),
});

export const comparisonTableSection = z.strictObject({
  type: z.literal('comparisonTable'),
  ...sectionBase,
  ...headingFields,
  /** Column headings after the first (row-label) column. */
  columns: z
    .array(z.strictObject({ name: z.string().min(1), highlight: z.boolean().default(false) }))
    .min(2)
    .max(5),
  groups: z
    .array(
      z.strictObject({
        label: z.string().optional(),
        rows: z
          .array(
            z.strictObject({
              label: z.string().min(1),
              /** `true` = included, `false` = not included, string = a value. */
              values: z.array(z.union([z.boolean(), z.string()])),
            }),
          )
          .min(1),
      }),
    )
    .min(1),
  /** Accessible words for the ✓ / — marks. */
  yesLabel: z.string().default('Included'),
  noLabel: z.string().default('Not included'),
});

export const pricingTableSection = z.strictObject({
  type: z.literal('pricingTable'),
  ...sectionBase,
  ...headingFields,
  plans: z
    .array(
      z.strictObject({
        name: z.string().min(1),
        price: z.string().min(1),
        period: z.string().optional(),
        summary: text(80),
        features: z.array(text(60)).min(1).max(6),
        cta: ctaSchema,
        highlight: z.boolean().default(false),
        highlightLabel: z.string().optional(),
      }),
    )
    .min(1)
    .max(4),
  note: z.string().optional(),
});

export const testimonialSection = z.strictObject({
  type: z.literal('testimonial'),
  ...sectionBase,
  band: headingFields.band,
  quote: z.string().min(1),
  name: z.string().min(1),
  role: z.string().min(1),
  /** Headshot of the person quoted (only with their permission). */
  avatar: imageSchema.optional(),
});

export const pageCardsSection = z.strictObject({
  type: z.literal('pageCards'),
  ...sectionBase,
  ...headingFields,
  /** List every page whose `card.group` matches. */
  group: z.string().min(1),
  /** Only pages with this tag (e.g. `prebuilt`). */
  tag: z.string().optional(),
  /** Group cards under these tag headings, in this order. */
  groupByTags: z.array(z.strictObject({ tag: z.string(), heading: z.string() })).optional(),
  /** Leave out the page being rendered. */
  excludeCurrent: z.boolean().default(true),
  columns: z.union([z.literal(2), z.literal(3)]).default(3),
  linkLabel: z.string().default('Learn more'),
});

export const faqSection = z.strictObject({
  type: z.literal('faq'),
  ...sectionBase,
  ...headingFields,
  /** Answers of 40–60 words read well and get quoted by answer engines. */
  items: z
    .array(z.strictObject({ q: text(90), a: text(380) }))
    .min(1)
    .max(5),
});

export const ctaPanelSection = z.strictObject({
  type: z.literal('ctaPanel'),
  ...sectionBase,
  ...headingFields,
  /** Email-first capture shown above the buttons. */
  capture: captureSchema.optional(),
  ctas: z.array(ctaSchema).max(2).default([]),
  note: z.string().optional(),
});

export const formSection = z.strictObject({
  type: z.literal('form'),
  ...sectionBase,
  ...headingFields,
  /** id of a form in `src/content/forms/`. */
  form: z.string().min(1),
  bullets: z.array(text(60)).max(4).default([]),
  bulletsTitle: z.string().optional(),
  image: imageSchema.optional(),
});

export const richTextSection = z.strictObject({
  type: z.literal('richText'),
  ...sectionBase,
  ...headingFields,
  /**
   * Markdown: paragraphs, ## and ### headings, lists, bold, links. For about text, policies
   * and terms. Raw HTML and images are not allowed.
   */
  body: z.string().min(1).max(8000),
});

export const gallerySection = z.strictObject({
  type: z.literal('gallery'),
  ...sectionBase,
  ...headingFields,
  columns: z.union([z.literal(2), z.literal(3), z.literal(4)]).default(3),
  images: z
    .array(imageSchema.extend({ caption: text(80).optional() }))
    .min(2)
    .max(12),
});

export const offersSection = z.strictObject({
  type: z.literal('offers'),
  ...sectionBase,
  ...headingFields,
  columns: z.union([z.literal(2), z.literal(3)]).default(3),
  /** Products or services, one card each. */
  items: z
    .array(
      z.strictObject({
        image: imageSchema.optional(),
        badge: text(16).optional(),
        title: text(40),
        body: text(160),
        price: text(24).optional(),
        priceNote: text(30).optional(),
        cta: ctaSchema.optional(),
      }),
    )
    .min(1)
    .max(9),
});

export const teamSection = z.strictObject({
  type: z.literal('team'),
  ...sectionBase,
  ...headingFields,
  members: z
    .array(
      z.strictObject({
        /** Real photos only, and only with the person's permission. */
        photo: imageSchema.optional(),
        name: text(40),
        role: text(40),
        bio: text(140).optional(),
      }),
    )
    .min(1)
    .max(8),
});

export const contactSection = z
  .strictObject({
    type: z.literal('contact'),
    ...sectionBase,
    ...headingFields,
    email: z.email().optional(),
    phone: z
      .string()
      .regex(/^\+?[0-9 ()-]{6,24}$/, {
        message: 'Use digits, spaces, brackets and dashes, e.g. +1 555 010 2030',
      })
      .optional(),
    address: text(160).optional(),
    /** One line per entry, e.g. "Mon-Fri 9:00-17:00". */
    hours: z.array(text(60)).max(7).default([]),
    ctas: z.array(ctaSchema).max(2).default([]),
    /** Words shown beside each detail; change them to translate the section. */
    emailLabel: text(20).default('Email'),
    phoneLabel: text(20).default('Phone'),
    addressLabel: text(20).default('Address'),
    hoursLabel: text(20).default('Opening hours'),
  })
  .refine((c) => Boolean(c.email || c.phone || c.address), {
    message: 'Add at least one of email, phone or address.',
  });

export const sectionSchema = z.discriminatedUnion('type', [
  heroSection,
  logoStripSection,
  statStripSection,
  featureGridSection,
  splitSection,
  stepsSection,
  comparisonTableSection,
  pricingTableSection,
  testimonialSection,
  pageCardsSection,
  faqSection,
  ctaPanelSection,
  formSection,
  richTextSection,
  gallerySection,
  offersSection,
  teamSection,
  contactSection,
]);

export type Section = z.infer<typeof sectionSchema>;
export type SectionOf<T extends Section['type']> = Extract<Section, { type: T }>;
