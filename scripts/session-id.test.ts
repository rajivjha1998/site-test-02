import { describe, expect, it } from 'vitest';
// @ts-expect-error plain .mjs script without type declarations
import { isValidSessionId } from './session-id.mjs';

describe('isValidSessionId', () => {
  it.each(['TSK-00123', '4521', 'req_42.a'])('accepts %s', (id) => {
    expect(isValidSessionId(id)).toBe(true);
  });

  it.each([
    'main',
    'draft',
    'Draft',
    'HEAD',
    'gh-pages',
    'a',
    'x/y',
    '../x',
    'a..b',
    'x.lock',
    '-x',
    '',
  ])('rejects %j', (id) => {
    expect(isValidSessionId(id)).toBe(false);
  });
});
