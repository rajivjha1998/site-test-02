// Standalone forms endpoint for statically hosted builds: POST /api/forms/:id.
// Same validation, spam checks and delivery as the Cloudflare Pages Function.
import { handleSubmission, type SubmissionEnv } from '@blackboxops/ui/forms/handle-submission.ts';
import { forms } from '../../website/src/lib/forms-registry';
import { corsHeaders } from './cors';

interface Env extends SubmissionEnv {
  SITE_URL: string;
  ALLOWED_ORIGINS: string;
}

const withHeaders = (response: Response, headers: Record<string, string>) => {
  const res = new Response(response.body, response);
  for (const [k, v] of Object.entries(headers)) res.headers.set(k, v);
  return res;
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const cors = corsHeaders(request.headers.get('Origin'), env.ALLOWED_ORIGINS);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    const match = new URL(request.url).pathname.match(/^\/api\/forms\/([a-z0-9-]+)\/?$/);
    const form = match ? forms[match[1]!] : undefined;
    if (request.method !== 'POST' || !form) {
      return withHeaders(
        Response.json({ ok: false, errors: { _form: 'Not found.' } }, { status: 404 }),
        cors,
      );
    }
    return withHeaders(await handleSubmission({ form, request, env, siteUrl: env.SITE_URL }), cors);
  },
};
