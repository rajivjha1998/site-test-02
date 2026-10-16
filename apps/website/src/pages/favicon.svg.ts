import type { APIRoute } from 'astro';
import { themeTokens } from '@blackboxops/ui/lib/theme.ts';
import { getSite } from '../lib/site';

// Default browser-tab icon: the brand's first letter on its primary colour.
// Sites with brand.favicon in site.json link to their own file instead.
export const GET: APIRoute = async () => {
  const { brand, theme } = await getSite();
  const { light } = themeTokens(theme);
  const letter = (brand.name.trim()[0] ?? '•').toUpperCase().replace(/[<&>"']/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${light['--accent']}"/><text x="32" y="44" text-anchor="middle" font-family="system-ui, sans-serif" font-size="36" font-weight="600" fill="${light['--accent-ink']}">${letter}</text></svg>`;
  return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml' } });
};
