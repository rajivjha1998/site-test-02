// Checks a generated site the same way the build does, plus the things the schema can't see:
// links that point nowhere, images that were not produced, forms the site doesn't have.
import { Buffer } from 'node:buffer';
import { siteConfigSchema } from '../../packages/ui/src/schemas/site-config.ts';
import { SITE_LIMITS } from '../../packages/ui/src/schemas/limits.ts';

const walk = (value, visit, path = '') => {
  visit(value, path);
  if (Array.isArray(value)) value.forEach((item, i) => walk(item, visit, `${path}[${i}]`));
  else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value))
      walk(child, visit, path ? `${path}.${key}` : key);
  }
};

/**
 * Returns a list of problems in plain words (empty = good).
 * `assetPaths` are the files that exist in assets/ (generated ones plus the repo's own).
 */
export function validateSite(site, assetPaths = []) {
  const problems = [];
  const parsed = siteConfigSchema.safeParse(site);
  if (!parsed.success) {
    for (const issue of parsed.error.issues)
      problems.push(`${issue.path.join('.') || '(root)'}: ${issue.message}`);
    return problems;
  }
  const config = parsed.data;
  const text = JSON.stringify(site);
  const bytes = Buffer.byteLength(JSON.stringify(site, null, 2), 'utf8');
  if (bytes > SITE_LIMITS.maxBytes)
    problems.push(
      `site.json is ${bytes} bytes; the limit is ${SITE_LIMITS.maxBytes}. Shorten the copy or drop a section.`,
    );
  if (text.includes('—'))
    problems.push('Copy contains an em dash (—). Use a comma, colon or full stop instead.');

  const pages = new Set(Object.keys(config.pages));
  const assets = new Set(assetPaths);
  walk(site, (value, path) => {
    if (typeof value !== 'string') return;
    if (/\.href$|\.continueTo$/.test(path) && value.startsWith('/')) {
      const [target] = value.split(/[?#]/);
      if (target && !target.startsWith('/assets/') && !pages.has(target)) {
        problems.push(
          `${path}: the link "${value}" goes to a page that does not exist. Pages: ${[...pages].join(', ')}`,
        );
      }
    }
    if (/^assets\//.test(value) && !assets.has(value)) {
      problems.push(
        `${path}: "${value}" is not one of the available images (${[...assets].join(', ') || 'none'}).`,
      );
    }
  });
  for (const [id] of Object.entries(config.forms)) {
    problems.push(
      `forms.${id}: forms are not available yet; remove it and any section that uses it.`,
    );
  }
  walk(site, (value, path) => {
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      (value.type === 'form' || value.capture)
    ) {
      problems.push(
        `${path}: forms and email capture are not available yet. Use a contact section or buttons instead.`,
      );
    }
  });
  return problems;
}
