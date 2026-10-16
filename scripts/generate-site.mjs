// Writes a whole website from a brief.
//
//   node --import ./scripts/register-ts.mjs scripts/generate-site.mjs --brief brief.json [--out .] [--dry-run]
//   BRIEF_JSON='{...}' ... generate-site.mjs        (what the workflows use)
//
// Writes site.json and assets/*.svg under --out (default: the repo root). Needs ANTHROPIC_API_KEY.
// Exit codes: 0 done, 1 failed (message printed as a GitHub error), 2 brief invalid.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normaliseBrief } from './generate/brief.mjs';
import { createClient } from './generate/claude.mjs';
import { generateSite, GenerationError } from './generate/generate.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));

function args(argv) {
  const out = { out: root };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--brief') out.brief = argv[++i];
    else if (argv[i] === '--out') out.out = resolve(argv[++i]);
    else if (argv[i] === '--dry-run') out.dryRun = true;
    else if (argv[i] === '--model') out.model = argv[++i];
    else if (argv[i] === '--effort') out.effort = argv[++i];
  }
  return out;
}

const fail = (message, code = 1) => {
  console.log(`::error::${message.replace(/\n/g, ' ')}`);
  process.exit(code);
};

const options = args(process.argv.slice(2));
const rawBrief = options.brief ? readFileSync(options.brief, 'utf8') : process.env.BRIEF_JSON;
if (!rawBrief) fail('No brief given (use --brief file.json or BRIEF_JSON).', 2);

const normalised = normaliseBrief(rawBrief);
if (!normalised.ok) fail(`The brief has problems: ${normalised.problems.join('; ')}`, 2);

const assetsDir = join(options.out, 'assets');
const existing = existsSync(assetsDir) ? readdirSync(assetsDir).map((f) => `assets/${f}`) : [];

try {
  const client = await createClient();
  const result = await generateSite({
    brief: normalised.brief,
    client,
    existingAssets: [...new Set([...existing, 'assets/placeholder.svg'])],
    model: options.model,
    effort: options.effort,
    log: (line) => console.log(line),
  });
  const site = { $schema: './site.schema.json', ...result.site };
  if (options.dryRun) {
    console.log(JSON.stringify({ site, assets: result.assets.map((a) => a.path) }, null, 2));
  } else {
    mkdirSync(assetsDir, { recursive: true });
    for (const asset of result.assets) {
      mkdirSync(dirname(join(options.out, asset.path)), { recursive: true });
      writeFileSync(join(options.out, asset.path), `${asset.svg}\n`);
    }
    writeFileSync(join(options.out, 'site.json'), `${JSON.stringify(site, null, 2)}\n`);
  }
  console.log(`Done in ${result.attempts} attempt(s); cost about $${result.cost.toFixed(2)}.`);
  if (process.env.GITHUB_STEP_SUMMARY) {
    writeFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      `Generated ${Object.keys(site.pages).length} pages and ${result.assets.length} pictures in ${result.attempts} attempt(s), about $${result.cost.toFixed(2)}.\n`,
      { flag: 'a' },
    );
  }
} catch (error) {
  if (error instanceof GenerationError)
    fail(`${error.message} ${error.problems.slice(0, 8).join('; ')}`);
  fail(error?.message ?? String(error));
}
