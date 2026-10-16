// Applies site-builder answers to site.json.
//
//   node scripts/apply-settings.mjs settings.json      (or SETTINGS_JSON='{"brand_name":"Acme"}')
//
// Answers arrive from BBPlatform HIL forms as flat key/value pairs (see FIELDS). Empty values
// mean "leave as is", so each form only needs the fields it shows. Whole sections can also be
// sent as objects under their site.json key (e.g. { "theme": { ... } }) and are merged in.
// Validation is separate: run `pnpm validate` afterwards.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/** Home page hero: the first section of "/". */
const hero = (site) => site.pages?.['/']?.sections?.[0];

const ctaAt = (site, index, variant) => {
  const h = hero(site);
  h.ctas ??= [];
  h.ctas[index] ??= { label: '', href: '/', variant };
  return h.ctas[index];
};

/** HIL field key → how to apply it. Keep keys in sync with docs/site-builder-agents.md (section 4). */
export const FIELDS = {
  brand_name: (s, v) => (s.brand.name = v),
  brand_tagline: (s, v) => (s.brand.tagline = v),
  brand_description: (s, v) => {
    s.brand.description = v;
    if (s.pages?.['/']) s.pages['/'].seo.description = v;
  },
  brand_url: (s, v) => (s.brand.url = toUrl(v).replace(/\/$/, '')),
  contact_email: (s, v) => (s.brand.contactEmail = v),
  color_primary: (s, v) => (s.theme.primary = toHex(v)),
  color_secondary: (s, v) => (s.theme.secondary = toHex(v)),
  color_tertiary: (s, v) => (s.theme.tertiary = toHex(v)),
  hero_title: (s, v) => (hero(s).title = v),
  hero_title_accent: (s, v) => (hero(s).titleAccent = v),
  hero_lede: (s, v) => (hero(s).lede = v),
  // Button 1 is also the header's call to action, so the two never disagree.
  button1_label: (s, v) => {
    ctaAt(s, 0, 'primary').label = v;
    if (s.navigation.actions[0]) s.navigation.actions[0].label = v;
  },
  button1_link: (s, v) => {
    ctaAt(s, 0, 'primary').href = toHref(v);
    if (s.navigation.actions[0]) s.navigation.actions[0].href = toHref(v);
  },
  button2_label: (s, v) => (ctaAt(s, 1, 'secondary').label = v),
  button2_link: (s, v) => (ctaAt(s, 1, 'secondary').href = toHref(v)),
};

/** "2563eb" or " #2563EB " → "#2563eb". */
export const toHex = (v) => `#${v.trim().replace(/^#/, '').toLowerCase()}`;

/** "example.com" → "https://example.com". */
export const toUrl = (v) => (/^https?:\/\//.test(v) ? v : `https://${v.replace(/^\/+/, '')}`);

/**
 * Accepts what people type for a button link: "/pricing" → "/pricing/", "www.x.com" →
 * "https://www.x.com", "hello@x.com" → "mailto:hello@x.com"; anchors and full URLs as given.
 */
export const toHref = (v) => {
  if (/^(https?:|mailto:|tel:|#)/.test(v)) return v;
  if (/^[^\s/@]+@[^\s/@]+\.[^\s/@]+$/.test(v)) return `mailto:${v}`;
  if (v.startsWith('/')) {
    const [path, rest = ''] = v.split(/(?=[?#])/);
    return `${path.endsWith('/') ? path : `${path}/`}${rest}`;
  }
  return toUrl(v);
};

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

const merge = (target, source) => {
  for (const [k, v] of Object.entries(source)) {
    target[k] = isObject(v) && isObject(target[k]) ? merge(target[k], v) : v;
  }
  return target;
};

/** Returns a new site with `settings` applied, plus the keys it ignored. */
export function applySettings(site, settings) {
  const next = structuredClone(site);
  const ignored = [];
  for (const [key, raw] of Object.entries(settings)) {
    if (raw === null || raw === undefined) continue;
    if (key in FIELDS) {
      const value = String(raw).trim();
      if (value) FIELDS[key](next, value);
    } else if (isObject(raw) && key in next) {
      next[key] = isObject(next[key]) ? merge(next[key], raw) : raw;
    } else {
      ignored.push(key);
    }
  }
  return { site: next, ignored };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const sitePath = fileURLToPath(new URL('../site.json', import.meta.url));
  const input = process.argv[2] ? readFileSync(process.argv[2], 'utf8') : process.env.SETTINGS_JSON;
  if (!input) {
    console.error('Pass a settings JSON file, or set SETTINGS_JSON.');
    process.exit(1);
  }
  let settings = JSON.parse(input);
  // HIL bindings sometimes deliver the answers as a JSON string; accept that too.
  if (typeof settings === 'string') settings = JSON.parse(settings);
  const { site, ignored } = applySettings(JSON.parse(readFileSync(sitePath, 'utf8')), settings);
  writeFileSync(sitePath, `${JSON.stringify(site, null, 2)}\n`);
  console.log(`Applied ${Object.keys(settings).length - ignored.length} setting(s) to site.json.`);
  if (ignored.length) console.warn(`Ignored unknown keys: ${ignored.join(', ')}`);
}
