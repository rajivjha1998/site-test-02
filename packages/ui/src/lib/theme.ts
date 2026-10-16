/**
 * Brand theme → design tokens. A site picks three colours; every accent token in
 * styles/tokens.css is derived from them, adjusted where needed so text stays readable
 * (WCAG AA: 4.5:1 for body text, 3:1 for large display text).
 */

export interface ThemeColors {
  /** Buttons, links, eyebrows, focus rings. */
  primary: string;
  /** Second stop of the headline accent gradient. */
  secondary: string;
  /** Soft background glows in the hero and closing panel. */
  tertiary: string;
}

type Rgb = [number, number, number];

// Grounds from tokens.css that accent colours must read against.
const LIGHT_BG = '#f2f5f9';
const LIGHT_SURFACE = '#f9fafc';
const DARK_BG = '#0b1220';
const INK = '#0f172a';
const WHITE = '#ffffff';

export const hexToRgb = (hex: string): Rgb => {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? [...h].map((c) => c + c).join('') : h;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as Rgb;
};

const rgbToHex = (rgb: Rgb) =>
  `#${rgb
    .map((v) =>
      Math.round(Math.min(255, Math.max(0, v)))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;

const luminance = (hex: string) => {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as Rgb;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
};

/** Mix `hex` towards `target` by `amount` (0 = unchanged, 1 = target). */
export const mix = (hex: string, target: string, amount: number) => {
  const a = hexToRgb(hex);
  const b = hexToRgb(target);
  return rgbToHex(a.map((v, i) => v + (b[i]! - v) * amount) as Rgb);
};

/** Move `hex` towards `target` in small steps until it reaches `ratio` against `ground`. */
export const ensureContrast = (hex: string, ground: string, ratio: number, target: string) => {
  for (let step = 0; step <= 20; step++) {
    const candidate = mix(hex, target, step / 20);
    if (contrast(candidate, ground) >= ratio) return candidate;
  }
  return target;
};

const alpha = (hex: string, a: number) => `rgb(${hexToRgb(hex).join(' ')} / ${a})`;

/** Every accent token for light and dark grounds. */
export function themeTokens({ primary, secondary, tertiary }: ThemeColors) {
  // --accent doubles as small text (links, eyebrows), so it must read on the page ground.
  const accent = ensureContrast(primary, LIGHT_BG, 4.5, INK);
  const accentStrong = ensureContrast(mix(accent, INK, 0.15), LIGHT_SURFACE, 4.5, INK);
  const accentBg = mix(primary, WHITE, 0.86);
  const accentInk = contrast(WHITE, accent) >= contrast(INK, accent) ? WHITE : INK;
  const darkAccent = ensureContrast(mix(primary, WHITE, 0.3), DARK_BG, 4.5, WHITE);

  return {
    light: {
      '--accent': accent,
      '--accent-strong': accentStrong,
      '--accent-bg': accentBg,
      '--accent-text': ensureContrast(accent, accentBg, 4.5, INK),
      // Gradient end of large headline text: 3:1 is the large-text minimum.
      '--accent-2': ensureContrast(secondary, LIGHT_BG, 3, INK),
      '--accent-ink': accentInk,
      '--glow-1': alpha(primary, 0.22),
      '--glow-2': alpha(tertiary, 0.2),
      '--glow-3': alpha(secondary, 0.18),
    },
    dark: {
      '--accent': darkAccent,
      '--accent-bg': alpha(primary, 0.18),
      '--accent-text': ensureContrast(darkAccent, DARK_BG, 7, WHITE),
    },
  };
}

/**
 * CSS that overrides the default accent tokens. `html` raises specificity above the
 * `:root` / `[data-theme]` rules in tokens.css, whatever order the stylesheets load in.
 */
export function themeCss(colors: ThemeColors): string {
  const { light, dark } = themeTokens(colors);
  const block = (vars: Record<string, string>) =>
    Object.entries(vars)
      .map(([k, v]) => `${k}:${v};`)
      .join('');
  return `html:root,html [data-theme='light']{${block(light)}}html [data-theme='dark']{${block(dark)}}`;
}
