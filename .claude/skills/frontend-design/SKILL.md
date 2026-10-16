---
name: frontend-design
description: Design method and quality bar for building or changing any page, section or UI element of this website. Load before writing UI.
---

# Frontend design

## Sources, in priority order
1. The user's explicit request.
2. `claude-design.md` — brand system: tokens, type, layout, components, motion, copy. Its values win over anything below.
3. `claude-reference.md` — what is approved, what is pending, open questions.
4. hyros.com — the benchmark for polish: generous whitespace, one idea per section, restrained colour, product shown in clean windows. Match its level of finish; never copy its assets, copy, colours or fonts.
If these conflict or are silent on a consequential choice, ask.

## Method
1. **Job.** Name the page's audience and the one action it should drive. Every section must earn its place toward that action.
2. **Compose.** Pick the page recipe from `claude-design.md` §13 and map each band to an existing section component. Only propose a new component when no existing one fits with a new prop — say why.
3. **Plan before code.** A short ASCII wireframe per section at desktop and 360px, with alignment noted. Check: does any section look like a generic SaaS template rather than this content? Revise it before building.
4. **Build** with tokens and the component standards in `.claude/rules/components.md`.
5. **Critique.** Screenshot at 360px and 1280px and run the checklist below. Remove one thing that isn't pulling its weight.

## Clean-and-neat checklist
- Alignment: every element sits on the container edges or the column grid; no near-misses.
- Spacing: section padding and gaps come only from tokens; equal-rank gaps are equal.
- Hierarchy: one H1, one clear focal point per section, at most one accent per element.
- Density: ledes ≤ 2 lines on desktop, body ≤ ~65ch, no orphaned single words in headlines (`text-wrap: balance`).
- Consistency: same element = same component, same size, same label everywhere.
- Nothing decorative without meaning: numbers only for real sequences, dividers only between real groups, labels only when they inform.
- Motion: one orchestrated moment per page at most; interaction feedback is welcome; nothing loops outside product windows.
- Quality floor: works at 360px with no horizontal scroll, visible focus, AA contrast, reduced motion respected, CLS-free (sized media).

## Writing in the UI
- Write for the user, in plain words: name things by what they do for them, not how they're built.
- Active voice, sentence case, no filler. Buttons say what happens ("Book a call"); the same action keeps the same name through the flow.
- Errors say what went wrong and how to fix it; empty states invite the next action.
- Never invent claims, numbers, quotes or client names — use `[Pending: …]` placeholders.
