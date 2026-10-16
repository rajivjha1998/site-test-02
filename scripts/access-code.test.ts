import { describe, expect, it } from 'vitest';
// @ts-expect-error plain .mjs script without type declarations
import { checkCodeRules, hashCode, keyPath, verifyCode } from './access-code.mjs';
// @ts-expect-error plain .mjs script without type declarations
import { checkFile } from './update-file.mjs';

describe('access codes', () => {
  it('accepts the right code and rejects others', () => {
    const record = hashCode('correct-horse-42');
    expect(verifyCode('correct-horse-42', record)).toBe(true);
    expect(verifyCode('correct-horse-43', record)).toBe(false);
    expect(verifyCode('', record)).toBe(false);
  });

  it('never stores the code itself', () => {
    const record = hashCode('correct-horse-42');
    expect(JSON.stringify(record)).not.toContain('correct-horse');
  });

  it('uses a new salt every time', () => {
    expect(hashCode('same-code-123').salt).not.toBe(hashCode('same-code-123').salt);
  });

  it('rejects broken or foreign records', () => {
    expect(verifyCode('x', null)).toBe(false);
    expect(verifyCode('x', { algorithm: 'md5', salt: '00', hash: '00' })).toBe(false);
    expect(verifyCode('x', { algorithm: 'scrypt', salt: '', hash: '' })).toBe(false);
  });

  it.each([
    ['short', 'at least 8'],
    [' padded-code ', 'letters, digits'],
    ['has space 123', 'letters, digits'],
    ['../../site.json', 'letters, digits'],
    ['a/b/c/d/e/f', 'letters, digits'],
    ['x'.repeat(129), 'at most 128'],
  ])('rejects %j', (code, problem) => {
    expect(checkCodeRules(code)).toContain(problem);
  });

  it('accepts generated codes (UUID) and simple codes', () => {
    expect(checkCodeRules('3f2c9a1e-7b4d-4c2a-9e1f-0a6b8c3d5e7f')).toBeNull();
    expect(checkCodeRules('Acme_2026-site')).toBeNull();
  });

  it('keeps the sign-in key inside its own folder', () => {
    expect(keyPath('abc-12345')).toBe('.site-builder/keys/abc-12345/key');
  });

  it('can never be overwritten through Save File', () => {
    expect(checkFile('.site-builder/access.json', '{}').join()).toContain("can't be edited");
    expect(checkFile('.site-builder/keys/abc-12345/key', 'x').join()).toContain("can't be edited");
  });
});
