import { describe, expect, it } from 'vitest';
// @ts-expect-error plain .mjs script without type declarations
import { findPublishBlockers } from './check-publish.mjs';

describe('findPublishBlockers', () => {
  it('finds nothing in finished content', () => {
    expect(
      findPublishBlockers({ brand: { name: 'Acme' }, pages: { '/': { sections: [] } } }),
    ).toEqual([]);
  });

  it('finds pending text anywhere, with a readable path', () => {
    const found = findPublishBlockers({
      pages: {
        '/': {
          sections: [
            { type: 'hero' },
            { type: 'testimonial', quote: '[Pending: add a real customer quote]' },
          ],
        },
      },
    });
    expect(found).toHaveLength(1);
    expect(found[0].path).toBe('pages["/"].sections[1].quote');
    expect(found[0].kind).toBe('pending');
  });

  it('finds the placeholder picture', () => {
    const found = findPublishBlockers({ image: { src: 'assets/placeholder.svg', alt: 'x' } });
    expect(found.map((f: { kind: string }) => f.kind)).toEqual(['placeholder-image']);
  });

  it('does not flag real assets', () => {
    expect(findPublishBlockers({ image: { src: 'assets/hero.webp', alt: 'x' } })).toEqual([]);
  });
});
