---
name: code-review
description: Review pending changes to this website against its design system and coding standards. Use when asked to review a diff, branch or PR.
---

Review `git diff` (or the named PR) and report findings ranked by severity, each with file:line, the problem and the fix. Check:

1. **Correctness** — broken logic, form validation gaps between client and server, missing error states.
2. **Reusability** — copy or site-specific values inside `packages/ui`; duplicated sections that should be a prop; breaking prop changes without a version bump.
3. **Design system** — raw colours/sizes instead of tokens, more than one accent per element, spacing not from tokens, deviations from `claude-design.md` not called out.
4. **UX & accessibility** — semantic elements, heading order, labels, focus-visible, contrast, 360px layout, reduced motion.
5. **SEO & performance** — per-page meta/canonical/JSON-LD, one H1, sized images, unnecessary client JS.
6. **Reliability** — content schemas, tests for new logic, secrets in code.

Report only real issues; say "no issues" for a category rather than padding it. Don't modify files unless asked.
