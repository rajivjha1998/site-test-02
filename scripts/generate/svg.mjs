// Claude may write simple SVG illustrations. An SVG can carry scripts, event handlers and
// external references, and it is served from the customer's own address, so only a small,
// static subset is accepted: allow-listed shapes, no text, no scripts, no outside links.

export const MAX_SVG_CHARS = 30000;

const ALLOWED_TAGS = new Set([
  'svg',
  'g',
  'path',
  'circle',
  'ellipse',
  'rect',
  'line',
  'polyline',
  'polygon',
  'defs',
  'lineargradient',
  'radialgradient',
  'stop',
  'clippath',
  'mask',
  'pattern',
  'symbol',
  'use',
  'title',
  'desc',
]);

const TAG = /<(\/?)([A-Za-z][\w:.-]*)((?:"[^"]*"|'[^']*'|[^'">])*?)(\/?)>/g;
const ATTR = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;

/**
 * Checks and cleans one SVG. Returns `{ svg, problems }`; when `problems` is not empty the
 * file must not be used.
 */
export function sanitizeSvg(input) {
  const problems = [];
  if (typeof input !== 'string') return { svg: '', problems: ['The SVG is not text.'] };
  let svg = input.replace(/^\uFEFF/, '').trim();
  svg = svg.replace(/^<\?xml[^>]*\?>\s*/i, '').replace(/<!--[\s\S]*?-->/g, '');

  if (svg.length > MAX_SVG_CHARS)
    problems.push(`The SVG is ${svg.length} characters; the limit is ${MAX_SVG_CHARS}.`);
  if (!/^<svg[\s>]/i.test(svg)) problems.push('The file must start with an <svg> element.');
  if (/<!(?:DOCTYPE|ENTITY|\[CDATA)/i.test(svg) || /<\?/.test(svg)) {
    problems.push('Doctype, entity, CDATA and processing instructions are not allowed.');
  }
  if (!/viewBox\s*=/.test(svg)) problems.push('The <svg> needs a viewBox so it scales.');

  let match;
  TAG.lastIndex = 0;
  let sawRoot = false;
  while ((match = TAG.exec(svg))) {
    const [, closing, rawName, attrText] = match;
    const name = rawName.toLowerCase();
    if (!ALLOWED_TAGS.has(name)) {
      problems.push(`<${rawName}> is not allowed.`);
      continue;
    }
    if (closing) continue;
    if (name === 'svg' && !sawRoot) {
      sawRoot = true;
      if (!/xmlns\s*=\s*["']http:\/\/www\.w3\.org\/2000\/svg["']/.test(attrText)) {
        problems.push('The <svg> needs xmlns="http://www.w3.org/2000/svg".');
      }
    }
    ATTR.lastIndex = 0;
    let attr;
    while ((attr = ATTR.exec(attrText))) {
      const attrName = attr[1].toLowerCase();
      const value = (attr[2] ?? attr[3] ?? attr[4] ?? '').trim();
      if (!attrName || attrName === '/') continue;
      if (attrName.startsWith('on')) problems.push(`Event attribute "${attr[1]}" is not allowed.`);
      else if ((attrName === 'href' || attrName === 'xlink:href') && !value.startsWith('#')) {
        problems.push('Links must point inside the file (href="#id").');
      } else if (attrName === 'xmlns:xlink' || attrName === 'xmlns') {
        // namespace declarations are fine
      } else if (/javascript:|data:|expression\(|@import/i.test(value)) {
        problems.push(`Attribute "${attr[1]}" contains something unsafe.`);
      } else if (/url\(\s*(?!["']?#)/i.test(value)) {
        problems.push(`Attribute "${attr[1]}" refers outside the file; use url(#id) only.`);
      }
    }
  }
  if (/<script|<style|<foreignObject|<iframe|<image|<text/i.test(svg)) {
    problems.push('Scripts, styles, images, text and foreign content are not allowed.');
  }
  return { svg, problems: [...new Set(problems)] };
}

/** `assets/<name>.svg`: lowercase, short, and never the reserved placeholder. */
export const GENERATED_ASSET_PATH = /^assets\/(?!placeholder\.svg$)[a-z0-9][a-z0-9-]{0,40}\.svg$/;
