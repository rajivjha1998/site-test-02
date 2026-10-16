import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { collectImageSrcs, readImageSizes } from './images';

const fixtures = fileURLToPath(new URL('../../tests/fixtures/', import.meta.url));
const assets = `${fixtures}assets`;
const fixtureSite = JSON.parse(readFileSync(`${fixtures}full.site.json`, 'utf8'));

describe('collectImageSrcs', () => {
  it('finds every image anywhere in the site', () => {
    const found = collectImageSrcs(fixtureSite);
    expect([...found].sort()).toEqual([
      'assets/avatar.png',
      'assets/banner.webp',
      'assets/hero.png',
      'assets/logo.svg',
      'assets/photo.jpg',
      'assets/team.jpg',
    ]);
  });

  it('ignores objects that only look similar', () => {
    const found = collectImageSrcs({
      a: { src: 'script.js', alt: 'x' },
      b: { src: 'assets/a.png' },
      c: [{ src: 'https://example.com/a.png', alt: 'ok' }],
    });
    expect([...found]).toEqual(['https://example.com/a.png']);
  });
});

describe('readImageSizes', () => {
  it('reads PNG, JPEG, WebP and SVG sizes from the files', () => {
    const sizes = readImageSizes(
      [
        'assets/hero.png',
        'assets/photo.jpg',
        'assets/banner.webp',
        'assets/logo.svg',
        'assets/avatar.png',
      ],
      assets,
    );
    expect(sizes).toEqual({
      'assets/hero.png': { width: 1200, height: 800 },
      'assets/photo.jpg': { width: 800, height: 600 },
      'assets/banner.webp': { width: 600, height: 400 },
      'assets/logo.svg': { width: 120, height: 40 },
      'assets/avatar.png': { width: 200, height: 200 },
    });
  });

  it('gives https images no size', () => {
    expect(readImageSizes(['https://example.com/a.png'], assets)).toEqual({
      'https://example.com/a.png': {},
    });
  });

  it('fails clearly when a referenced file is missing', () => {
    expect(() => readImageSizes(['assets/nope.png'], assets)).toThrow(
      'Image "assets/nope.png" is used in site.json but the file is not in assets/',
    );
  });

  it('fails clearly when a file is not a real image', () => {
    expect(() => readImageSizes(['assets/broken.png'], assets)).toThrow('could not be read');
  });
});
