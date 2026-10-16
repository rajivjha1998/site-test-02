import { z } from 'astro/zod';

/**
 * The organisation and product identity a site is built for. One per site, in
 * `src/content/site/entity.yaml`. Names are written here once and read everywhere
 * (copy, titles, JSON-LD) so search and answer engines see one consistent entity.
 */
export const entitySchema = z.strictObject({
  /** Company name exactly as it should appear everywhere. */
  name: z.string().min(1),
  legalName: z.string().min(1).optional(),
  /** Production origin, no trailing slash. */
  url: z.url(),
  /** One-sentence description used for Organization JSON-LD and as the default meta description. */
  description: z.string().min(1).max(155),
  product: z.strictObject({
    name: z.string().min(1),
    description: z.string().min(1).max(155),
    category: z.string().default('BusinessApplication'),
  }),
  /** Root-relative path to the logo used in JSON-LD and social cards. */
  logo: z.string().startsWith('/'),
  /** Default social-card image, root-relative. */
  ogImage: z.string().startsWith('/').optional(),
  /** Official social profiles, for `sameAs`. */
  sameAs: z.array(z.url()).default([]),
  contactEmail: z.email().optional(),
  locale: z.string().default('en'),
});

export type Entity = z.infer<typeof entitySchema>;
