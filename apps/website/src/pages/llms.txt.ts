import type { APIRoute } from 'astro';
import { absoluteUrl } from '@blackboxops/ui/lib/seo.ts';
import { getEntity, getPages, pageName } from '../lib/site';

// llms.txt (llmstxt.org): a plain-text map of the site for AI assistants and answer engines.
// Generated from content, so it never drifts from the pages.
export const GET: APIRoute = async () => {
  const [entity, pages] = await Promise.all([getEntity(), getPages()]);
  const listed = pages
    .filter(({ page }) => !page.seo.noindex)
    .sort(
      (a, b) => a.path.split('/').length - b.path.split('/').length || a.path.localeCompare(b.path),
    );

  const lines = [
    `# ${entity.name}`,
    '',
    `> ${entity.description}`,
    '',
    '## Pages',
    '',
    ...listed.map(
      ({ page, path }) =>
        `- [${pageName(page)}](${absoluteUrl(path, entity.url)}): ${page.seo.description}`,
    ),
    '',
  ];
  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
