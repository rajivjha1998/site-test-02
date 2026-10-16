// Fails if any page in a build links to a root-relative URL outside the site's base path —
// the classic GitHub Pages sub-folder bug. Usage: node scripts/check-base-links.mjs <dist> <base>
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const [dist, base] = process.argv.slice(2);
if (!dist || !base) {
  console.error('Usage: node scripts/check-base-links.mjs <dist> <base>');
  process.exit(2);
}

const files = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : path.endsWith('.html') ? [path] : [];
  });

const problems = [];
for (const file of files(dist)) {
  const html = readFileSync(file, 'utf8');
  for (const [, attr, url] of html.matchAll(/\s(href|src|action)="(\/[^"]*)"/g)) {
    if (url.startsWith('//') || url.startsWith(base)) continue;
    problems.push(`${file.slice(dist.length)}: ${attr}="${url}"`);
  }
}

if (problems.length > 0) {
  console.error(`Links outside base ${base}:\n${[...new Set(problems)].slice(0, 50).join('\n')}`);
  process.exit(1);
}
console.log(`All internal links stay under ${base}.`);
