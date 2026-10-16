import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
// @ts-expect-error plain .mjs script without type declarations
import { applyBuild } from './publish-pages.mjs';

let root: string;
const write = (path: string, text: string) => {
  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, text);
};
const read = (path: string) => readFileSync(path, 'utf8');
const build = (name: string, files: Record<string, string>) => {
  const dir = join(root, name);
  for (const [file, text] of Object.entries(files)) write(join(dir, file), text);
  return dir;
};

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'pages-'));
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

describe('applyBuild', () => {
  it('puts a live build at the root and writes .nojekyll', () => {
    const dist = build('dist', { 'index.html': 'LIVE', '_astro/a.css': 'css' });
    const target = join(root, 'pages');
    applyBuild({ mode: 'live', dist, target });
    expect(read(join(target, 'index.html'))).toBe('LIVE');
    expect(existsSync(join(target, '_astro/a.css'))).toBe(true);
    expect(existsSync(join(target, '.nojekyll'))).toBe(true);
  });

  it('puts a preview build in preview/ and leaves the live site alone', () => {
    const target = build('pages', { 'index.html': 'LIVE', 'about/index.html': 'ABOUT' });
    const dist = build('dist', { 'index.html': 'DRAFT' });
    applyBuild({ mode: 'preview', dist, target });
    expect(read(join(target, 'preview/index.html'))).toBe('DRAFT');
    expect(read(join(target, 'index.html'))).toBe('LIVE');
    expect(read(join(target, 'about/index.html'))).toBe('ABOUT');
  });

  it('replaces the whole previous preview, so deleted pages disappear', () => {
    const target = build('pages', {
      'preview/index.html': 'OLD',
      'preview/gone/index.html': 'GONE',
    });
    const dist = build('dist', { 'index.html': 'NEW' });
    applyBuild({ mode: 'preview', dist, target });
    expect(read(join(target, 'preview/index.html'))).toBe('NEW');
    expect(existsSync(join(target, 'preview/gone'))).toBe(false);
  });

  it('a live build keeps preview/ but removes stale live files and keeps .git', () => {
    const target = build('pages', {
      'index.html': 'OLD LIVE',
      'stale/index.html': 'STALE',
      'preview/index.html': 'DRAFT',
      '.git/HEAD': 'ref',
    });
    const dist = build('dist', { 'index.html': 'NEW LIVE' });
    applyBuild({ mode: 'live', dist, target });
    expect(read(join(target, 'index.html'))).toBe('NEW LIVE');
    expect(existsSync(join(target, 'stale'))).toBe(false);
    expect(read(join(target, 'preview/index.html'))).toBe('DRAFT');
    expect(read(join(target, '.git/HEAD'))).toBe('ref');
  });

  it('refuses a live build that has its own /preview/ page', () => {
    const dist = build('dist', { 'index.html': 'LIVE', 'preview/index.html': 'CLASH' });
    expect(() => applyBuild({ mode: 'live', dist, target: join(root, 'pages') })).toThrow(
      'reserved',
    );
  });

  it('refuses an empty or unknown build', () => {
    const empty = build('empty', { 'readme.txt': 'x' });
    expect(() => applyBuild({ mode: 'live', dist: empty, target: join(root, 'p') })).toThrow(
      'no index.html',
    );
    const dist = build('dist', { 'index.html': 'x' });
    expect(() => applyBuild({ mode: 'staging', dist, target: join(root, 'p') })).toThrow(
      'Mode must be',
    );
  });
});
