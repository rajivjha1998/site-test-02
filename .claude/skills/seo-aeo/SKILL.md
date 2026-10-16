---
name: seo-aeo
description: Search (SEO) and answer-engine (AEO — ChatGPT, Perplexity, Google AI Overviews, Claude) optimisation for this website. Use when adding or renaming a page or URL, choosing what a page targets, writing titles, descriptions, FAQs or headings, or planning new pages for search.
---

# SEO and AEO

Hard rules live in `.claude/rules/content.md` (URLs, titles, JSON-LD, answer-first writing) and are enforced by the build and e2e tests. This skill is the **method** for deciding what a page should target and how to write it so it ranks and gets quoted.

## 1. One page, one intent
Before writing, name the page's search intent and the exact phrase a buyer would type:
| Intent | Page type | Example |
|---|---|---|
| "What is / how does" (informational) | Platform, how-it-works, `/learn/` | "how to automate email to ticket" |
| "Software for X" (commercial) | Industry, app, capability | "maintenance request software for property managers" |
| "Brand + thing" (navigational) | Pricing, contact | "<brand> pricing" |
Two pages must not target the same phrase; if they overlap, merge them or split the intent (short sales page vs. "how it works" deep-dive).

## 2. Write for answers
- First sentence of the page (hero lede or first section) states what it is in plain words: "<Brand> helps…".
- Each section's first sentence answers its heading on its own — answer engines lift single sentences.
- FAQs: real buyer questions, 40–60-word self-contained answers (FAQPage JSON-LD is generated automatically).
- Use the buyer's words (email, leads, maintenance, approvals), then the product name.

## 3. Titles and descriptions
- Title ≤ 60 characters including "": lead with the searched phrase ("AI agents and workflow automation").
- Description ≤ 155: what it is + who it's for + one concrete detail. It is the search snippet, so make it worth clicking.
- One H1 (the hero), H2s are section claims, H3s are items.

## 4. Scale with page templates (programmatic SEO)
Repeatable, high-intent page sets (integrations, use cases, industries) are each a page in `site.json` on an existing template. Every page in a set needs unique substance (its own details and FAQs), never just a swapped noun.

## 5. Internal links
Hub pages list every child via `pageCards`; each child links back and to 2–3 related pages with descriptive link text ("See the data fabric", never "click here"). New pages need a `card` so hubs pick them up.

## 6. New-page checklist
1. Intent and target phrase chosen; no overlap with an existing page.
2. URL: lowercase-kebab, descriptive, trailing slash; renamed live URLs get a 301 in `public/_redirects`.
3. Title, description, H1 and first sentence all say the same thing in plain words.
4. At least one FAQ a buyer would actually ask.
5. Linked from its hub (card) and from 2–3 related pages.
6. `pnpm check` passes (validates SEO limits, JSON-LD, sitemap, `llms.txt`, a11y).

## 7. After launch
Set `PUBLIC_SITE_INDEXABLE=true`, check Cloudflare doesn't block AI crawlers, submit the sitemap in Google Search Console and Bing Webmaster Tools, and review which queries each page actually wins every month.
