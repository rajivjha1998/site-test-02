// One call to Claude, with streaming (long answers), prompt caching for the big system prompt,
// the default model fallback, and plain-language errors. The client is injectable for tests.
export const DEFAULT_MODEL = 'claude-opus-5-5';
export const MAX_OUTPUT_TOKENS = 32000;

/** Prices in USD per million tokens, used only for the cost line in logs. */
const PRICE = { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 };

export function estimateCost(usage = {}) {
  const million = 1_000_000;
  return (
    ((usage.input_tokens ?? 0) * PRICE.input +
      (usage.output_tokens ?? 0) * PRICE.output +
      (usage.cache_read_input_tokens ?? 0) * PRICE.cacheRead +
      (usage.cache_creation_input_tokens ?? 0) * PRICE.cacheWrite) /
    million
  );
}

export async function createClient() {
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not set. Add it as a repository secret.');
  }
  return new Anthropic({ maxRetries: 3, timeout: 15 * 60 * 1000 });
}

/**
 * Sends the conversation and returns { text, usage, stopReason }. `messages` alternate
 * user/assistant turns. Throws an Error with a readable message on failure.
 */
export async function askClaude({
  client,
  system,
  messages,
  model = DEFAULT_MODEL,
  effort = 'high',
  log = () => {},
}) {
  const stream = client.beta.messages.stream({
    model,
    max_tokens: MAX_OUTPUT_TOKENS,
    system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
    messages,
    output_config: { effort },
    fallbacks: 'default',
    betas: ['server-side-fallback-2026-07-01'],
  });
  let message;
  try {
    message = await stream.finalMessage();
  } catch (error) {
    const status = error?.status ? ` (HTTP ${error.status})` : '';
    throw new Error(`Claude could not be reached${status}: ${error?.message ?? error}`, {
      cause: error,
    });
  }
  if (message.stop_reason === 'refusal') throw new Error('Claude declined to write this site.');
  if (message.stop_reason === 'max_tokens')
    throw new Error(
      'The site was too long for one answer. Shorten the brief or ask for fewer pages.',
    );
  const text = message.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('');
  log(
    `Claude used ${message.usage?.input_tokens ?? 0} in / ${message.usage?.output_tokens ?? 0} out tokens (about $${estimateCost(message.usage).toFixed(2)}).`,
  );
  return { text, usage: message.usage ?? {}, stopReason: message.stop_reason };
}
