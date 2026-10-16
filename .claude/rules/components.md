---
paths:
  - "packages/ui/**"
---

# UI component standards

## API
- Every component declares `interface Props` with JSDoc on non-obvious props and sensible defaults. No `any`.
- All visible text, links and images come in through props or slots. Zero copy inside `packages/ui`.
- Variants are explicit union props (`variant: 'light' | 'dark'`, `align: 'center' | 'split'`), never boolean piles or caller-supplied class overrides.
- Lists render from arrays (`items[]`); never a fixed number of hard-coded children.
- One component per file, PascalCase name matching the file. Sections in `sections/` (their Zod schemas in `schemas/sections.ts`), shared building blocks in `primitives/`, larger pieces in `components/`.
- Schemas are strict (`z.strictObject`): unknown keys fail the build, which catches typos and YAML that silently split on commas.

## Markup
- Semantic elements: `<section aria-labelledby>`, `<nav>`, `<details>` for FAQ, `<button>` for actions, `<a>` for navigation.
- Heading level is a prop (`headingLevel`, default 2) so sections nest correctly on any page.
- Images: `astro:assets` `<Image>` with width/height and real `alt` (empty only when decorative).

## Shared building blocks
- Icons: `Icon` (inline) and `IconTile` (the one tile style) — never import Lucide directly in a section. Add a name to `iconNames` + `Icon.astro` to use a new icon.
- Lists of benefits/features: `CheckList`. Buttons: `Button`/`Ctas`. Headings: `SectionHeading` (takes `icon`).

## CSS
- Scoped `<style>` in the component; values only from `tokens.css` custom properties — no raw hex, px colours or shadows.
- Mobile first; one breakpoint (`max-width: 760px`) unless the design file says otherwise. No fixed widths on structural elements.
- Low specificity: single class selectors; no `!important`; section spacing owned by the section wrapper only, so neighbours never fight over margins.
- Visible `:focus-visible` on every interactive element; respect `prefers-reduced-motion`.

## JS
- Only where needed, as a `<script>` in the component, scoped to its root element via `data-*` hooks. No globals, no animation libraries without approval.
- Progressive enhancement: the section must read and work with JS off.

## Reliability
- `/dev/sections/` renders the first real example of every section variant automatically — a new variant must be used on a page to appear there. Check it at 360px and 1280px.
- Changing a prop's name or meaning is a breaking change to `@blackboxops/ui`: bump the major version and note it in the changelog.
