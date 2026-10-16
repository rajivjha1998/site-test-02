# Website (site template)

A marketing website built from one file: `site.json` at the repo root. Astro (static), published with GitHub Pages (live at `https://<owner>.github.io/<repo>/`, draft preview at `…/preview/`). Created from the BBPlatform site template; the owner edits content through BBPlatform's site builder, which writes `site.json` on the `draft` branch.

## Priorities (in order)
1. The owner's content and brand, exactly as given in `site.json`. Never invent copy, prices, testimonials, logos or figures.
2. UI/UX quality: clean, consistent sections; accessible; fast.
3. Reliability: `pnpm validate` and `pnpm check` green.

## How content works
- `site.json` holds everything: `brand`, `theme` (3 colours), `navigation`, `footer`, `pages` (key = URL path, e.g. `"/"`), `forms`.
- `site.schema.json` is its contract (the live copy is also published at `/studio.json`) (generated; run `pnpm schema` after changing a schema in `packages/ui/src/schemas/`).
- Images and logos live in `assets/` and are referenced as `assets/<file>` (served at `/assets/<file>`). Pictures in sections are `{ "src": "assets/hero.webp", "alt": "…" }` (or a full https address); **alt text is required**. Never use `..` or invent file names: only use files that exist in `assets/`.
- Sections available to customers: `hero`, `logoStrip`, `statStrip`, `featureGrid`, `split`, `steps`, `offers`, `gallery`, `team`, `testimonial`, `pricingTable`, `comparisonTable`, `faq`, `ctaPanel`, `contact`, `richText`, `pageCards`. (`form` needs the forms service, which isn't set up yet.) Set `"hidden": true` to keep a section but not show it. The hero can't be hidden.
- Limits: at most 8 pages, `site.json` at most 60 KB, `richText` body at most 8000 characters (Markdown: headings, lists, bold, links; no HTML or images).
- Anything you can't know yet (prices, quotes, names, figures, photos) is written as `[Pending: what is needed]`, and pictures you don't have use `assets/placeholder.svg`. Publishing is blocked until every placeholder is replaced (`pnpm check-publish`).
- Accent colours are generated from `theme` by `packages/ui/src/lib/theme.ts` and adjusted for readability. Never hard-code a colour.
- New page = new key in `pages`. New section type = schema in `packages/ui/src/schemas/sections.ts` + component + a case in `SectionRenderer` + `pnpm schema`.

## Branches
- `draft`: work in progress; the **Deploy site** workflow publishes it at `…/preview/`. All edits go here.
- `gh-pages`: build output only (one commit, rewritten on every deploy). Never edit it.
- `main`: the live site. Changes reach it only when the owner approves (merge from `draft`).

## Skills
`frontend-design` before any UI work · `marketing-expert` before writing or reviewing copy · `seo-aeo` for titles, descriptions, FAQs and new pages. Design rules: `claude-design.md` and `claude-reference.md`. Detailed standards load from `.claude/rules/`.

## Structure
```
site.json             all content (brand, theme, navigation, footer, pages, forms)
site.schema.json      generated JSON Schema for site.json
assets/               logo, favicon, images
scripts/              apply-settings.mjs (builder answers → site.json), update-file.mjs (builder file edits), access-code.mjs (site access codes), session-id.mjs (sign-in session names)
site-builder.files.json  files the site builder may edit (exact paths)
.site-builder/access.json  salted hash of the site's access code; never edit by hand or through the builder
packages/ui/src/      @blackboxops/ui: schemas, sections, components, theme, tokens — no site copy
apps/website/         Astro app that renders site.json
apps/forms-worker/    form endpoint for static hosting
.github/workflows/    deploy-pages (publishes live from main and the preview from draft to gh-pages), update-settings (builder answers / file edits / restores → draft; needs the access code), verify-access (opens a sign-in session branch named after the task number), set-access-code (owner only), ensure-site (template only), check
```

## Commands
Node 22 (`nvm use`), pnpm. `pnpm dev` · `pnpm build` · `pnpm validate` (site.json only, lists every problem) · `pnpm check-publish` (placeholders left?) · `pnpm test` · `pnpm test:e2e` (after a build) · `pnpm check` (format, lint, types, unit, build, e2e, then the same build and e2e on the fixture site that uses every section: `apps/website/tests/fixtures/`).
Apply builder answers locally: `pnpm apply-settings settings.json`.
Env: `SITE_URL` / `SITE_BASE` (deploy address) · `PUBLIC_SITE_INDEXABLE=true` at launch (off = noindex) · `PUBLIC_FORMS_ORIGIN` · `PUBLIC_TURNSTILE_SITE_KEY`.
Internal links go through `withBase()`.

## Git
Never commit to `main`, merge, or push without the owner's explicit confirmation. Work on `draft`.

## Done means
`pnpm check` passes, rendered at 360px and 1280px, and the report lists anything marked `[Pending: …]`.
