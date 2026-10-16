import { z } from 'astro/zod';

/**
 * Config-driven forms (claude-design.md §11). A form is data; `ConfigForm` renders it and
 * `validateSubmission` checks it on the server. Adding a field never touches component code.
 */
export const formFieldSchema = z.strictObject({
  name: z.string().regex(/^[a-z][a-zA-Z0-9]*$/, 'camelCase field names'),
  type: z.enum(['text', 'email', 'tel', 'url', 'number', 'select', 'textarea', 'checkbox']),
  label: z.string().min(1),
  required: z.boolean().default(false),
  /** Shown under the label. */
  hint: z.string().optional(),
  placeholder: z.string().optional(),
  /** Options for `select` fields. */
  options: z.array(z.string().min(1)).optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  maxLength: z.number().int().positive().optional(),
  autocomplete: z.string().optional(),
  /** Show (and validate) only when another field has one of these values. */
  showIf: z
    .strictObject({ field: z.string(), equals: z.union([z.string(), z.array(z.string())]) })
    .optional(),
  width: z.enum(['full', 'half']).default('full'),
  /** Pre-fill from this query-string key, e.g. `?industry=construction`. */
  prefillParam: z.string().optional(),
  /** Overrides the default "<label> is required." message. */
  requiredMessage: z.string().optional(),
});

export const formSchema = z
  .strictObject({
    id: z.string().regex(/^[a-z0-9-]+$/),
    submit: z.strictObject({ label: z.string().min(1), endpoint: z.string().startsWith('/') }),
    success: z.strictObject({
      title: z.string().min(1),
      body: z.string().min(1),
      /** Page shown after a no-JavaScript submission. */
      path: z.string().startsWith('/'),
    }),
    /** Shown when the submission can't be delivered (network or server error). */
    errorMessage: z.string().min(1),
    /** Short note under the submit button (e.g. how the data is used). */
    note: z.string().optional(),
    fields: z.array(formFieldSchema).min(1),
    /**
     * Multi-step forms. Step 1 is saved as a partial lead as soon as the visitor continues,
     * so an abandoned form still leaves a contact to follow up. Keep step 1 short (email).
     */
    steps: z
      .array(
        z.strictObject({
          title: z.string().min(1),
          fields: z.array(z.string()).min(1),
          /** Button that moves to the next step (not used on the last step). */
          next: z.string().default('Continue'),
        }),
      )
      .min(2)
      .max(3)
      .optional(),
    /** "Step {current} of {total}" — sites can translate it. */
    progressLabel: z.string().default('Step {current} of {total}'),
    backLabel: z.string().default('Back'),
  })
  .superRefine((form, ctx) => {
    const names = new Set(form.fields.map((f) => f.name));
    if (form.steps) {
      const placed = form.steps.flatMap((step) => step.fields);
      for (const name of placed.filter((n) => !names.has(n))) {
        ctx.addIssue({ code: 'custom', path: ['steps'], message: `unknown field "${name}"` });
      }
      for (const name of names) {
        const count = placed.filter((n) => n === name).length;
        if (count !== 1) {
          ctx.addIssue({
            code: 'custom',
            path: ['steps'],
            message: `field "${name}" must be in exactly one step (found ${count})`,
          });
        }
      }
    }
    form.fields.forEach((field, i) => {
      if (field.type === 'select' && !field.options?.length) {
        ctx.addIssue({
          code: 'custom',
          path: ['fields', i, 'options'],
          message: 'select fields need options',
        });
      }
      if (field.showIf && !names.has(field.showIf.field)) {
        ctx.addIssue({
          code: 'custom',
          path: ['fields', i, 'showIf'],
          message: `unknown field "${field.showIf.field}"`,
        });
      }
    });
  });

export type FormField = z.infer<typeof formFieldSchema>;
export type FormDefinition = z.infer<typeof formSchema>;
