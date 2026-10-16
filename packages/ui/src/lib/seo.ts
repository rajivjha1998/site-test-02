import type { Entity } from '../schemas/entity';

export const TITLE_MAX = 60;
export const DESCRIPTION_MAX = 155;

export type JsonLd = Record<string, unknown>;

export interface Breadcrumb {
  name: string;
  /** Root-relative path, e.g. `/apps/prebuilt/`. */
  path: string;
}

export interface SeoInput {
  /** Page topic, without the site name. Omit on the home page to use the site name alone. */
  title?: string;
  description: string;
  /** Root-relative path of the page, e.g. `/pricing/`. */
  path: string;
  /** Root-relative social-card image; falls back to the entity's default. */
  image?: string;
  /** Force noindex for this page regardless of site indexability. */
  noindex?: boolean;
  breadcrumbs?: Breadcrumb[];
  /** Extra page-specific JSON-LD nodes (SoftwareApplication, FAQPage…). */
  jsonLd?: JsonLd[];
}

/** `Topic — Site` for inner pages, `Site` alone for the home page. */
export function pageTitle(siteName: string, title?: string): string {
  return title ? `${title} — ${siteName}` : siteName;
}

/**
 * Absolute URL with the trailing slash every page uses (files like /robots.txt keep theirs).
 * `origin` may include a base path (e.g. https://x.github.io/site), which is kept.
 */
export function absoluteUrl(path: string, origin: string): string {
  const url = new URL(`${origin.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`);
  const isFile = /\.[a-z0-9]+$/i.test(url.pathname);
  if (!isFile && !url.pathname.endsWith('/')) url.pathname += '/';
  return url.href;
}

/** Returns human-readable problems; the Seo component fails the build on any. */
export function seoProblems(fullTitle: string, description: string): string[] {
  const problems: string[] = [];
  if (fullTitle.length > TITLE_MAX) {
    problems.push(`title is ${fullTitle.length} chars (max ${TITLE_MAX}): "${fullTitle}"`);
  }
  if (description.length > DESCRIPTION_MAX) {
    problems.push(`description is ${description.length} chars (max ${DESCRIPTION_MAX})`);
  }
  if (description.trim().length === 0) problems.push('description is empty');
  return problems;
}

export function organizationLd(entity: Entity): JsonLd {
  return {
    '@type': 'Organization',
    '@id': `${entity.url}/#organization`,
    name: entity.name,
    ...(entity.legalName && { legalName: entity.legalName }),
    url: absoluteUrl('/', entity.url),
    logo: absoluteUrl(entity.logo, entity.url),
    description: entity.description,
    ...(entity.sameAs.length > 0 && { sameAs: entity.sameAs }),
    ...(entity.contactEmail && { email: entity.contactEmail }),
  };
}

export function websiteLd(entity: Entity): JsonLd {
  return {
    '@type': 'WebSite',
    '@id': `${entity.url}/#website`,
    name: entity.name,
    url: absoluteUrl('/', entity.url),
    inLanguage: entity.locale,
    publisher: { '@id': `${entity.url}/#organization` },
  };
}

export function breadcrumbLd(items: Breadcrumb[], origin: string): JsonLd {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path, origin),
    })),
  };
}

/** One JSON-LD document per page: site-wide nodes + breadcrumbs + page nodes. */
export function jsonLdGraph(entity: Entity, seo: SeoInput): JsonLd {
  const graph: JsonLd[] = [organizationLd(entity), websiteLd(entity)];
  if (seo.breadcrumbs && seo.breadcrumbs.length > 1) {
    graph.push(breadcrumbLd(seo.breadcrumbs, entity.url));
  }
  graph.push(...(seo.jsonLd ?? []));
  return { '@context': 'https://schema.org', '@graph': graph };
}

/** Serialise JSON-LD safely for an inline <script> (no `</script>` breakout). */
export function serializeJsonLd(data: JsonLd): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export function faqPageLd(items: { q: string; a: string }[]): JsonLd {
  return {
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };
}

export function softwareApplicationLd(entity: Entity, path: string): JsonLd {
  return {
    '@type': 'SoftwareApplication',
    '@id': `${entity.url}/#software`,
    name: entity.product.name,
    description: entity.product.description,
    applicationCategory: entity.product.category,
    operatingSystem: 'Web',
    url: absoluteUrl(path, entity.url),
    publisher: { '@id': `${entity.url}/#organization` },
  };
}
