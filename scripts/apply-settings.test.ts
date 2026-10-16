import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { siteConfigSchema } from '../packages/ui/src/schemas/site-config.ts';
// @ts-expect-error plain .mjs script without type declarations
import { applySettings, toHex, toHref } from './apply-settings.mjs';

const site = JSON.parse(
  readFileSync(fileURLToPath(new URL('../site.json', import.meta.url)), 'utf8'),
);

describe('applySettings', () => {
  it('applies HIL answers and still produces a valid site.json', () => {
    const { site: next, ignored } = applySettings(site, {
      brand_name: 'Acme Robotics',
      brand_tagline: 'Robots that tidy your warehouse.',
      color_primary: 'f97316',
      color_secondary: '#7C3AED',
      color_tertiary: '',
      hero_title: 'Tidy warehouses.',
      button1_label: 'Book a call',
      button1_link: '/contact',
      button2_label: 'See pricing',
      button2_link: 'acme.com/pricing',
      unknown_field: 'x',
    });
    expect(next.brand.name).toBe('Acme Robotics');
    expect(next.theme).toEqual({ primary: '#f97316', secondary: '#7c3aed', tertiary: '#38bdf8' });
    expect(next.pages['/'].sections[0].ctas).toEqual([
      { label: 'Book a call', href: '/contact/', variant: 'primary' },
      { label: 'See pricing', href: 'https://acme.com/pricing', variant: 'secondary' },
    ]);
    expect(next.navigation.actions[0]).toMatchObject({ label: 'Book a call', href: '/contact/' });
    expect(ignored).toEqual(['unknown_field']);
    expect(siteConfigSchema.safeParse(next).success).toBe(true);
  });

  it('merges whole sections sent as objects', () => {
    const { site: next } = applySettings(site, { theme: { primary: '#000000' } });
    expect(next.theme).toMatchObject({ primary: '#000000', secondary: '#4f46e5' });
  });

  it('leaves the input untouched', () => {
    applySettings(site, { brand_name: 'Changed' });
    expect(site.brand.name).toBe('Your Company');
  });
});

describe('input clean-up', () => {
  it.each([
    [' #2563EB ', '#2563eb'],
    ['2563eb', '#2563eb'],
  ])('toHex(%j) → %s', (input, out) => expect(toHex(input)).toBe(out));

  it.each([
    ['/pricing', '/pricing/'],
    ['/pricing#plans', '/pricing/#plans'],
    ['#faq', '#faq'],
    ['hello@acme.com', 'mailto:hello@acme.com'],
    ['www.acme.com', 'https://www.acme.com'],
    ['https://acme.com', 'https://acme.com'],
  ])('toHref(%j) → %s', (input, out) => expect(toHref(input)).toBe(out));
});
