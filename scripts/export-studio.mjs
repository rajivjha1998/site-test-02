// Writes the same document the website publishes at /studio.json, without building the site.
// The BBPlatform frontend bundles a copy as the Site Editor's fallback:
//   node --import ./scripts/register-ts.mjs scripts/export-studio.mjs ../bbplatform-frontend/src/assets/site-editor/studio.json
import { writeFileSync } from 'node:fs';
import { z } from 'astro/zod';
import { sectionCatalog } from '../packages/ui/src/schemas/section-catalog.ts';
import { SITE_LIMITS } from '../packages/ui/src/schemas/limits.ts';
import { siteConfigSchema } from '../packages/ui/src/schemas/site-config.ts';

const out = process.argv[2];
if (!out) {
  console.error('Usage: export-studio.mjs <output file>');
  process.exit(2);
}
const body = {
  studioVersion: 1,
  schemaVersion: 1,
  build: { commit: null, branch: null, builtAt: null, requestId: null },
  limits: SITE_LIMITS,
  catalog: sectionCatalog,
  schema: z.toJSONSchema(siteConfigSchema, { io: 'input', unrepresentable: 'any' }),
};
writeFileSync(out, `${JSON.stringify(body)}\n`);
console.log(`Wrote ${out}`);
