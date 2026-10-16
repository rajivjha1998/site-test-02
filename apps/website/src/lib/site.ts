import { getEntry } from 'astro:content';
import { PUBLIC_FORMS_ORIGIN, PUBLIC_TURNSTILE_SITE_KEY } from 'astro:env/client';
import type { Page, PageCard } from '@blackboxops/ui/schemas/page.ts';
import type { Breadcrumb, JsonLd } from '@blackboxops/ui/lib/seo.ts';
import { faqPageLd, softwareApplicationLd } from '@blackboxops/ui/lib/seo.ts';
import type { RenderContext } from '@blackboxops/ui/lib/resolve.ts';
import type { Entity } from '@blackboxops/ui/schemas/entity.ts';
import type { SiteConfig } from '@blackboxops/ui/schemas/site-config.ts';
import { themeCss } from '@blackboxops/ui/lib/theme.ts';
import { collectImageSrcs, readImageSizes, type ImageSize } from './images';

export interface SitePage {
  path: string;
  page: Page;
}

/** The validated contents of site.json. */
export async function getSite(): Promise<SiteConfig> {
  const entry = await getEntry('site', 'site');
  if (!entry) throw new Error('Missing site.json at the repo root');
  return entry.data;
}

/** The deployed site's URL including any base path, e.g. https://x.github.io/site. */
export const deployedUrl = (): string =>
  new URL(import.meta.env.BASE_URL, import.meta.env.SITE).href.replace(/\/$/, '');

/** Root-relative URL of a repo asset (`assets/logo.svg` → `/assets/logo.svg`). */
export const assetUrl = (path: string) => `/${path}`;

/**
 * The organisation entity for SEO and JSON-LD, with `url` set to where this build is
 * deployed, so canonical URLs are correct on production and preview hosts alike.
 */
export async function getEntity(): Promise<Entity> {
  const { brand } = await getSite();
  return {
    name: brand.name,
    url: deployedUrl(),
    description: brand.description,
    product: { name: brand.name, description: brand.description, category: 'BusinessApplication' },
    logo: brand.logo ? assetUrl(brand.logo) : '/favicon.svg',
    sameAs: brand.sameAs,
    contactEmail: brand.contactEmail,
    locale: brand.locale,
  };
}

/** Header, footer, favicon and theme: everything the layout needs. */
export async function getChrome() {
  const site = await getSite();
  const { brand } = site;
  return {
    navigation: site.navigation,
    footer: {
      ...site.footer,
      tagline: site.footer.tagline ?? brand.tagline,
      legal: site.footer.legal ?? `${brand.name}. All rights reserved.`,
    },
    logo: brand.logo ? assetUrl(brand.logo) : undefined,
    favicon: brand.favicon ? assetUrl(brand.favicon) : '/favicon.svg',
    themeCss: themeCss(site.theme),
    forms: site.forms,
  };
}

export async function getPages(): Promise<SitePage[]> {
  const { pages } = await getSite();
  return Object.entries(pages).map(([path, page]) => ({ path, page }));
}

export function pageCards(pages: SitePage[]): PageCard[] {
  return pages.flatMap(({ page, path }) => (page.card ? [{ path, ...page.card }] : []));
}

/** Name of a page for breadcrumbs and link lists. */
export const pageName = (page: Page) =>
  page.breadcrumb ?? page.card?.title ?? page.seo.title ?? 'Home';

/** Home → each existing ancestor → this page. Missing ancestors are skipped. */
export function breadcrumbs(path: string, pages: SitePage[]): Breadcrumb[] {
  const byPath = new Map(pages.map((p) => [p.path, p.page]));
  const segments = path.split('/').filter(Boolean);
  const trail: Breadcrumb[] = [];
  for (let i = 0; i <= segments.length; i++) {
    const p = i === 0 ? '/' : `/${segments.slice(0, i).join('/')}/`;
    const page = byPath.get(p);
    if (page) trail.push({ name: pageName(page), path: p });
  }
  return trail;
}

let imageSizes: Promise<Record<string, ImageSize>> | undefined;

/** Sizes of every image on the site, read once per build. */
const getImageSizes = () => {
  imageSizes ??= getSite().then((site) => readImageSizes(collectImageSrcs(site)));
  return imageSizes;
};

export async function renderContext(
  currentPath: string,
  pages: SitePage[],
): Promise<RenderContext> {
  const [{ forms }, images] = await Promise.all([getSite(), getImageSizes()]);
  return {
    // Product-window mockups (screens) aren't part of site.json yet.
    screens: {},
    images,
    forms,
    cards: pageCards(pages),
    currentPath,
    turnstileSiteKey: PUBLIC_TURNSTILE_SITE_KEY || undefined,
    formsOrigin: PUBLIC_FORMS_ORIGIN || undefined,
  };
}

/** Page-specific JSON-LD: SoftwareApplication when flagged, FAQPage for FAQ sections. */
export function pageJsonLd(page: Page, path: string, entity: Entity): JsonLd[] {
  const nodes: JsonLd[] = [];
  if (page.softwareApplication) nodes.push(softwareApplicationLd(entity, path));
  const faqItems = page.sections.flatMap((s) => (s.type === 'faq' && !s.hidden ? s.items : []));
  if (faqItems.length > 0) nodes.push(faqPageLd(faqItems));
  return nodes;
}
