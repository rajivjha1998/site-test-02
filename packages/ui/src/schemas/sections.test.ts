import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { imageSchema } from './common';
import { pageSchema } from './page';
import { sectionCatalog } from './section-catalog';
import { sectionSchema } from './sections';
import { siteConfigSchema } from './site-config';
import { SITE_LIMITS } from './limits';

const rootSite = JSON.parse(
  readFileSync(fileURLToPath(new URL('../../../../site.json', import.meta.url)), 'utf8'),
);

const issues = (result: { success: boolean; error?: { issues: { message: string }[] } }) =>
  result.success ? [] : result.error!.issues.map((i) => i.message);

describe('section catalogue', () => {
  it.each(sectionCatalog.map((entry) => [entry.type, entry] as const))(
    'the %s sample is valid',
    (_type, entry) => {
      const result = sectionSchema.safeParse(entry.sample);
      expect(issues(result)).toEqual([]);
      if (result.success) expect(result.data.type).toBe(entry.type);
    },
  );

  it('offers every section except form, once each', () => {
    const types = sectionCatalog.map((entry) => entry.type);
    expect(new Set(types).size).toBe(types.length);
    const all = sectionSchema.options.map(
      (option) => (option.shape.type as unknown as { def: { values: string[] } }).def.values[0],
    );
    expect([...types].sort()).toEqual(all.filter((type) => type !== 'form').sort());
  });
});

describe('images', () => {
  it.each([
    'assets/hero.webp',
    'assets/team/jo.jpg',
    'assets/logo.svg',
    'https://images.example.com/a.png?w=800',
  ])('accepts %s', (src) => {
    expect(imageSchema.safeParse({ src, alt: 'A description' }).success).toBe(true);
  });

  it.each([
    'assets/../site.json',
    'assets//x.png',
    'assets/hero.exe',
    'assets/hero',
    'http://example.com/a.png',
    '/assets/hero.png',
    'hero.png',
    'javascript:alert(1)',
  ])('rejects %s', (src) => {
    expect(imageSchema.safeParse({ src, alt: 'A description' }).success).toBe(false);
  });

  it('requires alt text', () => {
    expect(imageSchema.safeParse({ src: 'assets/a.png' }).success).toBe(false);
    expect(imageSchema.safeParse({ src: 'assets/a.png', alt: '' }).success).toBe(false);
  });
});

describe('hidden sections', () => {
  const hero = { type: 'hero', layout: 'centered', title: 'Hi.', lede: 'Hello there.', ctas: [] };
  const faq = { type: 'faq', title: 'Questions.', items: [{ q: 'Why?', a: 'Because.' }] };
  const seo = { description: 'A page.' };

  it('accepts hidden on any section', () => {
    expect(sectionSchema.safeParse({ ...faq, hidden: true }).success).toBe(true);
  });

  it('refuses a hidden hero: it holds the only H1', () => {
    const result = pageSchema.safeParse({ seo, sections: [{ ...hero, hidden: true }, faq] });
    expect(issues(result).join()).toContain("can't be hidden");
  });

  it('allows a hidden section below the hero', () => {
    expect(pageSchema.safeParse({ seo, sections: [hero, { ...faq, hidden: true }] }).success).toBe(
      true,
    );
  });
});

describe('contact section', () => {
  const base = { type: 'contact', title: 'Get in touch.' };

  it('needs at least one way to reach you', () => {
    expect(issues(sectionSchema.safeParse(base)).join()).toContain('at least one');
    expect(sectionSchema.safeParse({ ...base, email: 'hi@example.com' }).success).toBe(true);
  });

  it('checks the email and phone formats', () => {
    expect(sectionSchema.safeParse({ ...base, email: 'not an email' }).success).toBe(false);
    expect(sectionSchema.safeParse({ ...base, phone: 'call me' }).success).toBe(false);
    expect(sectionSchema.safeParse({ ...base, phone: '+1 (555) 010-2030' }).success).toBe(true);
  });
});

describe('site limits', () => {
  it(`allows up to ${SITE_LIMITS.maxPages} pages and no more`, () => {
    const withPages = (count: number) => ({
      ...rootSite,
      pages: Object.fromEntries(
        Array.from({ length: count }, (_, i) => [i === 0 ? '/' : `/p${i}/`, rootSite.pages['/']]),
      ),
    });
    expect(siteConfigSchema.safeParse(withPages(SITE_LIMITS.maxPages)).success).toBe(true);
    expect(
      issues(siteConfigSchema.safeParse(withPages(SITE_LIMITS.maxPages + 1))).join(),
    ).toContain('at most');
  });

  it('keeps /preview/ and /assets/ free for the draft preview and the images', () => {
    const withPage = (path: string) => ({
      ...rootSite,
      pages: { ...rootSite.pages, [path]: rootSite.pages['/'] },
    });
    for (const path of ['/preview/', '/preview/pricing/', '/assets/', '/assets/x/']) {
      expect(issues(siteConfigSchema.safeParse(withPage(path))).join()).toContain('reserved');
    }
    expect(siteConfigSchema.safeParse(withPage('/previews/')).success).toBe(true);
  });

  it('caps rich text at 8000 characters', () => {
    const rich = { type: 'richText', title: 'Policy', body: 'x'.repeat(8001) };
    expect(sectionSchema.safeParse(rich).success).toBe(false);
    expect(sectionSchema.safeParse({ ...rich, body: 'x'.repeat(8000) }).success).toBe(true);
  });
});
