import { readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import type { APIRoute, GetStaticPaths } from 'astro';
import { assetsDir } from '../../lib/assets';

// Serves the repo's assets/ folder (logos, images uploaded through the site builder)
// at /assets/<file>, so site.json can reference `assets/logo.svg` directly.
const root = assetsDir();

const types: Record<string, string> = {
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
};

const listFiles = (dir: string): string[] => {
  try {
    return readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
      d.isDirectory() ? listFiles(join(dir, d.name)) : [join(dir, d.name)],
    );
  } catch {
    return [];
  }
};

export const getStaticPaths: GetStaticPaths = () =>
  listFiles(root)
    .filter((f) => types[extname(f).toLowerCase()])
    .map((f) => ({ params: { file: relative(root, f).split('\\').join('/') } }));

export const GET: APIRoute = ({ params }) =>
  new Response(readFileSync(join(root, params.file!)), {
    headers: { 'Content-Type': types[extname(params.file!).toLowerCase()]! },
  });
