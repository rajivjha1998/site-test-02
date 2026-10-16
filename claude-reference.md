# Site template — design reference

Facts about the sources behind `claude-design.md`. Observed values only; anything not supplied is an open question, never guessed.

## 1. Sources

| Source | Status | Use |
|---|---|---|
| hyros.com | inspiration only | layout rhythm, section order, restraint. No assets, copy, fonts or colours |
| `site.json` | owner-supplied (via the site builder) | brand, colours, copy, pages, forms |
| `assets/` | owner-supplied | logo, favicon, images |

## 2. Colours
Three theme colours in `site.json` → accent tokens via `packages/ui/src/lib/theme.ts`, adjusted automatically for WCAG AA contrast. Neutrals are fixed in `tokens.css`.

## 3. Typography
Newsreader (display), Inter (body/UI), Geist Mono (labels). All OFL; details in claude-design.md §3.

## 4. Spacing, grid, alignment
1180px container, 20–32px gutters, 64–104px section padding, centred ↔ two-column alternation, 760px phone breakpoint.

## 5. Patterns to avoid
1. Anything identifiable as HYROS: purple #5150F6, zebra stripes, pixel mascot, P22 Mackinac, their copy or quotes.
2. Invented proof: fake testimonials, client logos or statistics.
3. Decorative motion on every section or card.
4. Boxes inside boxes; more than one framed panel per page.
5. Copy hard-coded inside reusable components.
