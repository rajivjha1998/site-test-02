# Site template design system — the LLM file
# Version 3 · October 2026 · structure inspired by hyros.com; each site's identity comes from its site.json
# Hand this file to an AI and it can build any page or section of this site on brand.

## 0. How to use this file

- Read `claude-reference.md` (sources, approval status, open questions) first, then `site.json` (brand, theme, pages).
- Build pages by composing sections from the UI library (section 7) with the tokens (section 2) and type roles (section 3). Never hand-write a one-off section that duplicates an existing one — add a prop instead.
- Brand name, logo, favicon and the three theme colours come from `site.json` (`brand`, `theme`). Accent tokens are generated from `theme` by `packages/ui/src/lib/theme.ts`; never hard-code a brand colour.
- Copy, testimonials, client names, logos and figures are never invented (section 14). Use clearly fake placeholders (`[Client quote — pending]`) when content is missing.
- hyros.com is the visual benchmark for polish and structure (whitespace, layout rhythm, section order, restraint, clean product windows). Never use HYROS assets: their logo, Sven mascot, zebra print, P22 Mackinac font, purple `#5150F6`, copy, quotes or animation scripts.

## 1. Principles

What the site is: `brand.description` in `site.json`. Pages are the keys of `pages` in `site.json`.

The design language: calm, technical, minimal. A light neutral ground, one confident display face, quiet labels, ONE brand accent, and product windows that show the work instead of describing it.

Hard rules
- One accent per element. The accent marks "the point": the key figure, the second sentence of a headline, links, the active state. Never two accents in one element.
- Status colours (success / warning / error) appear only inside data and form feedback — never in headlines, icons, buttons or illustrations.
- Backgrounds are flat tokens; the only decoration is the soft glow in the hero and closing panel (section 5).
- Bold is not used for emphasis in body copy; emphasis is ink-on-grey or the accent.
- Real logos, headshots and screenshots only. Illustrative figures in product windows stay plausible and are labelled as illustrative where a reader could mistake them for results.
- Mobile first: every section must work at 360–390px.
- `prefers-reduced-motion` gets the finished static frame of every animation.

## 2. Tokens

Tokens live in one file, `packages/ui/src/styles/tokens.css`, and every component reads them by semantic name. Never hard-code a colour, radius or shadow in a component.

```css
:root {
  /* grounds — cool, low-glare greys; no pure white on the page */
  --bg: #F2F5F9;            
  --surface: #F9FAFC;       /* alternating bands, cards, windows */
  --panel: #E9EEF5;         /* framed panel, quiet cells */
  --subtle: #E2E8F0;        /* secondary button, segmented controls */
  --accent-bg: #E3ECFD;     /* blue-tinted pills and highlights */
  --inverse: #0F172A;       /* dark bands, terminal */
  /* text — cool slate */
  --ink: #0F172A;  --text: #3F4A5C;  --muted: #5B6577;   /* muted still ≥4.5:1 on --bg */
  --hair: rgb(15 23 42 / .10);  --hair-soft: rgb(15 23 42 / .06);
  /* primary blue — buttons, links, the accent half of a headline */
  --accent: #2563EB;  --accent-strong: #1D4ED8 /* hover */;  --accent-text: #1D4ED8 /* small text on blue tints */;  --accent-2: #4F46E5 /* gradient end */;  --accent-ink: #FFFFFF;
  /* soft glows (§5) */
  --glow-1: rgb(37 99 235 / .22);  --glow-2: rgb(56 189 248 / .20);  --glow-3: rgb(129 140 248 / .18);
  /* status — data and form feedback only */
  --ok: #1F8A5B; --warn: #B7791F; --error: #C2410C;   /* dots, borders */
  --ok-text: #17704A; --warn-text: #8A5A12; --error-text: #B23A0B;   /* small text, AA contrast */
  /* radii, shadows (windows/cards only), layout, spacing, type scale, motion: see tokens.css */
}
```
Dark sections set the same semantic names on a `[data-theme="dark"]` wrapper; components never branch on theme.

## 3. Type

