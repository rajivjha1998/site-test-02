import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { APIRoute } from 'astro';
import { z } from 'astro/zod';
import { sectionCatalog } from '@blackboxops/ui/schemas/section-catalog.ts';
import { SITE_LIMITS } from '@blackboxops/ui/schemas/limits.ts';
import { siteConfigSchema } from '@blackboxops/ui/schemas/site-config.ts';

// Published with every build at /studio.json. The Studio reads it straight from the preview
// site, so the editor always matches this site's template version, and uses `build.commit`
// to know when a saved change is live. Contains no site content.
const generationFile = resolve(process.cwd(), '../../.site-builder/generation.json');

export const GET: APIRoute = () => {
  const generation = existsSync(generationFile)
    ? (JSON.parse(readFileSync(generationFile, 'utf8')) as { requestId?: string })
    : null;
  const body = {
    studioVersion: 1,
    schemaVersion: 1,
    build: {
      commit: process.env.SITE_COMMIT ?? process.env.GITHUB_SHA ?? null,
      branch: process.env.SITE_BRANCH ?? null,
      builtAt: new Date().toISOString(),
      /** The request that produced this version (from its commit message), so the Studio can
       *  tell when its own save is visible. Falls back to the generator's marker. */
      requestId: process.env.SITE_REQUEST_ID || generation?.requestId || null,
    },
    limits: SITE_LIMITS,
    catalog: sectionCatalog,
    schema: z.toJSONSchema(siteConfigSchema, { io: 'input', unrepresentable: 'any' }),
  };
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
