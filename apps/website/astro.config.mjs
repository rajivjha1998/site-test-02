// @ts-check
import { readFileSync } from 'node:fs';
import { defineConfig, envField } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { uiFonts } from '@blackboxops/ui/config/fonts.ts';

// Where the site is deployed: SITE_URL, else `brand.url` in site.json. Sub-folder hosts
// (e.g. GitHub Pages project sites) also set SITE_BASE, e.g. SITE_BASE=/my-repo/
const siteFile = new URL(process.env.SITE_CONFIG ?? '../../site.json', import.meta.url);
const brandUrl = JSON.parse(readFileSync(siteFile, 'utf8')).brand?.url;
const SITE = process.env.SITE_URL || brandUrl || 'https://example.com';
const BASE = process.env.SITE_BASE || '/';

export default defineConfig({
  site: SITE,
  base: BASE,
  trailingSlash: 'always',
  // SITE_OUT_DIR lets tests build a second copy of the site next to the real one.
  outDir: process.env.SITE_OUT_DIR || './dist',
  build: { format: 'directory' },
  fonts: uiFonts,
  env: {
    schema: {
      // Off until launch: pages are noindex and robots.txt disallows crawling.
      PUBLIC_SITE_INDEXABLE: envField.boolean({
        context: 'client',
        access: 'public',
        default: false,
      }),
      // Origin of the standalone forms worker when hosted statically (GitHub Pages).
      // Unset = same-site /api/forms/* (Cloudflare Pages Functions).
      PUBLIC_FORMS_ORIGIN: envField.string({
        context: 'client',
        access: 'public',
        optional: true,
      }),
      // Cloudflare Turnstile site key; forms render without the widget when unset.
      PUBLIC_TURNSTILE_SITE_KEY: envField.string({
        context: 'client',
        access: 'public',
        optional: true,
      }),
    },
  },
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/dev/'),
    }),
  ],
});
