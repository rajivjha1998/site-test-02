import { z } from 'astro/zod';
import { assetPathSchema } from './common';
import { SITE_LIMITS } from './limits';
import { formSchema } from './form';
import { pageSchema } from './page';
import { footerSchema, navigationSchema } from './site';

/**
 * The whole site as one document: `site.json` at the repo root. Customers edit it through
 * guided forms (or by hand); the build fails on anything that doesn't match. Bump
 * `schemaVersion` on any breaking change and migrate existing files.
 */

const hexColor = z
  .string()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, { message: 'Use a hex colour, e.g. #2563eb' });

/** A file in the repo's `assets/` folder, e.g. `assets/logo.svg`. */
export const assetPath = assetPathSchema;

export const brandSchema = z.strictObject({
  /** Company or product name exactly as it should appear everywhere. */
  name: z.string().min(1).max(60),
  /** Short line under the logo in the footer. */
  tagline: z.string().min(1).max(120),
  /** One sentence: default meta description and Organization JSON-LD. */
  description: z.string().min(1).max(155),
  /** Production origin, no trailing slash. */
  url: z.url(),
  /** Logo shown in the header and footer; omit to show the name as a wordmark. */
  logo: assetPath.optional(),
  /** Browser-tab icon; omit for a monogram in the primary colour. */
  favicon: assetPath.optional(),
  contactEmail: z.email().optional(),
  /** Official social profiles. */
  sameAs: z.array(z.url()).default([]),
  locale: z.string().default('en'),
});

export const themeSchema = z.strictObject({
  primary: hexColor,
  secondary: hexColor,
  tertiary: hexColor,
});

export const siteConfigSchema = z
  .strictObject({
    $schema: z.string().optional(),
    schemaVersion: z.literal(1),
    brand: brandSchema,
    theme: themeSchema,
    navigation: navigationSchema,
    footer: footerSchema,
    /** URL path → page, e.g. "/" or "/contact/". */
    pages: z.record(z.string().regex(/^\/([a-z0-9-]+\/)*$/), pageSchema),
    /** Form id → form; sections reference forms by id. */
    forms: z.record(z.string().regex(/^[a-z0-9-]+$/), formSchema).default({}),
  })
  .superRefine((site, ctx) => {
    const pageCount = Object.keys(site.pages).length;
    if (pageCount > SITE_LIMITS.maxPages) {
      ctx.addIssue({
        code: 'custom',
        path: ['pages'],
        message: `A site can have at most ${SITE_LIMITS.maxPages} pages (this one has ${pageCount}).`,
      });
    }
    for (const path of Object.keys(site.pages)) {
      if (path.startsWith('/preview/') || path.startsWith('/assets/')) {
        ctx.addIssue({
          code: 'custom',
          path: ['pages', path],
          message: `"${path}" is reserved (the draft preview and the images live there). Pick another page address.`,
        });
      }
    }
    if (!site.pages['/']) {
      ctx.addIssue({ code: 'custom', path: ['pages'], message: 'Add a home page at "/".' });
    }
    for (const [id, form] of Object.entries(site.forms)) {
      if (form.id !== id) {
        ctx.addIssue({
          code: 'custom',
          path: ['forms', id, 'id'],
          message: `A form's id must match its key ("${id}").`,
        });
      }
    }
  });

export type Brand = z.infer<typeof brandSchema>;
export type SiteConfig = z.infer<typeof siteConfigSchema>;
