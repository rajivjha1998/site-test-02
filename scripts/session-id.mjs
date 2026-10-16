// Sign-in sessions for the site builder. When verify-access accepts a code it creates a branch
// named after the request's unique id (BBPlatform's task number); the platform then confirms
// access by checking that exact branch exists. A successful save deletes it again.
//
//   REQUEST_ID=TSK-123 node scripts/session-id.mjs   → exit 0 if usable as a session branch name
import { fileURLToPath } from 'node:url';

const RESERVED = new Set(['main', 'draft', 'head', 'master', 'gh-pages']);

/** True when the id is safe to use as a branch name and can't clash with real branches. */
export function isValidSessionId(id) {
  return (
    typeof id === 'string' &&
    /^[A-Za-z0-9][A-Za-z0-9._-]{2,63}$/.test(id) &&
    !id.endsWith('.lock') &&
    !id.includes('..') &&
    !RESERVED.has(id.toLowerCase())
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const id = process.env.REQUEST_ID ?? '';
  if (!isValidSessionId(id)) {
    console.log(
      `::error::request_id '${id}' can't be used for sign-in. Use the task number (letters, digits, . _ -; 3-64 characters).`,
    );
    process.exit(1);
  }
}
