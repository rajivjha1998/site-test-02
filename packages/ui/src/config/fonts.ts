import type { AstroUserConfig } from 'astro';
import { fontProviders } from 'astro/config';

/**
 * Design-system fonts (claude-design.md §3), self-hosted via the Astro Fonts API.
 * Spread into `fonts` in each site's astro.config. The cssVariable names are the
 * font tokens components use.
 */
export const uiFonts: NonNullable<AstroUserConfig['fonts']> = [
  {
    provider: fontProviders.fontsource(),
    name: 'Newsreader',
    cssVariable: '--font-display',
    weights: ['400 500'],
    styles: ['normal'],
    subsets: ['latin'],
    fallbacks: ['Georgia', 'serif'],
  },
  {
    provider: fontProviders.fontsource(),
    name: 'Inter',
    cssVariable: '--font-body',
    weights: ['400 500'],
    styles: ['normal'],
    subsets: ['latin'],
    fallbacks: ['system-ui', 'sans-serif'],
  },
  {
    provider: fontProviders.fontsource(),
    name: 'Geist Mono',
    cssVariable: '--font-mono',
    weights: [400],
    styles: ['normal'],
    subsets: ['latin'],
    fallbacks: ['ui-monospace', 'monospace'],
  },
];
