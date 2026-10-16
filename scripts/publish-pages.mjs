// Places a finished build into the working copy of the `gh-pages` branch.
//
//   node scripts/publish-pages.mjs <live|preview> <dist-folder> <gh-pages-folder>
//
// GitHub Pages serves each site from that branch:
//   live    → the root of the branch   (https://<owner>.github.io/<repo>/)
//   preview → the `preview/` folder    (https://<owner>.github.io/<repo>/preview/)
// A live build replaces everything except `preview/`; a preview build replaces only `preview/`,
// so publishing one never disturbs the other.
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const MODES = ['live', 'preview'];

export function applyBuild({ mode, dist, target }) {
  if (!MODES.includes(mode)) throw new Error(`Mode must be "live" or "preview", not "${mode}".`);
  if (!existsSync(join(dist, 'index.html'))) {
    throw new Error(`The build in ${dist} has no index.html, so nothing was published.`);
  }
  mkdirSync(target, { recursive: true });

  if (mode === 'preview') {
    rmSync(join(target, 'preview'), { recursive: true, force: true });
    cpSync(dist, join(target, 'preview'), { recursive: true });
  } else {
    if (existsSync(join(dist, 'preview'))) {
      throw new Error('The site has a page at /preview/, which is reserved for the draft preview.');
    }
    for (const entry of readdirSync(target)) {
      if (entry === '.git' || entry === 'preview') continue;
      rmSync(join(target, entry), { recursive: true, force: true });
    }
    cpSync(dist, target, { recursive: true });
  }
  // Without this GitHub would run Jekyll over the site, which drops folders starting with "_".
  writeFileSync(join(target, '.nojekyll'), 'Not a Jekyll site.\n');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [mode, dist, target] = process.argv.slice(2);
  if (!mode || !dist || !target) {
    console.error('Usage: node scripts/publish-pages.mjs <live|preview> <dist> <gh-pages-folder>');
    process.exit(2);
  }
  try {
    applyBuild({ mode, dist, target });
    console.log(`Placed the ${mode} build in ${target}.`);
  } catch (error) {
    console.log(`::error::${error.message}`);
    process.exit(1);
  }
}
