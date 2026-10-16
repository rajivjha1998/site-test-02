// Cloudflare Pages Function: POST /api/forms/:id (used when the site is hosted on Cloudflare Pages).
// Validation, spam checks and delivery live in @blackboxops/ui (unit-tested); this file only wires them up.
import { handleSubmission, type SubmissionEnv } from '@blackboxops/ui/forms/handle-submission.ts';
import { forms } from '../../../src/lib/forms-registry';

interface Context {
  request: Request;
  params: { id?: string | string[] };
  env: SubmissionEnv;
}

export const onRequestPost = async ({ request, params, env }: Context): Promise<Response> => {
  const form = typeof params.id === 'string' ? forms[params.id] : undefined;
  if (!form)
    return Response.json({ ok: false, errors: { _form: 'Unknown form.' } }, { status: 404 });
  return handleSubmission({ form, request, env });
};
