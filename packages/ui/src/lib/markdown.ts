import { Marked, type Tokens } from 'marked';
import { withBase } from './href';

/**
 * Markdown for `richText` sections, rendered at build time. The text comes from customers and
 * from AI, so it is treated as untrusted: raw HTML is escaped, images are dropped, and links
 * may only be http(s), mailto, tel, an in-page anchor or a path on this site.
 */
const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const SAFE_LINK = /^(https?:\/\/|mailto:|tel:|#|\/(?!\/))/i;

const marked = new Marked({ gfm: true, breaks: false });

marked.use({
  renderer: {
    html(token: Tokens.HTML | Tokens.Tag) {
      return escapeHtml(token.text);
    },
    image(token: Tokens.Image) {
      return escapeHtml(token.text);
    },
    link(token: Tokens.Link) {
      const inner = this.parser.parseInline(token.tokens);
      const href = token.href.trim();
      if (!SAFE_LINK.test(href)) return inner;
      const external = /^https?:\/\//i.test(href);
      const target = href.startsWith('/') ? withBase(href) : href;
      const title = token.title ? ` title="${escapeHtml(token.title)}"` : '';
      const rel = external ? ' rel="noopener noreferrer"' : '';
      return `<a href="${escapeHtml(target)}"${title}${rel}>${inner}</a>`;
    },
    // The page's only H1 is the hero, so Markdown headings start at H2.
    heading(token: Tokens.Heading) {
      const level = token.depth <= 2 ? 2 : 3;
      return `<h${level}>${this.parser.parseInline(token.tokens)}</h${level}>\n`;
    },
  },
});

export function renderMarkdown(source: string): string {
  return marked.parse(source, { async: false }) as string;
}