| Role | Face | Size / weight | Notes |
|---|---|---|---|
| Hero H1 | display | clamp(40px, 5.5vw, 60px), 400, lh 1.08, ls −0.012em | one per page |
| Section H2 | display | clamp(32px, 4.5vw, 52px), 500, lh 1.1 | second sentence may take the accent |
| Card / FAQ titles | display | 19–20px medium, lh 1.3 | |
| Big figures | display | 36–88px medium, tabular numerals | |
| Lede | body | 17–18px, lh 1.55, `--text` | max-width ~60ch, `text-wrap: balance` |
| Body | body | 15–16px, lh 1.6, `--text` | max-width ~65ch |
| Buttons | body | 15px regular, lh 1 | |
| Nav links | body | 13–14px | |
| Labels | mono | 11–12px, `--muted` | window and table headers; sentence case |

Fonts (all SIL Open Font License, free for web and commercial use):
- Display: **Newsreader** — warm, sturdy serif chosen as the open-licence counterpart to the Book-weight serif on hyros.com. Weights 400 (H1, ledes) and 500 (H2, titles, figures) only; leave `font-optical-sizing: auto` on so large sizes get the display cut. Tabular figures via `font-variant-numeric: tabular-nums`.
- Body / UI: **Inter**, 400 and 500. Buttons and body stay 400.
- Labels, window URLs, console: **Geist Mono**, 400.
- Loaded by the Astro Fonts API from `packages/ui/src/config/fonts.ts` (Fontsource provider): self-hosted, hero fonts preloaded, size-matched fallbacks generated automatically.

## 4. Layout rhythm
- Container `--container`, side padding `--gutter`, vertical padding `--section-pad`.
- Alternate grounds: `--bg` → `--surface` band (hairline top + bottom) → `--bg`. Alternate alignment: centred → two-column → centred.
- One idea and at most one visual per section.
- At most one framed panel per page. Never a box inside a box.
- Two-column sections: `grid-template-columns: 1fr 1fr`, gap 48–72px, text column max ~480px; one column below 760px.
- Breakpoint: `@media (max-width: 760px)` — grids collapse, buttons stack full-width, windows scale down rather than reflow their internals.
- Hero (enforced): headline ≤34 characters + optional second line ≤24, lede ≤100, two buttons, one product window. No badges, notes or labels.
- Density (enforced by the schemas): ≤4 feature items, ≤4 tabs, ≤5 steps, ≤5 FAQs, ≤2 short paragraphs and ≤3 bullets per split, ledes ≤130 characters. If copy doesn't fit, cut it or give the idea its own section or page.

## 5. Glow and glass
Approved by the owner on 2026-10-07/08. Together they are the only decoration.
- **Ambient glow:** one fixed, very soft field of `--glow-1/2/3` radial gradients behind the whole page (`base.css`), plus a stronger glow in the hero and inside the closing `CtaPanel`. Section bands are translucent tints (`--band-tint`), never solid fills, so the glow carries through.
- **Glass surfaces:** floating UI uses the glass tokens — `--glass-bg` (55% white) or `--glass-bg-strong` (80%) + `--glass-blur` + `--glass-shadow` (bright inner edge, faint outer hairline, soft drop). Applied to: nav bar, mega-menu, product windows, view switchers and tab bars, cards (page cards, steps, plans, tiers), FAQ list, comparison table, stat strip, logo chips, form card, CTA panel and secondary buttons.
- Glass never holds long body text on a busy background; text contrast stays AA (checked by axe in e2e).
- The hero's accent sentence may use the `--accent` → `--accent-2` gradient as text fill. No other gradient text.
- An optional brand texture (SVG) can replace the glows later.

## 6. Logo
`brand.logo` in `site.json` (a file in `assets/`, served at `/assets/...`); without one, the brand name renders as a text wordmark in the display face. `brand.favicon` likewise; without one, `/favicon.svg` is a monogram on the primary colour. Logo height 28px in nav and footer. Never stretch, outline, shadow or recolour a logo.

## 7. UI library — Astro sections

Every section is an Astro component in `packages/ui/src/sections/`, takes all text and links as props, and contains no site-specific copy. Sites pass content from `site.json`. The same component must render on any site with only content changes.

