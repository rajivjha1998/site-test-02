# Website

This website is generated from **`site.json`**. Edit it through the BBPlatform site builder, or by hand.

## Setup
```sh
nvm use          # Node 22
corepack enable  # pnpm
pnpm install
pnpm dev         # http://localhost:4321
```

## Commands
| Command | What it does |
|---|---|
| `pnpm dev` | Local dev server |
| `pnpm validate` | Check `site.json` and list every problem |
| `pnpm build` | Static build to `apps/website/dist` |
| `pnpm apply-settings <file>` | Apply site-builder answers (flat JSON) to `site.json` |
| `pnpm schema` | Regenerate `site.schema.json` after a schema change |
| `pnpm check` | Format, lint, types, unit tests, build, end-to-end |

## What lives where
| Path | Contents |
|---|---|
| `site.json` | Brand, colours, navigation, footer, pages, forms |
| `assets/` | Logo, favicon, images |
| `draft` branch | Unpublished changes (preview link) |
| `main` branch | The live site |

## Hosting (GitHub Pages)
The site is published with GitHub Pages from the `gh-pages` branch, which the **Deploy site** workflow maintains:

| Address | Shows |
|---|---|
| `https://<owner>.github.io/<repo>/` | the live site (`main`) |
| `https://<owner>.github.io/<repo>/preview/` | the draft preview (`draft`) |

- A save or publish through the site builder starts the deploy by itself (about 2 minutes). Any normal push to `draft` or `main` does too.
- Both addresses are hidden from search engines until you set the repository variable `PUBLIC_SITE_INDEXABLE=true` (previews are never indexed).
- Custom domain: set the repository variables `SITE_URL` (e.g. `https://www.example.com`) and `SITE_BASE` (`/`), and add the domain in Settings → Pages.
- Private repos need a GitHub plan that includes Pages for private repos. The published site is public even though the repo is private.
- `/studio.json` on each address lists the sections, the schema and which version is live; the site builder reads it.

## Writing a site with Claude
`pnpm generate --brief scripts/generate/samples/bakery.json` writes `site.json` and `assets/*.svg` from a brief (needs `ANTHROPIC_API_KEY`). Claude's answer is checked like a build (schema, links, images, no forms, size) and sent back for fixes up to 3 times; nothing is saved unless it passes. Pictures are simple SVG drawings, sanitised (no scripts or outside links); anything Claude cannot know is written as `[Pending: …]` and blocks publishing.

- Try it without a customer repo: Actions > **Generate a test site** (uses the `ANTHROPIC_API_KEY` secret, downloadable result).
- In the product: send a `brief` object with the `ensure-site` event; for a NEW site Claude writes it into the draft branch. Daily limit: repository variable `GENERATION_DAILY_CAP` (default 50).
- Brief fields: `scripts/generate/brief.mjs`.
