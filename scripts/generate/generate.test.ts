import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
// @ts-expect-error plain .mjs without type declarations
import { normaliseBrief } from './brief.mjs';
// @ts-expect-error plain .mjs without type declarations
import { sanitizeSvg } from './svg.mjs';
// @ts-expect-error plain .mjs without type declarations
import { parseModelOutput } from './parse.mjs';
// @ts-expect-error plain .mjs without type declarations
import { validateSite } from './validate.mjs';
// @ts-expect-error plain .mjs without type declarations
import { generateSite, GenerationError } from './generate.mjs';
// @ts-expect-error plain .mjs without type declarations
import { buildSystemPrompt, buildUserPrompt } from './prompt.mjs';

const starter = JSON.parse(readFileSync(new URL('../../site.json', import.meta.url), 'utf8'));
const GOOD_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" fill="#2563eb"/></svg>';

const fakeClient = (answers: string[]) => {
  const calls: unknown[] = [];
  return {
    calls,
    beta: {
      messages: {
        stream: (request: unknown) => {
          calls.push(request);
          const text = answers[Math.min(calls.length - 1, answers.length - 1)];
          return {
            finalMessage: async () => ({
              stop_reason: 'end_turn',
              content: [{ type: 'text', text }],
              usage: { input_tokens: 1000, output_tokens: 2000 },
            }),
          };
        },
      },
    },
  };
};

const brief = normaliseBrief({
  business: 'Acme',
  summary: 'We make anvils for everyone.',
  offerings: 'Anvils and hammers',
}).brief;

describe('brief', () => {
  it('fills defaults and accepts page text', () => {
    const r = normaliseBrief({
      business: 'Acme',
      summary: 'We make anvils.',
      offerings: 'Anvils',
      pages: 'home, about',
      tone: '',
    });
    expect(r.ok).toBe(true);
    expect(r.brief.pages).toEqual(['home', 'about']);
    expect(r.brief.tone).toBe('friendly');
  });
  it('rejects unknown fields and bad colours in plain words', () => {
    const r = normaliseBrief({
      business: 'A',
      summary: 'x',
      offerings: 'y',
      colour: 'red',
      color_primary: 'nope',
    });
    expect(r.ok).toBe(false);
    expect(r.problems.join(' ')).toMatch(/Unknown field/);
  });
  it('refuses oversized and non-object input', () => {
    expect(normaliseBrief('[1]').ok).toBe(false);
    expect(normaliseBrief('{oops').ok).toBe(false);
    expect(
      normaliseBrief({ business: 'Acme', summary: 'We make anvils.', offerings: 'x'.repeat(13000) })
        .ok,
    ).toBe(false);
  });
  it('every sample brief is valid', () => {
    const dir = new URL('./samples/', import.meta.url);
    for (const file of readdirSync(dir)) {
      const r = normaliseBrief(readFileSync(new URL(file, dir), 'utf8'));
      expect(r.problems ?? []).toEqual([]);
    }
  });
});

describe('sanitizeSvg', () => {
  it('accepts a simple shape', () => expect(sanitizeSvg(GOOD_SVG).problems).toEqual([]));
  it.each([
    [
      'script',
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><script>alert(1)</script></svg>',
    ],
    [
      'event handler',
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><rect onload="x()" width="1" height="1"/></svg>',
    ],
    [
      'outside link',
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><use href="https://evil.example/x.svg#a"/></svg>',
    ],
    [
      'foreignObject',
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><foreignObject/></svg>',
    ],
    [
      'external url()',
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><rect fill="url(https://x.example/a)"/></svg>',
    ],
    ['doctype', '<!DOCTYPE svg><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"/>'],
    ['no viewBox', '<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>'],
    ['not svg', '<div>hi</div>'],
  ])('rejects %s', (_name, svg) =>
    expect(sanitizeSvg(svg as string).problems.length).toBeGreaterThan(0),
  );
});

describe('parseModelOutput', () => {
  it('reads fenced JSON and refusals', () => {
    expect(parseModelOutput('Here:\n```json\n{"site":{"a":1},"assets":[]}\n```').site).toEqual({
      a: 1,
    });
    expect(parseModelOutput('{"refused":"no"}').refused).toBe('no');
  });
  it('rejects junk', () => {
    expect(() => parseModelOutput('nothing')).toThrow();
    expect(() => parseModelOutput('{"site":1}')).toThrow();
  });
});

describe('validateSite', () => {
  it('accepts the starter site', () =>
    expect(validateSite(starter, ['assets/placeholder.svg'])).toEqual([]));
  it('finds dead links, missing images, forms and em dashes', () => {
    const bad = structuredClone(starter);
    bad.pages['/'].sections[0].ctas[0].href = '/nowhere/';
    bad.pages['/'].sections[0].image = { src: 'assets/ghost.svg', alt: 'x' };
    bad.brand.tagline = 'Fast — simple';
    const text = validateSite(bad, ['assets/placeholder.svg']).join('\n');
    expect(text).toMatch(/nowhere/);
    expect(text).toMatch(/ghost\.svg/);
    expect(text).toMatch(/em dash/);
  });
});

describe('prompts', () => {
  it('lists the sections but not forms, and treats the brief as data', () => {
    const system = buildSystemPrompt();
    expect(system).toContain('### featureGrid');
    expect(system).not.toContain('### form:');
    expect(buildUserPrompt(brief)).toContain('<brief>');
  });
});

describe('generateSite', () => {
  const good = JSON.stringify({
    site: starter,
    assets: [{ path: 'assets/logo.svg', svg: GOOD_SVG }],
  });

  it('returns a checked site and the pictures', async () => {
    const client = fakeClient([good]);
    const r = await generateSite({ brief, client });
    expect(r.attempts).toBe(1);
    expect(r.assets[0].path).toBe('assets/logo.svg');
    expect(r.cost).toBeGreaterThan(0);
    const req = client.calls[0] as { fallbacks: string; system: { cache_control: unknown }[] };
    expect(req.fallbacks).toBe('default');
    expect(req.system[0].cache_control).toBeTruthy();
  });

  it('sends problems back and accepts the fix', async () => {
    const broken = structuredClone(starter);
    broken.pages['/'].sections[0].ctas[0].href = '/nowhere/';
    const client = fakeClient([JSON.stringify({ site: broken, assets: [] }), good]);
    const r = await generateSite({ brief, client });
    expect(r.attempts).toBe(2);
    expect(JSON.stringify(client.calls[1])).toContain('nowhere');
  });

  it('gives up after three bad answers with the problems listed', async () => {
    const client = fakeClient(['not json']);
    await expect(generateSite({ brief, client })).rejects.toBeInstanceOf(GenerationError);
    expect(client.calls).toHaveLength(3);
  });

  it('stops on a refusal without retrying', async () => {
    const client = fakeClient(['{"refused":"I will not."}']);
    await expect(generateSite({ brief, client })).rejects.toThrow(/declined/);
    expect(client.calls).toHaveLength(1);
  });

  it('rejects unsafe pictures', async () => {
    const evil = JSON.stringify({
      site: starter,
      assets: [
        {
          path: 'assets/x.svg',
          svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><script/></svg>',
        },
      ],
    });
    await expect(generateSite({ brief, client: fakeClient([evil]) })).rejects.toThrow(/problems/);
  });
});

describe('brief wrapped in text', () => {
  it('unwraps JSON text inside JSON text', () => {
    const inner = JSON.stringify({
      business: 'Acme',
      summary: 'We make anvils.',
      offerings: 'Anvils',
    });
    expect(normaliseBrief(JSON.stringify(inner)).ok).toBe(true);
  });
});
