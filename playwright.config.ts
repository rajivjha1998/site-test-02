import { defineConfig, devices } from '@playwright/test';

// The fixture-site run uses its own port so it never reuses the normal preview server.
const PORT = process.env.E2E_FULL ? 4331 : 4330;

// End-to-end tests run against the production build (`pnpm build` first).
// Locally they use the installed Google Chrome; set PW_CHANNEL=chromium in CI after
// `npx playwright install chromium`.
export default defineConfig({
  testDir: 'apps/website/tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    channel: process.env.PW_CHANNEL ?? 'chrome',
    // Deterministic by default: no autoplay or entrance animations. Motion has its own test.
    reducedMotion: 'reduce',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'mobile',
      use: { ...devices['Desktop Chrome'], viewport: { width: 360, height: 740 }, hasTouch: true },
    },
  ],
  webServer: {
    command: `pnpm --filter @blackboxops/website exec astro preview --port ${PORT} --ignore-lock`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: !process.env.CI,
  },
});
