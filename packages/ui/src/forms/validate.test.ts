import { describe, expect, it } from 'vitest';
import { formSchema } from '../schemas/form';
import { isFieldActive, validateSubmission } from './validate';

const form = formSchema.parse({
  id: 'demo',
  submit: { label: 'Book a demo', endpoint: '/api/forms/demo/' },
  success: { title: 'Thanks', body: 'We will be in touch.', path: '/demo/thanks/' },
  errorMessage: 'Something went wrong.',
  fields: [
    { name: 'email', type: 'email', label: 'Work email', required: true },
    {
      name: 'size',
      type: 'select',
      label: 'Company size',
      options: ['1-50', '51-500'],
      required: true,
    },
    { name: 'seats', type: 'number', label: 'Seats', min: 1, max: 1000 },
    {
      name: 'other',
      type: 'text',
      label: 'Other use case',
      required: true,
      showIf: { field: 'size', equals: '51-500' },
    },
    { name: 'consent', type: 'checkbox', label: 'I agree', required: true },
  ],
});

describe('validateSubmission', () => {
  it('accepts a valid submission and drops empty optional fields', () => {
    const result = validateSubmission(form, {
      email: 'a@b.co',
      size: '1-50',
      seats: '',
      consent: 'on',
    });
    expect(result).toEqual({ ok: true, data: { email: 'a@b.co', size: '1-50', consent: true } });
  });

  it('reports required, format and option errors per field', () => {
    const result = validateSubmission(form, { email: 'nope', size: 'huge' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(Object.keys(result.errors).sort()).toEqual(['consent', 'email', 'size']);
      expect(result.errors.email).toBe('Enter a valid email address.');
    }
  });

  it('validates numbers against min and max', () => {
    const result = validateSubmission(form, {
      email: 'a@b.co',
      size: '1-50',
      seats: '5000',
      consent: 'on',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.seats).toContain('at most 1000');
  });

  it('only requires conditional fields when their condition is met', () => {
    const base = { email: 'a@b.co', consent: 'on' };
    expect(validateSubmission(form, { ...base, size: '1-50' }).ok).toBe(true);
    expect(validateSubmission(form, { ...base, size: '51-500' }).ok).toBe(false);
  });

  it('ignores values for fields that are not in the form', () => {
    const result = validateSubmission(form, {
      email: 'a@b.co',
      size: '1-50',
      consent: 'on',
      injected: 'x',
    });
    expect(result.ok && 'injected' in result.data).toBe(false);
  });
});

describe('isFieldActive', () => {
  it('supports a list of matching values', () => {
    const field = { ...form.fields[3]!, showIf: { field: 'size', equals: ['1-50', '51-500'] } };
    expect(isFieldActive(field, { size: '1-50' })).toBe(true);
    expect(isFieldActive(field, { size: '' })).toBe(false);
  });
});

describe('formSchema', () => {
  it('rejects select fields without options and unknown showIf targets', () => {
    const bad = formSchema.safeParse({
      ...form,
      fields: [
        { name: 'a', type: 'select', label: 'A' },
        { name: 'b', type: 'text', label: 'B', showIf: { field: 'missing', equals: 'x' } },
      ],
    });
    expect(bad.success).toBe(false);
    if (!bad.success) expect(bad.error.issues).toHaveLength(2);
  });
});

describe('form steps', () => {
  const base = {
    id: 'x',
    submit: { label: 'Send', endpoint: '/api/forms/x' },
    success: { title: 'T', body: 'B', path: '/x/thanks/' },
    errorMessage: 'E',
    fields: [
      { name: 'email', type: 'email', label: 'Email', required: true },
      { name: 'company', type: 'text', label: 'Company' },
    ],
  };

  it('accepts steps that place every field exactly once', () => {
    const ok = formSchema.safeParse({
      ...base,
      steps: [
        { title: 'A', fields: ['email'] },
        { title: 'B', fields: ['company'] },
      ],
    });
    expect(ok.success).toBe(true);
  });

  it('rejects missing, duplicated or unknown step fields', () => {
    const bad = formSchema.safeParse({
      ...base,
      steps: [
        { title: 'A', fields: ['email', 'phone'] },
        { title: 'B', fields: ['email'] },
      ],
    });
    expect(bad.success).toBe(false);
    if (!bad.success)
      expect(bad.error.issues.map((i) => i.message).join(' ')).toMatch(/phone.*|.*company/);
  });
});
