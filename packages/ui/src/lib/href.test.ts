import { describe, expect, it } from 'vitest';
import { withBase } from './href';

describe('withBase', () => {
  it('leaves links alone at the domain root', () => {
    expect(withBase('/pricing/', '/')).toBe('/pricing/');
  });

  it('prefixes root-relative links with a sub-folder base', () => {
    expect(withBase('/pricing/', '/bb_ops_website_v1/')).toBe('/bb_ops_website_v1/pricing/');
    expect(withBase('/', '/bb_ops_website_v1/')).toBe('/bb_ops_website_v1/');
    expect(withBase('/demo/?topic=AI', '/site/')).toBe('/site/demo/?topic=AI');
  });

  it('never touches full URLs, anchors or protocol links', () => {
    for (const href of [
      'https://example.com/',
      '#faq',
      'mailto:a@b.co',
      'tel:+1',
      '//cdn.example.com/x',
    ]) {
      expect(withBase(href, '/site/')).toBe(href);
    }
  });
});