Section `type` values (content) → components. Exact fields: `packages/ui/src/schemas/sections.ts`; every section also takes `title`, `titleAccent`, `lede`, `band` (base · surface · panel · accent · dark) and `anchor` unless noted.

| `type` | Component | Use it for | Notes |
|---|---|---|---|
| `hero` | Hero | the page's only H1 | `layout: split` (text + picture) or `centered`; optional `context` line, ≤2 CTAs, `note`, `image` |
| `logoStrip` | LogoStrip | "Works with / seen in" | text chips, or `image` logos per item |
| `statStrip` | StatStrip | 2–4 factual figures | `source` line for any claim |
| `featureGrid` | FeatureGrid | capabilities, benefits | 2/3/4 columns, `plain` or `cards`; each item has an icon or an `image` |
| `split` | Split | one idea + one picture | `image`; `reverse` puts it on the left |
| `steps` | Steps | a real sequence | numbered only because order matters |
| `offers` | Offers | products or services | up to 9 cards: `image`, `badge`, `price`, `priceNote`, `cta` |
| `gallery` | Gallery | a set of photos | 2–12 images, optional captions, 2–4 columns |
| `team` | Team | the people | photo or initials, role, short bio |
| `testimonial` | Testimonial | one approved quote | verbatim only; optional `avatar` |
| `pricingTable` | PricingTable | plans | one `highlight` plan |
| `comparisonTable` | ComparisonTable | tiers or alternatives | ✓ / — / text values; scrolls inside its box on phones |
| `faq` | Faq | questions | native `<details>`; emits FAQPage JSON-LD |
| `ctaPanel` | CtaPanel | the closing ask | the one framed panel per page |
| `contact` | Contact | how to reach the business | email, phone, address, hours; needs at least one |
| `richText` | RichText | about text, policies, terms | Markdown, sanitised (no HTML, no images) |
| `pageCards` | PageCards | hubs and related pages | lists pages by `card.group` / tag, so hubs update themselves |
| `form` | FormSection | contact, enquiries | needs the forms service; not offered to customers yet |

Every section also takes `hidden: true` to stay in `site.json` without showing. Pictures are `{ src, alt }`, `alt` required; `src` is a file in `assets/` or an https address. The hero's `media` product windows and the tabbed showcase and tier ladder sections were removed: customer sites use pictures.

Layout-level components (not sections): `Nav`, `Footer`, `Seo`, `Logo`, `Prose` (legal/article text), `ProductWindow` (§8).

Buttons: one `Button` component with `variant="primary" | "secondary" | "link"`; primary is `--accent` blue (with a soft blue drop shadow), secondary is `--subtle`, link is underlined `--accent`.

## 8. Product-window kit
Every product graphic (dashboard, report, console) is built from one kit — arrange its parts, never invent a new window style.
- Window: `--surface`, `--hair` border, `--r-win`, `--sh-win`, `overflow: hidden`. Title bar with three neutral dots and a centred mono address (the domain from `brand.url`). Never a real browser chrome.
- Screens (`kind` in `src/content/screens/*.yaml`, schema `schemas/screen.ts`): `table`, `tree`, `chat`, `wizard`, `kpis`, `catalog`, `form`, `flow`, `agents` (an agent run with person/agent/both steps), `workflow` (an automation canvas: trigger, agent, person, logic and action nodes on a dotted grid joined by curved connectors with Yes/No branch labels; the run plays node by node with flowing connectors and a live status bar, branches not taken stay dimmed; rendered finished for no-JS, reduced motion and search engines; never name third-party automation tools). Several screens in one window get a switcher; views share one grid cell and crossfade, so the window never changes height. `autoplay: true` (hero only) cycles views every ~5s, pauses on hover/focus or off-screen, stops once a view is chosen, and never runs with reduced motion. Screens adapt to the window's width (container queries), not the viewport's.
- The accent marks what the product changed or added — never "good". Status colours only inside status cells.
- Windows never resize while animating; content scrolls inside a fixed height. Prefer real (anonymised) product screenshots where available.

