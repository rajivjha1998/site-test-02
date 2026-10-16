import { describe, expect, it } from 'vitest';
import { contrast, themeCss, themeTokens } from './theme';

const ground = '#f2f5f9';

describe('themeTokens', () => {
  it('keeps a readable primary colour unchanged', () => {
    expect(
      themeTokens({ primary: '#1d4ed8', secondary: '#4f46e5', tertiary: '#38bdf8' }).light[
        '--accent'
      ],
    ).toBe('#1d4ed8');
  });

  it.each(['#facc15', '#22d3ee', '#a3e635', '#ffffff', '#000000', '#ff0000'])(
    'makes %s readable as text and on buttons',
    (primary) => {
      const { light, dark } = themeTokens({ primary, secondary: primary, tertiary: primary });
      expect(contrast(light['--accent'], ground)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(light['--accent-ink'], light['--accent'])).toBeGreaterThanOrEqual(4.5);
      expect(contrast(light['--accent-text'], light['--accent-bg'])).toBeGreaterThanOrEqual(4.5);
      expect(contrast(light['--accent-2'], ground)).toBeGreaterThanOrEqual(3);
      expect(contrast(dark['--accent'], '#0b1220')).toBeGreaterThanOrEqual(4.5);
    },
  );
});

describe('themeCss', () => {
  it('overrides the light and dark accent tokens', () => {
    const css = themeCss({ primary: '#2563eb', secondary: '#4f46e5', tertiary: '#38bdf8' });
    expect(css).toContain('html:root');
    expect(css).toContain("html [data-theme='dark']");
    expect(css).toContain('--accent:#2563eb;');
  });
});
