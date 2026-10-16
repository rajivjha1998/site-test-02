// Reads Claude's answer: one JSON object { site, assets } (or { refused }), possibly wrapped in
// a Markdown code fence or a sentence.

export class ParseError extends Error {}

/** Pulls the JSON object out of the text, tolerating fences and surrounding words. */
export function extractJson(text) {
  if (typeof text !== 'string' || !text.trim()) throw new ParseError('The answer was empty.');
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) throw new ParseError('The answer has no JSON object in it.');
  const candidate = text.slice(start, end + 1);
  try {
    return JSON.parse(candidate);
  } catch (error) {
    throw new ParseError(`The JSON could not be read: ${error.message}`);
  }
}

/** `{ refused }` when Claude declined, otherwise `{ site, assets }`. */
export function parseModelOutput(text) {
  const data = extractJson(text);
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new ParseError('The answer must be one JSON object.');
  }
  if (typeof data.refused === 'string') return { refused: data.refused };
  if (!data.site || typeof data.site !== 'object' || Array.isArray(data.site)) {
    throw new ParseError('The answer must have a "site" object.');
  }
  const assets = data.assets ?? [];
  if (!Array.isArray(assets)) throw new ParseError('"assets" must be a list.');
  for (const [i, asset] of assets.entries()) {
    if (!asset || typeof asset.path !== 'string' || typeof asset.svg !== 'string') {
      throw new ParseError(`assets[${i}] needs a "path" and an "svg" text.`);
    }
  }
  return { site: data.site, assets };
}
