// Saves one file edited in the BBPlatform site builder (Save File agent → update-file event).
//
//   FILE_PATH=CLAUDE.md FILE_CONTENT="..." node scripts/update-file.mjs
//
// Only exact paths listed in site-builder.files.json can be written, and only up to its
// maxBytes. Validation of site.json and the build run afterwards, in the workflow.
import { Buffer } from 'node:buffer';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
export const config = JSON.parse(readFileSync(`${root}site-builder.files.json`, 'utf8'));

/** Returns a list of problems; empty means the file may be saved. */
export function checkFile(path, content, { files, maxBytes } = config) {
  const problems = [];
  if (!files.some((f) => f.path === path)) {
    problems.push(`"${path}" can't be edited. Allowed: ${files.map((f) => f.path).join(', ')}`);
  }
  if (typeof content !== 'string' || content.trim() === '') {
    problems.push("The file is empty. Nothing was saved, so the file wasn't wiped by mistake.");
  } else {
    const bytes = Buffer.byteLength(content, 'utf8');
    if (bytes > maxBytes) problems.push(`The file is ${bytes} bytes; the limit is ${maxBytes}.`);
    if (path.endsWith('.json')) {
      try {
        JSON.parse(content);
      } catch (e) {
        problems.push(`${path} isn't valid JSON: ${e.message}`);
      }
    }
  }
  return problems;
}

/** Normalises line endings and makes sure the file ends with one newline. */
export const normalise = (content) => `${content.replace(/\r\n?/g, '\n').replace(/\n*$/, '')}\n`;

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const path = (process.env.FILE_PATH ?? '').trim();
  const content = process.env.FILE_CONTENT ?? '';
  const problems = checkFile(path, content);
  if (problems.length) {
    for (const p of problems) console.log(`::error::${p}`);
    process.exit(1);
  }
  writeFileSync(`${root}${path}`, normalise(content));
  console.log(`Saved ${path} (${Buffer.byteLength(content, 'utf8')} bytes).`);
}
