// Every form the site renders (`forms` in site.json), parsed with the same schema as the
// build. Shared by the Cloudflare Pages Function and the standalone forms worker so they
// always agree.
import { formSchema, type FormDefinition } from '@blackboxops/ui/schemas/form.ts';
import site from '../../../../site.json';

export const forms: Record<string, FormDefinition> = Object.fromEntries(
  Object.values(site.forms as Record<string, unknown>).map((raw) => {
    const form = formSchema.parse(raw);
    return [form.id, form];
  }),
);
