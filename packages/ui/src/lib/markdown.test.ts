import { describe, expect, it } from 'vitest';
import { renderMarkdown } from './markdown';

describe('renderMarkdown', () => {
  it('renders paragraphs, lists and bold text', () => {
    const html = renderMarkdown('Hello **world**\n\n- one\n- two');
    expect(html).toContain('<p>Hello <strong>world</strong></p>');
    expect(html).toContain('<li>one</li>');
  });

  it('escapes raw HTML, including scripts and event handlers', () => {
    const html = renderMarkdown('<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>');
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;script&gt;');
  });

  it('drops unsafe links but keeps their text', () => {
    const html = renderMarkdown('[bad](javascript:alert(1)) and [also bad](data:text/html,x)');
    expect(html).not.toContain('javascript:');
    expect(html).not.toContain('data:');
    expect(html).toContain('bad');
  });

  it('keeps safe links and marks external ones', () => {
    const html = renderMarkdown('[site](https://example.com) [mail](mailto:a@b.co) [top](#top)');
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('href="mailto:a@b.co"');
    expect(html).toContain('href="#top"');
  });

  it('does not allow protocol-relative links', () => {
    expect(renderMarkdown('[x](//evil.example)')).not.toContain('evil.example');
  });

  it('drops images instead of embedding them', () => {
    expect(renderMarkdown('![logo](https://example.com/a.png)')).not.toContain('<img');
  });

  it('never produces an H1', () => {
    const html = renderMarkdown('# Big\n\n## Medium\n\n#### Small');
    expect(html).not.toContain('<h1');
    expect(html).toContain('<h2>Big</h2>');
    expect(html).toContain('<h3>Small</h3>');
  });
});
