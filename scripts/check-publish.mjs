// Blocks publishing while site.json still has placeholders: any "[Pending: …]" text, or the
// placeholder picture. Run before a draft is merged to main.
//
//   node scripts/check-publish.mjs [path/to/site.json]
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const PENDING = '[Pending:';
const PLACEHOLDER_IMAGE = 'assets/placeholder.svg';

/** Where each placeholder is, as readable paths like `pages["/"].sections[2].title`. */
export function findPublishBlockers(value, path = '') {
  const found = [];
  if (typeof value === 'string') {
    if (value.includes(PENDING)) found.push({ path, kind: 'pending', text: value });
    if (value === PLACEHOLDER_IMAGE) found.push({ path, kind: 'placeholder-image', text: value });
  } else if (Array.isArray(value)) {
    value.forEach((item, i) => found.push(...findPublishBlockers(item, `${path}[${i}]`)));
  } else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      const next = /^[A-Za-z_][A-Za-z0-9_]*$/.test(key)
        ? `${path ? `${path}.` : ''}${key}`
        : `${path}[${JSON.stringify(key)}]`;
      found.push(...findPublishBlockers(child, next));
    }
  }
  return found;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const file = process.argv[2] ?? `${root}site.json`;
  const blockers = findPublishBlockers(JSON.parse(readFileSync(file, 'utf8')));
  if (blockers.length) {
    for (const b of blockers) {
      const what =
        b.kind === 'pending'
          ? `still says "${b.text.slice(0, 60)}"`
          : 'still uses the placeholder picture';
      console.log(`::error::${b.path} ${what}`);
    }
    console.log(
      `::error::${blockers.length} placeholder(s) must be replaced before publishing. Nothing was published.`,
    );
    process.exit(1);
  }
  console.log('No placeholders left. OK to publish.');
}
