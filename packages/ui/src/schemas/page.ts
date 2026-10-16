import { z } from 'astro/zod';
import { iconSchema } from './common';
import { sectionSchema } from './sections';

/**
 * A page is data: SEO fields, an optional card (how hubs list it), and ordered sections.
 * The file path decides the URL (src/content/pages/apps/prebuilt/x.yaml → /apps/prebuilt/x/).
 */
export const pageSchema = z
  .strictObject({
    seo: z.strictObject({
      /** Page topic without the site name; omit on the home page. */
      title: z.string().min(1).optional(),
      description: z.string().min(1).max(155),
      image: z.string().startsWith('/').optional(),
      noindex: z.boolean().default(false),
    }),
    /** Short name used in breadcrumbs and menus; defaults to card title, then SEO title. */
    breadcrumb: z.string().min(1).optional(),
    /** How hub pages (pageCards sections) list this page. */
    card: z
      .strictObject({
        group: z.string().min(1),
        title: z.string().min(1),
        summary: z.string().min(1).max(110),
        icon: iconSchema.optional(),
        tags: z.array(z.string()).default([]),
        order: z.number().default(100),
      })
      .optional(),
    /** Adds SoftwareApplication JSON-LD for the product. */
    softwareApplication: z.boolean().default(false),
    sections: z.array(sectionSchema).min(1),
  })
  .superRefine((page, ctx) => {
    const heroes = page.sections.filter((s) => s.type === 'hero').length;
    if (page.sections[0]?.type !== 'hero' || heroes !== 1) {
      ctx.addIssue({
        code: 'custom',
        path: ['sections'],
        message: 'A page must start with exactly one hero section (it renders the only H1).',
      });
    }
    if (page.sections[0]?.hidden) {
      ctx.addIssue({
        code: 'custom',
        path: ['sections', 0, 'hidden'],
        message: "The hero can't be hidden: it holds the page's only H1.",
      });
    }
    const headingIcons = page.sections.filter((s) => 'icon' in s && s.icon).length;
    if (headingIcons > 1) {
      ctx.addIssue({
        code: 'custom',
        path: ['sections'],
        message: `Use at most one heading icon per page (found ${headingIcons}) — icons above every heading read as clutter.`,
      });
    }
  });

export type Page = z.infer<typeof pageSchema>;

export interface PageCard {
  path: string;
  group: string;
  title: string;
  summary: string;
  icon?: z.infer<typeof iconSchema>;
  tags: string[];
  order: number;
}
