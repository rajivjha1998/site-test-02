import { describe, expect, it } from 'vitest';
// @ts-expect-error plain .mjs script without type declarations
import { checkFile, config, normalise } from './update-file.mjs';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));

describe('site-builder.files.json', () => {
  it('lists only files that exist in the template', () => {
    const missing = config.files
      .map((f: { path: string }) => f.path)
      .filter((p: string) => !existsSync(`${root}${p}`));
    expect(missing).toEqual([]);
  });
});

describe('checkFile', () => {
  it('accepts an allowed Markdown file', () => {
    expect(checkFile('CLAUDE.md', '# Hello\n')).toEqual([]);
  });

  it.each(['.github/workflows/update-settings.yml', 'package.json', '../secret', 'claude.md'])(
    'refuses %s',
    (path) => {
      expect(checkFile(path, 'x').join()).toContain("can't be edited");
    },
  );

  it('refuses an empty file so nothing is wiped by mistake', () => {
    expect(checkFile('CLAUDE.md', '  \n').join()).toContain('empty');
  });

  it('refuses broken JSON for site.json', () => {
    expect(checkFile('site.json', '{ "brand": ').join()).toContain("isn't valid JSON");
  });

  it('refuses files over the size limit', () => {
    expect(checkFile('CLAUDE.md', 'x'.repeat(config.maxBytes + 1)).join()).toContain('limit');
  });
});

describe('normalise', () => {
  it('uses \\n line endings and ends with exactly one newline', () => {
    expect(normalise('a\r\nb\n\n\n')).toBe('a\nb\n');
  });
});
