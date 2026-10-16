import { z } from 'astro/zod';
import { ctaSchema, hrefSchema, iconSchema, text } from './common';

const link = z.strictObject({
  label: z.string().min(1),
  href: hrefSchema,
  description: z.string().optional(),
  icon: iconSchema.optional(),
});

/** Header navigation (`navigation` in site.json). */
export const navigationSchema = z.strictObject({
  items: z
    .array(
      z.strictObject({
        label: z.string().min(1),
        /** Plain link, or the fallback target of a mega-menu when JS is off. */
        href: hrefSchema,
        /**
         * Ask for a work email (step 1 of `form`) before going to `href`. Shown once per
         * visitor, as a dialog on click; direct visits and search traffic go straight in.
         */
        gate: z
          .strictObject({
            form: z.string().min(1),
            title: text(40),
            lede: text(120).optional(),
            label: text(24),
          })
          .optional(),
        menu: z
          .strictObject({
            columns: z
              .array(z.strictObject({ heading: z.string().min(1), links: z.array(link).min(1) }))
              .min(1),
          })
          .optional(),
      }),
    )
    .min(1),
  actions: z.array(ctaSchema).max(2),
  labels: z.strictObject({
    menu: z.string(),
    close: z.string(),
    home: z.string(),
    primaryNav: z.string(),
  }),
});

/** Footer (`footer` in site.json). */
export const footerSchema = z.strictObject({
  /** Defaults to the brand tagline. */
  tagline: z.string().min(1).optional(),
  columns: z
    .array(z.strictObject({ heading: z.string().min(1), links: z.array(link).min(1) }))
    .min(1)
    .max(5),
  badges: z.array(z.string()).default([]),
  social: z.array(z.strictObject({ label: z.string(), href: z.url() })).default([]),
  /** Text after "© <year>"; defaults to "<brand name>. All rights reserved." */
  legal: z.string().min(1).optional(),
  labels: z.strictObject({ footerNav: z.string() }),
});

export type Navigation = z.infer<typeof navigationSchema>;
export type Footer = z.infer<typeof footerSchema>;
