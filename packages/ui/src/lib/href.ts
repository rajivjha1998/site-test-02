/**
 * Prefix a root-relative path with the site's base path, so the same content works at
 * `https://blackboxops.io/` and under a sub-folder such as `…github.io/bb_ops_website_v1/`.
 * Full URLs, anchors, `mailto:` and `tel:` links are returned unchanged.
 */
export function withBase(href: string, base: string = import.meta.env.BASE_URL ?? '/'): string {
  if (!href.startsWith('/') || href.startsWith('//')) return href;
  return `${base.replace(/\/$/, '')}${href}`;
}
