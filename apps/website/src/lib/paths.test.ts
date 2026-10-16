import { describe, expect, it } from 'vitest';
import { slugFromPath } from './paths';

describe('slugFromPath', () => {
  it('returns undefined for the home page and the bare slug otherwise', () => {
    expect(slugFromPath('/')).toBeUndefined();
    expect(slugFromPath('/apps/prebuilt/')).toBe('apps/prebuilt');
  });
});
