---
paths:
  - "**/*.test.ts"
  - "**/tests/**"
  - "**/e2e/**"
---

# Testing

- Unit (Vitest): form schema → validator builder, content helpers, any pure util. Co-locate as `*.test.ts`.
- E2E (Playwright, `apps/website/tests/e2e/`): `routes.spec.ts` checks every sitemap URL at 360px and 1280px — 200, one H1, title/description/canonical, JSON-LD, no horizontal scroll, zero serious axe violations. `interactions.spec.ts` covers menus, tabs, view switcher, FAQ, forms and SEO files. New interactive behaviour gets a test there.
- E2E runs against the production build with the installed Chrome (`PW_CHANNEL=chromium` in CI).
- Tests assert behaviour users see (labels, roles, text), not CSS classes or DOM structure.
