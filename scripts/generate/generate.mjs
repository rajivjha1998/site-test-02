// Brief in, checked site out. Asks Claude, checks the answer, and if anything is wrong sends the
// problems back for a fix (up to MAX_ATTEMPTS). Nothing is returned unless it fully validates.
import { buildRepairPrompt, buildSystemPrompt, buildUserPrompt } from './prompt.mjs';
import { askClaude, estimateCost } from './claude.mjs';
import { ParseError, parseModelOutput } from './parse.mjs';
import { GENERATED_ASSET_PATH, sanitizeSvg } from './svg.mjs';
import { validateSite } from './validate.mjs';

export const MAX_ATTEMPTS = 3;
export const MAX_ASSETS = 6;
const PLACEHOLDER = 'assets/placeholder.svg';

export class GenerationError extends Error {
  constructor(message, problems = []) {
    super(message);
    this.problems = problems;
  }
}

/** Checks the pictures Claude drew. Returns { assets, problems }. */
export function checkAssets(rawAssets) {
  const problems = [];
  const assets = [];
  const seen = new Set();
  if (rawAssets.length > MAX_ASSETS)
    problems.push(`Too many pictures (${rawAssets.length}); the limit is ${MAX_ASSETS}.`);
  for (const asset of rawAssets.slice(0, MAX_ASSETS)) {
    if (!GENERATED_ASSET_PATH.test(asset.path)) {
      problems.push(
        `Picture path "${asset.path}" must look like assets/name.svg (lowercase letters, digits, dashes).`,
      );
      continue;
    }
    if (seen.has(asset.path)) {
      problems.push(`Picture "${asset.path}" is listed twice.`);
      continue;
    }
    seen.add(asset.path);
    const { svg, problems: svgProblems } = sanitizeSvg(asset.svg);
    if (svgProblems.length) problems.push(...svgProblems.map((p) => `${asset.path}: ${p}`));
    else assets.push({ path: asset.path, svg });
  }
  return { assets, problems };
}

/**
 * @param {object} options
 * @param {object} options.brief  a normalised brief (see brief.mjs)
 * @param {object} options.client Anthropic client (or a fake with the same `beta.messages.stream`)
 * @param {string[]} [options.existingAssets] files already in assets/ that may be referenced
 * @returns {{ site, assets, usage, cost, attempts }}
 */
export async function generateSite({
  brief,
  client,
  existingAssets = [PLACEHOLDER],
  model,
  effort,
  log = () => {},
}) {
  const system = buildSystemPrompt();
  const messages = [{ role: 'user', content: buildUserPrompt(brief) }];
  const total = {
    input_tokens: 0,
    output_tokens: 0,
    cache_read_input_tokens: 0,
    cache_creation_input_tokens: 0,
  };
  let lastProblems = [];

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    log(`Attempt ${attempt} of ${MAX_ATTEMPTS}: asking Claude...`);
    const answer = await askClaude({ client, system, messages, model, effort, log });
    for (const key of Object.keys(total)) total[key] += answer.usage[key] ?? 0;

    let problems = [];
    let parsed;
    try {
      parsed = parseModelOutput(answer.text);
    } catch (error) {
      if (!(error instanceof ParseError)) throw error;
      problems = [error.message];
    }
    if (parsed?.refused)
      throw new GenerationError(`Claude declined to write this site: ${parsed.refused}`);

    if (parsed) {
      const { assets, problems: assetProblems } = checkAssets(parsed.assets);
      const available = [...new Set([...existingAssets, ...assets.map((a) => a.path)])];
      problems = [...assetProblems, ...validateSite(parsed.site, available)];
      if (!problems.length) {
        log(
          `Site checked: ${Object.keys(parsed.site.pages).length} pages, ${assets.length} pictures.`,
        );
        return {
          site: parsed.site,
          assets,
          usage: total,
          cost: estimateCost(total),
          attempts: attempt,
        };
      }
    }
    lastProblems = problems;
    log(
      `Attempt ${attempt} had ${problems.length} problem(s): ${problems.slice(0, 5).join(' | ')}`,
    );
    messages.push(
      { role: 'assistant', content: answer.text },
      { role: 'user', content: buildRepairPrompt(problems) },
    );
  }
  throw new GenerationError(
    `The generated site still had problems after ${MAX_ATTEMPTS} attempts.`,
    lastProblems,
  );
}
