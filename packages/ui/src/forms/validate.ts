import { z } from 'astro/zod';
import type { FormDefinition, FormField } from '../schemas/form';

export type FormValues = Record<string, string>;
export type FieldErrors = Record<string, string>;

export type ValidationResult =
  | { ok: true; data: Record<string, string | number | boolean> }
  | { ok: false; errors: FieldErrors };

const DEFAULT_MAX = { textarea: 2000, other: 200 } as const;

/** Is the field shown, given the current values? Hidden fields are neither required nor sent. */
export function isFieldActive(field: FormField, values: FormValues): boolean {
  if (!field.showIf) return true;
  const expected = ([] as string[]).concat(field.showIf.equals);
  return expected.includes(values[field.showIf.field] ?? '');
}

/**
 * Every validation message for a field, in one place. The server uses these through
 * `validateSubmission`; ConfigForm renders them as data attributes for the browser.
 */
export function fieldMessages(field: FormField) {
  const maxLength =
    field.maxLength ?? (field.type === 'textarea' ? DEFAULT_MAX.textarea : DEFAULT_MAX.other);
  return {
    maxLength,
    required: field.requiredMessage ?? `${field.label} is required.`,
    tooLong: `${field.label} must be ${maxLength} characters or fewer.`,
    email: 'Enter a valid email address.',
    url: 'Enter a full web address, starting with https://.',
    number: `${field.label} must be a number.`,
    min: `${field.label} must be at least ${field.min}.`,
    max: `${field.label} must be at most ${field.max}.`,
    option: 'Choose one of the listed options.',
  };
}

function fieldSchema(field: FormField): z.ZodType {
  const m = fieldMessages(field);

  if (field.type === 'checkbox') {
    const checked = z.preprocess((v) => v === 'on' || v === 'true', z.boolean());
    return field.required ? checked.refine((v) => v, m.required) : checked;
  }

  if (field.type === 'number') {
    let num = z.number({ message: m.number });
    if (field.min !== undefined) num = num.min(field.min, m.min);
    if (field.max !== undefined) num = num.max(field.max, m.max);
    return field.required
      ? z.string().trim().min(1, m.required).transform(Number).pipe(num)
      : z
          .string()
          .trim()
          .transform((v) => (v === '' ? undefined : Number(v)))
          .pipe(num.optional());
  }

  let text = z.string().trim().max(m.maxLength, m.tooLong);
  if (field.required) text = text.min(1, m.required);

  const format =
    field.type === 'email'
      ? { schema: z.email(), message: m.email }
      : field.type === 'url'
        ? { schema: z.url(), message: m.url }
        : undefined;
  const withFormat = format
    ? text.refine((v) => v === '' || format.schema.safeParse(v).success, format.message)
    : text;

  if (field.type === 'select' && field.options) {
    const options = field.options;
    return withFormat.refine((v) => v === '' || options.includes(v), m.option);
  }
  return withFormat;
}

/**
 * Validates raw submitted values against a form definition. Used by the Cloudflare Pages
 * Function (authoritative) and unit tests; the browser mirrors these rules with native
 * constraint validation generated from the same definition.
 */
export function validateSubmission(
  form: FormDefinition,
  values: FormValues,
  /** Validate only these fields (a partial, step-1 save). */
  only?: string[],
): ValidationResult {
  const errors: FieldErrors = {};
  const data: Record<string, string | number | boolean> = {};

  for (const field of form.fields) {
    if (only && !only.includes(field.name)) continue;
    if (!isFieldActive(field, values)) continue;
    const result = fieldSchema(field).safeParse(values[field.name] ?? '');
    if (result.success) {
      if (result.data !== undefined && result.data !== '')
        data[field.name] = result.data as string | number | boolean;
    } else {
      errors[field.name] = result.error.issues[0]?.message ?? `Check ${field.label}.`;
    }
  }

  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true, data };
}

/** Field names in a form's first step: what a partial save collects. */
export const firstStepFields = (form: FormDefinition): string[] => form.steps?.[0]?.fields ?? [];
