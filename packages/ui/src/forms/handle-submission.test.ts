import { describe, expect, it, vi } from 'vitest';
import { formSchema } from '../schemas/form';
import { handleSubmission, HONEYPOT_FIELD } from './handle-submission';
import { formSchema as stepsSchema } from '../schemas/form';

const form = formSchema.parse({
  id: 'contact',
  submit: { label: 'Send message', endpoint: '/api/forms/contact/' },
  success: { title: 'Sent', body: 'Thanks.', path: '/contact/thanks/' },
  errorMessage: 'We could not send your message. Email us instead.',
  fields: [{ name: 'email', type: 'email', label: 'Email', required: true }],
});

const post = (body: Record<string, string>, json = true) =>
  new Request('https://example.com/api/forms/contact/', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(json && { accept: 'application/json' }),
      referer: 'https://example.com/contact/',
    },
    body: JSON.stringify(body),
  });

const ok = () => Promise.resolve(new Response('{"success":true}', { status: 200 }));

describe('handleSubmission', () => {
  it('delivers a valid submission to the webhook', async () => {
    const fetchImpl = vi.fn<typeof fetch>(ok);
    const res = await handleSubmission({
      form,
      request: post({ email: 'a@b.co' }),
      env: { FORM_WEBHOOK_URL: 'https://hooks.example.com/x' },
      fetchImpl,
    });
    expect(res.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledOnce();
    const sent = JSON.parse(fetchImpl.mock.calls[0]![1]!.body as string);
    expect(sent).toMatchObject({ form: 'contact', data: { email: 'a@b.co' } });
  });

  it('returns field errors with 422', async () => {
    const res = await handleSubmission({
      form,
      request: post({ email: 'x' }),
      env: { FORM_WEBHOOK_URL: 'https://h' },
    });
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({
      ok: false,
      errors: { email: 'Enter a valid email address.' },
    });
  });

  it('refuses with 503 when no delivery destination is configured', async () => {
    const res = await handleSubmission({ form, request: post({ email: 'a@b.co' }), env: {} });
    expect(res.status).toBe(503);
  });

  it('quietly accepts honeypot submissions without delivering', async () => {
    const fetchImpl = vi.fn(ok);
    const res = await handleSubmission({
      form,
      request: post({ email: 'a@b.co', [HONEYPOT_FIELD]: 'spam' }),
      env: { FORM_WEBHOOK_URL: 'https://h' },
      fetchImpl,
    });
    expect(res.status).toBe(200);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('rejects when Turnstile verification fails', async () => {
    const fetchImpl = vi.fn(() => Promise.resolve(new Response('{"success":false}')));
    const res = await handleSubmission({
      form,
      request: post({ email: 'a@b.co' }),
      env: { TURNSTILE_SECRET: 's', FORM_WEBHOOK_URL: 'https://h' },
      fetchImpl,
    });
    expect(res.status).toBe(400);
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it('redirects plain HTML submissions to the success page', async () => {
    const res = await handleSubmission({
      form,
      request: post({ email: 'a@b.co' }, false),
      env: { FORM_WEBHOOK_URL: 'https://h' },
      fetchImpl: vi.fn(ok),
    });
    expect(res.status).toBe(303);
    expect(res.headers.get('location')).toBe('https://example.com/contact/thanks/');
  });

  it('redirects to the website when the handler runs on another origin', async () => {
    const res = await handleSubmission({
      form,
      request: post({ email: 'a@b.co' }, false),
      env: { FORM_WEBHOOK_URL: 'https://h' },
      fetchImpl: vi.fn<typeof fetch>(ok),
      siteUrl: 'https://x.github.io/site',
    });
    expect(res.headers.get('location')).toBe('https://x.github.io/site/contact/thanks/');
  });

  it('ignores a referer from another site when redirecting back', async () => {
    const request = new Request('https://forms.example.com/api/forms/contact', {
      method: 'POST',
      headers: { 'content-type': 'application/json', referer: 'https://evil.example/' },
      body: JSON.stringify({ email: 'x' }),
    });
    const res = await handleSubmission({
      form,
      request,
      env: {},
      siteUrl: 'https://x.github.io/site',
    });
    expect(res.headers.get('location')).toBe('https://x.github.io/site/?form=error');
  });

  it('redirects failed plain submissions back to the same-origin form', async () => {
    const res = await handleSubmission({ form, request: post({ email: 'x' }, false), env: {} });
    expect(res.headers.get('location')).toBe('https://example.com/contact/?form=error');
  });

  describe('multi-step forms', () => {
    const steps = stepsSchema.parse({
      ...form,
      id: 'demo',
      fields: [
        { name: 'email', type: 'email', label: 'Work email', required: true },
        { name: 'company', type: 'text', label: 'Company', required: true },
      ],
      steps: [
        { title: 'Your email', fields: ['email'] },
        { title: 'A few details', fields: ['company'] },
      ],
    });

    it('saves step 1 as a partial lead with its submission id', async () => {
      const fetchImpl = vi.fn<typeof fetch>(ok);
      const res = await handleSubmission({
        form: steps,
        request: post({ email: 'a@b.co', _stage: 'partial', _sid: 'abc12345-xyz' }),
        env: { FORM_WEBHOOK_URL: 'https://h', TURNSTILE_SECRET: 's' },
        fetchImpl,
      });
      expect(res.status).toBe(200);
      // No Turnstile check on the partial save; only the webhook was called.
      expect(fetchImpl).toHaveBeenCalledOnce();
      const sent = JSON.parse(fetchImpl.mock.calls[0]![1]!.body as string);
      expect(sent).toMatchObject({
        form: 'demo',
        stage: 'partial',
        submissionId: 'abc12345-xyz',
        data: { email: 'a@b.co' },
      });
      expect(sent.data).not.toHaveProperty('company');
    });

    it('still validates step 1 on a partial save', async () => {
      const res = await handleSubmission({
        form: steps,
        request: post({ email: 'nope', _stage: 'partial' }),
        env: { FORM_WEBHOOK_URL: 'https://h' },
      });
      expect(res.status).toBe(422);
    });

    it('requires every field on the complete submission', async () => {
      const res = await handleSubmission({
        form: steps,
        request: post({ email: 'a@b.co', _sid: 'abc12345-xyz' }),
        env: { FORM_WEBHOOK_URL: 'https://h' },
      });
      expect(res.status).toBe(422);
      expect(await res.json()).toMatchObject({ errors: { company: 'Company is required.' } });
    });

    it('drops a malformed submission id', async () => {
      const fetchImpl = vi.fn<typeof fetch>(ok);
      await handleSubmission({
        form: steps,
        request: post({ email: 'a@b.co', company: 'X', _sid: '<script>' }),
        env: { FORM_WEBHOOK_URL: 'https://h' },
        fetchImpl,
      });
      const sent = JSON.parse(fetchImpl.mock.calls[0]![1]!.body as string);
      expect(sent).not.toHaveProperty('submissionId');
      expect(sent.stage).toBe('complete');
    });
  });
});
