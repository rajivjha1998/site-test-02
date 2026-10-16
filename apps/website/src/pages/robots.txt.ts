import type { APIRoute } from 'astro';
import { PUBLIC_SITE_INDEXABLE } from 'astro:env/client';

export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL(`${import.meta.env.BASE_URL.replace(/\/$/, '')}/sitemap-index.xml`, site);
  const lines = PUBLIC_SITE_INDEXABLE
    ? ['User-agent: *', 'Allow: /', '', `Sitemap: ${sitemap.href}`]
    : [
        '# Not launched: crawling is off until PUBLIC_SITE_INDEXABLE=true.',
        'User-agent: *',
        'Disallow: /',
      ];
  return new Response(`${lines.join('\n')}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
