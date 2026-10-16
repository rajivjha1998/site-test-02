---
name: fix-issue
description: Fix a reported bug or GitHub issue in this website — reproduce, fix at the source component, verify, and report. Use when given an issue number, bug report or broken behaviour.
---

1. Read the issue (`gh issue view <n>` if a number is given) and restate the expected vs actual behaviour.
2. Reproduce it: run `pnpm dev`, open the affected route at the reported viewport, and note the exact steps.
3. Find the source. If the bug is in a shared section, fix it in `packages/ui` (it affects every page and repo using it), not with a page-level override.
4. Make the smallest fix that follows `.claude/rules/`; add or update a test that would have caught it.
5. Verify: the reproduction no longer fails, `/dev/sections` still renders every variant, `pnpm check` passes.
6. Report the cause, the fix, the files changed and anything you couldn't verify. Do not commit, branch or push — ask the user first.
