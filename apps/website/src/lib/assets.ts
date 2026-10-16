import { resolve } from 'node:path';

/**
 * The repo's `assets/` folder (logo, favicon, uploaded images). Astro runs from `apps/website`,
 * so the default is two levels up. `SITE_ASSETS_DIR` points tests at a fixture folder.
 */
export const assetsDir = (): string =>
  resolve(process.cwd(), process.env.SITE_ASSETS_DIR ?? '../../assets');
