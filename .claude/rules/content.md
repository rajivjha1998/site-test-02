---
paths:
  - "site.json"
  - "apps/website/src/content/**"
  - "apps/website/src/pages/**"
  - "apps/website/src/layouts/**"
---

# Content, pages, SEO and AEO

All content lives in `site.json` at the repo root (validated by `site.schema.json`; run `pnpm validate`).

## Content
- Pages are entries in `site.json` `pages` (key = URL path) composed of `@blackboxops/ui` sections; no inline copy or one-off styling.
- Every collection has a Zod schema; a missing or wrong field must fail the build, not render blank.
- Never invent copy, testimonials, client names, logos or figures. Use `[Pending: …]` placeholders and list them in the report.
- The brand name comes from `brand.name` in `site.json` — never typed by hand in components.

## URLs
- Lowercase-kebab, descriptive search words, ≤ 3 levels, trailing slash, no IDs/dates/extensions. Marketing names go in titles, not slugs.
- One URL per page; canonical = served URL. Changing a live URL requires a 301 in `public/_redirects`.

## Every page (via the `Seo` component)
- Unique title ≤ 60 chars (`Topic — <brand name>`), meta description ≤ 155, exactly one H1, ordered H2/H3, OG image, breadcrumbs on nested pages.
- JSON-LD: `Organization` + `WebSite` site-wide, `SoftwareApplication` when a page sets `softwareApplication`, `BreadcrumbList` on nested pages, `FAQPage` with FAQ sections.

## Answer-engine (AEO) writing
- Open each page with one plain sentence stating what it is; each section's first sentence answers its heading standalone.
- Prefer question-shaped H2s where natural; FAQ answers 40–60 words, self-contained.
- All copy in static HTML (tabs/accordions keep every panel in the markup).
- Illustrative product-window data gets an "Illustrative example" caption and `data-nosnippet`.
- Link text describes the destination; hubs link to all children, children link back and to 2–3 related pages.
