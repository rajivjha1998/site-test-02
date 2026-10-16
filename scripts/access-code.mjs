// Site access codes.
// - `.site-builder/access.json` holds a salted scrypt hash; every change request from the site
//   builder must carry the code, and GitHub Actions check it against this hash.
// - `.site-builder/keys/<code>/key` is the sign-in key: the platform signs a user in by fetching
//   this exact path (instant: 200 = right code, 404 = wrong). It lives in the private repo.
//
//   ACCESS_CODE=... node scripts/access-code.mjs hash      → prints a new access.json
//   ACCESS_CODE=... node scripts/access-code.mjs verify    → exit 0 if it matches access.json
//   ACCESS_CODE=... node scripts/access-code.mjs verify <file|->   (record from a file or stdin)
//   ACCESS_CODE=... node scripts/access-code.mjs keypath   → prints the sign-in key path
import { Buffer } from 'node:buffer';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const ACCESS_FILE = '.site-builder/access.json';
const KEY_LENGTH = 32;
const PARAMS = { N: 16384, r: 8, p: 1 };

/** Returns a problem with the code, or null when it's acceptable. */
export function checkCodeRules(code) {
  if (typeof code !== 'string' || code.length < 8)
    return 'The access code must be at least 8 characters.';
  if (code.length > 128) return 'The access code must be at most 128 characters.';
  // The code is also a folder name in the sign-in key path (.site-builder/keys/<code>/key),
  // so only URL- and path-safe characters are allowed.
  if (!/^[A-Za-z0-9_-]+$/.test(code))
    return 'The access code may only use letters, digits, dashes (-) and underscores (_).';
  return null;
}

/** Repo path of a site's sign-in key file for a given code. */
export const keyPath = (code) => `.site-builder/keys/${code}/key`;
export const KEY_FILE_CONTENT = 'BBPlatform site builder sign-in key. Do not edit.\n';

export function hashCode(code, salt = randomBytes(16)) {
  const hash = scryptSync(code, salt, KEY_LENGTH, PARAMS);
  return {
    algorithm: 'scrypt',
    N: PARAMS.N,
    r: PARAMS.r,
    p: PARAMS.p,
    salt: salt.toString('hex'),
    hash: hash.toString('hex'),
  };
}

export function verifyCode(code, record) {
  if (typeof code !== 'string' || !record || record.algorithm !== 'scrypt') return false;
  const salt = Buffer.from(String(record.salt), 'hex');
  const expected = Buffer.from(String(record.hash), 'hex');
  if (!salt.length || expected.length !== KEY_LENGTH) return false;
  const actual = scryptSync(code, salt, KEY_LENGTH, { N: record.N, r: record.r, p: record.p });
  return timingSafeEqual(actual, expected);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [command, source] = process.argv.slice(2);
  const code = process.env.ACCESS_CODE ?? '';
  const fail = (message) => {
    console.log(`::error::${message}`);
    process.exit(1);
  };
  if (command === 'hash') {
    const problem = checkCodeRules(code);
    if (problem) fail(problem);
    process.stdout.write(`${JSON.stringify(hashCode(code), null, 2)}\n`);
  } else if (command === 'verify') {
    const file = source && source !== '-' ? source : ACCESS_FILE;
    let raw;
    if (source === '-') raw = readFileSync(0, 'utf8');
    else if (existsSync(file)) raw = readFileSync(file, 'utf8');
    else fail('This site has no access code yet. Ask the site owner to set one.');
    let record;
    try {
      record = JSON.parse(raw);
    } catch {
      fail('This site has no access code yet. Ask the site owner to set one.');
    }
    if (!verifyCode(code, record)) fail('Wrong site name or access code.');
    console.log('Access code accepted.');
  } else if (command === 'keypath') {
    const problem = checkCodeRules(code);
    if (problem) fail(problem);
    process.stdout.write(keyPath(code));
  } else {
    fail('Usage: access-code.mjs hash | verify [file|-] | keypath');
  }
}
