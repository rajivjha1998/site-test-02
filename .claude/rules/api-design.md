---
paths:
  - "apps/website/functions/**"
  - "packages/ui/src/forms/**"
  - "apps/forms-worker/**"
  - "site.json"
---

# Forms and Pages Functions

- A form is an entry in `site.json` `forms` (key = form id) (shape in `claude-design.md` §11). Adding a field is a schema change only — never edit `ConfigForm` markup for one form.
- One shared Zod builder turns a form schema into a validator used both in the browser and in `functions/api/forms/[id].ts`. Server validation is authoritative.
- Endpoint: `functions/api/forms/[id].ts` → `POST /api/forms/<id>` (no trailing slash). Logic lives in `packages/ui/src/forms/handle-submission.ts` (unit-tested): honeypot, Turnstile when `TURNSTILE_SECRET` is set, validation, delivery to `FORM_WEBHOOK_URL`.
- Responses: JSON `{ ok: true }` / `{ ok: false, errors: { field|_form: message } }` (400/422/502/503) for JS; 303 redirects to the success page or back with `?form=error` without JS.
- Validation messages come from `fieldMessages()` so browser and server say the same thing.
- Secrets via Cloudflare env bindings (`context.env`), never in code or `wrangler.toml`. Don't log personal data.
- The form works as a plain HTML POST without JS; JS adds inline validation, conditional fields (`showIf`) and multi-step.
- Partial saves: multi-step forms POST step 1 with `_stage=partial` and a client-made `_sid` (8–64 chars, letters, digits, dashes). Partial saves validate step 1 only and skip Turnstile; the complete submission sends the same `_sid` and is fully checked.
- Webhook payload: `{ form, stage: 'partial' | 'complete', submissionId, submittedAt, data }`. The receiver merges a partial and a complete lead by `submissionId`; a partial with no complete is an abandoned form to follow up.