## 9. Icons
- One family: Lucide line icons (ISC licence) via `@lucide/astro`, stroke 1.75, rendered as inline SVG at build time (no JS). Content uses our semantic names (`schemas/common.ts` → `iconNames`); the mapping lives only in `primitives/Icon.astro`, so the set can be swapped in one file.
- One treatment: `IconTile` — a soft blue gradient tile (34/44/54px) with the icon in `--accent-text`. Used on feature items, page cards and mega-menu links.
- Inline icons (no tile): tab labels, link chevrons, `CheckList` ticks, comparison-table check / minus marks.
- Section headings: no icon by default; at most one heading icon per page (enforced). Steps use their number, not an icon.
- Use an icon to introduce or label a topic, never as decoration: one per heading, one per item, and leave it out when no icon is clearly right.
- Brand and partner logos are not icons; real logos only with permission (`LogoStrip` stays text until then).

## 10. Motion
- Motion lives inside product windows and consoles. Sections fade/rise at most once (opacity + 8–12px, .6s), triggered by IntersectionObserver.
- One orchestrated moment per page beats scattered effects. No hover animation on every card.
- Loops use one `requestAnimationFrame` clock, hold at the end, then fade out before reset — never snap.
- Typing effects: 22–28ms per character; counters tween with ease-out cubic over ~750ms.
- Vanilla JS in a `<script>` inside the Astro component; no animation library unless approved.
- Reduced motion: render the finished frame.

## 11. Forms — config-driven
Forms are data, not markup. A form is a JSON file in `src/content/forms/<id>.json` (schema: `packages/ui/src/schemas/form.ts`; examples: `demo.json`, `contact.json`, `partner-application.json`) rendered by `ConfigForm`. Fields support `required`, `hint`, `options`, `min`/`max`, `showIf` (conditional), `prefillParam` (from the query string, e.g. `/demo/?industry=…`) and `width: half`. Adding a field never touches component code.
- UI: field types map 1:1 to native inputs; labels always visible above the field; errors inline under the field, specific, in the interface's voice; one column on phones; the submit button names the outcome.
- Multi-step: `steps` (2–3) splits a form; step 1 is the smallest useful lead (usually just the work email) and is saved the moment the visitor continues, so an abandoned form still leaves a lead. Details go in step 2. A progress line ("Step 1 of 2") and a Back button are always shown.
- Email first: `EmailCapture` is a one-field form (hero and closing panel via `capture`) that saves the email, then opens the full form with it filled in and step 2 showing. Nav items can carry a `gate`: the first click opens a small dialog asking for the email before the page; known visitors pass straight through.
- Validation, endpoints and spam protection: `.claude/rules/api-design.md`.

## 12. SEO and performance
SEO rules live in `.claude/rules/content.md`. Budget: LCP < 2.0s on 4G, CLS < 0.05, zero JS on pages without interactive pieces, `@astrojs/sitemap` + `robots.txt`.

## 13. Page recipes
- Home: Nav → Hero (product window) → LogoStrip → StatStrip → FeatureGrid or service picker → SplitSection ×1–2 → Testimonial → CtaPanel → FAQ → Footer.
- Service page (BPO, property management, commercial GC, enterprise): Hero → problem SplitSection → solution SplitSection with ProductWindow → Steps → Testimonial → CtaPanel → FAQ → Footer.
- Platform: Hero with console + dashboard → FeatureGrid → SplitSection ×2 → CtaPanel → Footer.
- Pricing + FAQs: Hero → PricingTable → FAQ → CtaPanel → Footer.
- Legal (terms, privacy): Nav → long-form prose at ~70ch → Footer. No marketing sections.

## 14. Copy
Voice: plain, confident, short, sentence case, active verbs. Headlines are claims that end with a full stop; the second sentence may take the accent. Buttons say exactly what happens ("Book a demo"); an action keeps the same name through the flow. Avoid em dashes in copy (they read as machine-written; the content test rejects them): use a full stop or a comma.
Approved lines: only what the owner has supplied in `site.json`. Do not invent slogans, testimonials, client names or numbers.

## 15. Do / Don't
Do: open sections, one idea each, one accent, product windows for the product, real proof, content in props.
Don't: hard-code copy in components, add a colour for one section, stack two framed panels, put glows or gradients anywhere but the hero and closing panel, use text shadows, animate every card, let a window grow while it animates, or reuse any HYROS asset, copy or font.
