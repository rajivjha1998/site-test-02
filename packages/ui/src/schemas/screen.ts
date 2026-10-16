import { z } from 'astro/zod';
import { iconSchema } from './common';

/**
 * Product-window screens (claude-design.md §8). Each is illustrative data rendered by a
 * screen component; sites keep them in `src/content/screens/*.yaml` and sections reference
 * them by id, so one dataset can appear on many pages.
 */

const status = z.enum(['ok', 'warn', 'error', 'neutral', 'accent']);
/** Text that may be written as a bare number in YAML (`3`, `120`). */
const text = z.union([z.string(), z.number()]).transform(String);

const treeNode: z.ZodType<TreeNode> = z.lazy(() =>
  z.strictObject({
    label: z.string(),
    meta: z.string().optional(),
    status: status.optional(),
    children: z.array(treeNode).optional(),
  }),
);
export interface TreeNode {
  label: string;
  meta?: string;
  status?: z.infer<typeof status>;
  children?: TreeNode[];
}

const base = {
  /** Address shown in the window title bar. */
  url: z.string().min(1),
  /** Optional in-app navigation row; `active` is the selected item's index. */
  nav: z
    .strictObject({ items: z.array(z.string()).min(1), active: z.number().int().min(0) })
    .optional(),
};

const screenKinds = z.discriminatedUnion('kind', [
  z.strictObject({
    ...base,
    kind: z.literal('table'),
    toolbar: z
      .strictObject({ filters: z.array(z.string()), action: z.string().optional() })
      .optional(),
    columns: z
      .array(
        z.strictObject({ label: z.string(), align: z.enum(['start', 'end']).default('start') }),
      )
      .min(1),
    rows: z
      .array(
        z.strictObject({
          cells: z.array(text).min(1),
          status: status.optional(),
          highlight: z.boolean().default(false),
        }),
      )
      .min(1),
  }),
  z.strictObject({
    ...base,
    kind: z.literal('tree'),
    groups: z
      .array(
        z.strictObject({
          label: z.string(),
          count: z.number().int().optional(),
          nodes: z.array(treeNode),
        }),
      )
      .min(1),
  }),
  z.strictObject({
    ...base,
    kind: z.literal('chat'),
    context: z.string().optional(),
    messages: z
      .array(
        z.strictObject({
          role: z.enum(['user', 'assistant']),
          text: z.string(),
          card: z
            .strictObject({ title: z.string(), rows: z.array(z.tuple([z.string(), z.string()])) })
            .optional(),
        }),
      )
      .min(1),
    composer: z.string(),
  }),
  z.strictObject({
    ...base,
    kind: z.literal('wizard'),
    steps: z.array(z.string()).min(2),
    active: z.number().int().min(0),
    title: z.string(),
    fields: z.array(
      z.strictObject({
        label: z.string(),
        value: z.string(),
        selected: z.boolean().default(false),
      }),
    ),
    primary: z.string(),
  }),
  z.strictObject({
    ...base,
    kind: z.literal('kpis'),
    tiles: z
      .array(z.strictObject({ label: z.string(), value: text, delta: z.string().optional() }))
      .min(1),
    chart: z
      .strictObject({ title: z.string(), bars: z.array(z.number().min(0).max(100)).min(2) })
      .optional(),
  }),
  z.strictObject({
    ...base,
    kind: z.literal('catalog'),
    items: z
      .array(
        z.strictObject({
          name: z.string(),
          meta: z.string(),
          status: z.string().optional(),
          active: z.boolean().default(false),
        }),
      )
      .min(1),
  }),
  z.strictObject({
    ...base,
    kind: z.literal('form'),
    title: z.string(),
    fields: z
      .array(z.strictObject({ label: z.string(), value: z.string(), hint: z.string().optional() }))
      .min(1),
    primary: z.string(),
  }),
  z.strictObject({
    ...base,
    kind: z.literal('flow'),
    stages: z
      .array(
        z.strictObject({
          title: z.string(),
          items: z.array(z.string()).min(1),
          highlight: z.boolean().default(false),
        }),
      )
      .min(2),
  }),
  z.strictObject({
    ...base,
    kind: z.literal('agents'),
    /** What started the run, e.g. "Inbound email · Facilities inbox". */
    trigger: z.string(),
    steps: z
      .array(
        z.strictObject({
          agent: z.string(),
          task: z.string(),
          /** Who does the work: a person (ui), an agent, or both. */
          mode: z.enum(['ui', 'agent', 'both']),
          status: z.enum(['done', 'running', 'waiting', 'queued']),
        }),
      )
      .min(2)
      .max(6),
    modeLabels: z
      .strictObject({ ui: z.string(), agent: z.string(), both: z.string() })
      .default({ ui: 'Person', agent: 'Agent', both: 'Agent + review' }),
    statusLabels: z
      .strictObject({
        done: z.string(),
        running: z.string(),
        waiting: z.string(),
        queued: z.string(),
      })
      .default({ done: 'Done', running: 'Running', waiting: 'Needs approval', queued: 'Queued' }),
  }),
  z.strictObject({
    ...base,
    kind: z.literal('workflow'),
    /** Workflow name shown in the header, e.g. "Inbox to request". */
    name: z.string(),
    /** What starts it: an event or a schedule, e.g. "Every day · 02:00". */
    trigger: z.string(),
    /** Nodes on the canvas. `col` / `row` are grid positions (rows may be halves, e.g. 0.5). */
    nodes: z
      .array(
        z.strictObject({
          id: z.string().regex(/^[a-z0-9-]+$/),
          label: z.string().max(22),
          /** Shown in the status bar while this node runs. */
          detail: z.string(),
          icon: iconSchema,
          /** Visual role: trigger, agent (AI), person (needs a human), logic (a condition), action. */
          role: z.enum(['trigger', 'agent', 'person', 'logic', 'action']),
          col: z.number().min(0),
          row: z.number().min(0),
        }),
      )
      .min(3)
      .max(9),
    edges: z
      .array(
        z.strictObject({ from: z.string(), to: z.string(), label: z.string().max(10).optional() }),
      )
      .min(2),
    /** Node ids in the order this run executes them; nodes not listed are branches not taken. */
    run: z.array(z.string()).min(2),
    /** Status-bar prefix while running. */
    runningLabel: z.string().default('Running'),
    /** The outcome shown when the run completes. */
    result: z.string(),
  }),
]);

/** Workflow canvases must reference real nodes; enforced by `screenSchema`. */
export function workflowProblems(screen: z.infer<typeof screenKinds>): string[] {
  if (screen.kind !== 'workflow') return [];
  const ids = new Set(screen.nodes.map((n) => n.id));
  const bad = [...screen.edges.flatMap((e) => [e.from, e.to]), ...screen.run].filter(
    (id) => !ids.has(id),
  );
  return [...new Set(bad)].map((id) => `unknown node "${id}"`);
}

export const screenSchema = screenKinds.superRefine((screen, ctx) => {
  for (const message of workflowProblems(screen)) ctx.addIssue({ code: 'custom', message });
});

export type Screen = z.infer<typeof screenSchema>;

export type ScreenOf<K extends Screen['kind']> = Extract<Screen, { kind: K }>;
