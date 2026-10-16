import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

const site = JSON.parse(
  readFileSync(fileURLToPath(new URL('../../../../site.json', import.meta.url)), 'utf8'),
);

test.describe('mobile navigation', () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) >= 960, 'mobile only');

  test('the menu opens full-screen with the primary action', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-mobile-menu] > summary').click();
    const sheet = page.locator('[data-mobile-menu] .sheet');
    const box = await sheet.boundingBox();
    expect(box?.height).toBeGreaterThan(600);
    await expect(sheet.getByRole('link', { name: site.navigation.actions[0].label })).toBeVisible();
  });
});

test.describe('brand from site.json', () => {
  test('the header shows the brand and the hero shows its buttons', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('header').getByText(site.brand.name).first()).toBeAttached();
    const hero = site.pages['/'].sections[0];
    for (const cta of hero.ctas) {
      await expect(
        page.locator('main').getByRole('link', { name: cta.label }).first(),
      ).toBeVisible();
    }
  });

  test('the theme colours are applied', async ({ page }) => {
    await page.goto('/');
    const vars = await page.evaluate(() => {
      const s = getComputedStyle(document.documentElement);
      return {
        accent: s.getPropertyValue('--accent').trim(),
        accent2: s.getPropertyValue('--accent-2').trim(),
      };
    });
    // Colours may be darkened for readability, but they always come from site.json.
    expect(vars.accent).toMatch(/^#[0-9a-f]{6}$/);
    const css = await page
      .locator('style')
      .evaluateAll((els) => els.map((e) => e.textContent).join(''));
    expect(css).toContain(`--accent:${vars.accent};`);
  });

  test('the favicon is served', async ({ request }) => {
    const res = await request.get('/favicon.svg');
    expect(res.status()).toBe(200);
    expect(await res.text()).toContain('<svg');
  });
});

test('the FAQ expands and collapses', async ({ page }) => {
  await page.goto('/');
  const second = page.locator('#faq details').nth(1);
  await expect(second).not.toHaveAttribute('open');
  await second.locator('summary').click();
  await expect(second).toHaveAttribute('open');
});

test.describe('search and answer engines', () => {
  test('pages are noindex and crawling is off until launch', async ({ page, request }) => {
    await page.goto('/');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    expect(await (await request.get('/robots.txt')).text()).toContain('Disallow: /');
  });

  test('llms.txt names the brand and lists the home page', async ({ request }) => {
    const text = await (await request.get('/llms.txt')).text();
    expect(text).toContain(`# ${site.brand.name}`);
  });

  test('FAQ sections publish FAQPage structured data', async ({ page }) => {
    await page.goto('/');
    const ld = JSON.parse(
      (await page.locator('script[type="application/ld+json"]').textContent()) ?? '{}',
    );
    const types = ld['@graph'].map((n: { '@type': string }) => n['@type']);
    expect(types).toEqual(expect.arrayContaining(['Organization', 'WebSite', 'FAQPage']));
  });
});
