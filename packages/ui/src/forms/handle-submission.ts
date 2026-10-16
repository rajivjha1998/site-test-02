import type { FormDefinition } from '../schemas/form';
import { firstStepFields, validateSubmission, type FieldErrors, type FormValues } from './validate';

/** Hidden field bots fill in and people never see. */
export const HONEYPOT_FIELD = 'website_url';
export const TURNSTILE_FIELD = 'cf-turnstile-response';
/** `partial` = step 1 of a multi-step form; anything else = the complete submission. */
export const STAGE_FIELD = '_stage';
/** Links a partial save and its complete submission (generated in the browser). */
export const SUBMISSION_ID_FIELD = '_sid';
const SUBMISSION_ID = /^[a-zA-Z0-9-]{8,64}$/;
const TURNSTILE_VERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export interface SubmissionEnv {
  /** When set, every submission must pass Cloudflare Turnstile. */
  TURNSTILE_SECRET?: string;
  /** Where valid submissions are POSTed as JSON (CRM, Zapier/Make, email relay…). */
  FORM_WEBHOOK_URL?: string;
}

interface Options {
  form: FormDefinition;
  request: Request;
  env: SubmissionEnv;
  fetchImpl?: typeof fetch;
  /**
   * The website's URL including any base path (e.g. https://x.github.io/site). Needed when
   * the handler runs on a different origin from the site (a standalone forms worker), so
   * no-JS redirects go back to the website. Defaults to the request's own origin.
   */
  siteUrl?: string;
}

type Outcome = { ok: true } | { ok: false; status: number; errors: FieldErrors };

async function readValues(request: Request): Promise<FormValues> {
  const values: FormValues = {};
  const type = request.headers.get('content-type') ?? '';
  if (type.includes('application/json')) {
    const body = (await request.json()) as Record<string, unknown>;
    for (const [k, v] of Object.entries(body)) if (typeof v === 'string') values[k] = v;
  } else {
    const body = await request.formData();
    for (const [k, v] of body.entries()) if (typeof v === 'string') values[k] = v;
  }
  return values;
}

async function process({ form, request, env, fetchImpl = fetch }: Options): Promise<Outcome> {
  const failure = (status: number): Outcome => ({
    ok: false,
    status,
    errors: { _form: form.errorMessage },
  });

  let values: FormValues;
  try {
    values = await readValues(request);
  } catch {
    return failure(400);
  }

  // Bots get a quiet success so they don't retry.
  if (values[HONEYPOT_FIELD]) return { ok: true };

  // Step 1 of a multi-step form: save just those fields so an abandoned form is still a lead.
  const partial = values[STAGE_FIELD] === 'partial' && firstStepFields(form).length > 0;
  const sid = values[SUBMISSION_ID_FIELD];
  const submissionId = sid && SUBMISSION_ID.test(sid) ? sid : undefined;

  // Turnstile tokens are single-use, so only the complete submission is checked.
  if (env.TURNSTILE_SECRET && !partial) {
    const verify = await fetchImpl(TURNSTILE_VERIFY, {
      method: 'POST',
      body: new URLSearchParams({
        secret: env.TURNSTILE_SECRET,
        response: values[TURNSTILE_FIELD] ?? '',
        remoteip: request.headers.get('CF-Connecting-IP') ?? '',
      }),
    }).catch(() => undefined);
    const passed = verify?.ok && ((await verify.json()) as { success?: boolean }).success === true;
    if (!passed) return failure(400);
  }

  const result = validateSubmission(form, values, partial ? firstStepFields(form) : undefined);
  if (!result.ok) return { ok: false, status: 422, errors: result.errors };

  if (!env.FORM_WEBHOOK_URL) return failure(503);
  const delivered = await fetchImpl(env.FORM_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      form: form.id,
      stage: partial ? 'partial' : 'complete',
      ...(submissionId && { submissionId }),
      submittedAt: new Date().toISOString(),
      data: result.data,
    }),
  }).catch(() => undefined);
  if (!delivered?.ok) return failure(502);

  return { ok: true };
}

/**
 * Handles a form POST. JavaScript submissions (Accept: application/json) get JSON
 * `{ ok, errors? }`; plain HTML submissions get a 303 to the success page or back to the form.
 */
export async function handleSubmission(options: Options): Promise<Response> {
  const outcome = await process(options);
  const wantsJson = (options.request.headers.get('accept') ?? '').includes('application/json');

  if (wantsJson) {
    return Response.json(outcome.ok ? { ok: true } : { ok: false, errors: outcome.errors }, {
      status: outcome.ok ? 200 : outcome.status,
    });
  }

  const site = (options.siteUrl ?? new URL(options.request.url).origin).replace(/\/$/, '');
  const siteOrigin = new URL(site).origin;
  const referer = options.request.headers.get('referer');
  const back = new URL(
    referer && new URL(referer, site).origin === siteOrigin ? referer : `${site}/`,
  );
  back.searchParams.set('form', 'error');
  const location = outcome.ok ? `${site}${options.form.success.path}` : back.href;
  return new Response(null, { status: 303, headers: { Location: location } });
}
