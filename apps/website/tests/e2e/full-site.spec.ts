import { expect, test, type Page } from '@playwright/test';

// Checks that only make sense on the fixture site (apps/website/tests/fixtures/full.site.json),
// which uses every section and image type. Run with `pnpm test:e2e:full`.
test.skip(!process.env.E2E_FULL, 'fixture site only');

async function loadEverything(page: Page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 400) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 40));
    }
    window.scrollTo(0, 0);
  });
}

test.describe('home page', () => {
  test('hidden sections never appear', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).not.toContainText('SHOULD-NOT-RENDER');
  });

  test('every picture loads and reserves its space', async ({ page }) => {
    await page.goto('/');
    await loadEverything(page);
    // Lazy pictures load as they scroll into view; wait for all of them rather than guess.
    await expect
      .poll(
        () =>
          page
            .locator('main img')
            .evaluateAll((nodes) =>
              (nodes as HTMLImageElement[]).every((img) => img.complete && img.naturalWidth > 0),
            ),
        { timeout: 15_000 },
      )
      .toBe(true);
    const images = await page.locator('main img').evaluateAll((nodes) =>
      (nodes as HTMLImageElement[]).map((img) => ({
        src: img.getAttribute('src'),
        alt: img.getAttribute('alt'),
        sized: Boolean(img.getAttribute('width') && img.getAttribute('height')),
      })),
    );
    expect(images.length).toBeGreaterThan(10);
    expect(images.filter((i) => !i.sized).map((i) => i.src)).toEqual([]);
    expect(images.filter((i) => !i.alt).map((i) => i.src)).toEqual([]);
  });

  test('the hero picture loads first, the rest load lazily', async ({ page }) => {
    await page.goto('/');
    const hero = page.locator('.hero img').first();
    await expect(hero).toHaveAttribute('fetchpriority', 'high');
    await expect(hero).toHaveAttribute('loading', 'eager');
    await expect(page.locator('main img[loading="lazy"]').first()).toBeAttached();
  });

  test('people without a photo get initials', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('CL', { exact: true })).toBeVisible();
  });

  test('page cards list the other pages', async ({ page }) => {
    await page.goto('/');
    const cards = page.locator('section', { hasText: 'Explore more.' });
    await expect(cards.getByRole('link', { name: /About us/ })).toBeVisible();
    await expect(cards.getByRole('link', { name: /Services/ })).toBeVisible();
  });

  test('the page has exactly one H1', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toHaveCount(1);
  });
});

test.describe('about page', () => {
  test('Markdown is rendered and made safe', async ({ page }) => {
    await page.goto('/about/');
    const rich = page
      .locator('section', { hasText: 'Our story' })
      .locator('div')
      .filter({ hasText: 'We started in' })
      .last();
    await expect(page.getByRole('heading', { name: 'What we believe' })).toBeVisible();
    await expect(page.locator('main script')).toHaveCount(0);
    await expect(page.locator('main a[href^="javascript:"]')).toHaveCount(0);
    await expect(page.locator('main')).toContainText("<script>alert('x')</script>");
    await expect(page.getByRole('link', { name: 'safe link' })).toHaveAttribute('rel', /noopener/);
    await expect(rich).toBeAttached();
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('contact details link to email and phone', async ({ page }) => {
    await page.goto('/about/');
    await expect(page.getByRole('link', { name: 'hello@example.com' }).first()).toHaveAttribute(
      'href',
      'mailto:hello@example.com',
    );
    await expect(page.getByRole('link', { name: '+1 555 010 2030' })).toHaveAttribute(
      'href',
      'tel:+15550102030',
    );
  });
});

test.describe('studio.json', () => {
  test('publishes the schema, catalogue, limits and build info', async ({ request }) => {
    const response = await request.get('/studio.json');
    expect(response.status()).toBe(200);
    const studio = await response.json();
    expect(studio.studioVersion).toBe(1);
    expect(studio.limits).toEqual({ maxPages: 8, maxBytes: 61440 });
    expect(studio.catalog.length).toBeGreaterThanOrEqual(17);
    expect(studio.catalog.map((c: { type: string }) => c.type)).not.toContain('tabbedShowcase');
    expect(studio.schema.properties.pages).toBeTruthy();
    expect(studio.build).toHaveProperty('commit');
    expect(studio.build).toHaveProperty('requestId');
  });

  test('is not listed in the sitemap', async ({ request }) => {
    const sitemap = await (await request.get('/sitemap-0.xml')).text();
    expect(sitemap).not.toContain('studio.json');
  });
});
