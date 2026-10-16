import { describe, expect, it } from 'vitest';
import { corsHeaders } from './cors';

const allowed = 'https://blackboxops1.github.io, https://blackboxops.io';

describe('corsHeaders', () => {
  it('allows listed site origins', () => {
    expect(corsHeaders('https://blackboxops.io', allowed)['Access-Control-Allow-Origin']).toBe(
      'https://blackboxops.io',
    );
  });

  it('allows nothing for other or missing origins', () => {
    expect(corsHeaders('https://evil.example', allowed)).toEqual({});
    expect(corsHeaders(null, allowed)).toEqual({});
  });
});
