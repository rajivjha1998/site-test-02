import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/** Resolve extensionless relative imports (`./common`) to the `.ts` file next to the importer. */
export async function resolve(specifier, context, nextResolve) {
  if (
    (specifier.startsWith('./') || specifier.startsWith('../')) &&
    !/\.[cm]?[jt]s$/.test(specifier) &&
    context.parentURL
  ) {
    const candidate = new URL(`${specifier}.ts`, context.parentURL);
    if (existsSync(fileURLToPath(candidate))) {
      return { url: candidate.href, shortCircuit: true };
    }
  }
  return nextResolve(specifier, context);
}
