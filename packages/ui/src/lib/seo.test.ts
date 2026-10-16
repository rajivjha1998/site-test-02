import { describe, expect, it } from 'vitest';
import { entitySchema } from '../schemas/entity';
import {
  absoluteUrl,
  faqPageLd,
  softwareApplicationLd,
  jsonLdGraph,
  pageTitle,
  seoProblems,
  serializeJsonLd,
  TITLE_MAX,
} from './seo';

const entity = entitySchema.parse({
  name: 'Example Co',
  url: 'https://example.com',
  description: 'Example description.',
  product: { name: 'Example Platform', description: 'Example product.' },
  logo: '/logo.svg',
});

describe('pageTitle', () => {
  it('uses the site name alone on the home page', () => {
    expect(pageTitle('Example Co')).toBe('Example Co');
  });

  it('appends the site name to inner pages', () => {
    expect(pageTitle('Example Co', 'Pricing')).toBe('Pricing — Example Co');
  });
});

describe('absoluteUrl', () => {
  it('adds the trailing slash to page paths', () => {
    expect(absoluteUrl('/pricing', 'https://example.com')).toBe('https://example.com/pricing/');
  });

  it('keeps a base path in the origin', () => {
    expect(absoluteUrl('/pricing/', 'https://x.github.io/site')).toBe(
      'https://x.github.io/site/pricing/',
    );
    expect(absoluteUrl('/', 'https://x.github.io/site/')).toBe('https://x.github.io/site/');
  });

  it('keeps file paths as they are', () => {
    expect(absoluteUrl('/robots.txt', 'https://example.com')).toBe(
      'https://example.com/robots.txt',
    );
  });
});

describe('seoProblems', () => {
  it('passes a title and description within limits', () => {
    expect(seoProblems('Pricing — Example Co', 'A short description.')).toEqual([]);
  });

  it('flags a title over the limit', () => {
    expect(seoProblems('x'.repeat(TITLE_MAX + 1), 'ok')).toHaveLength(1);
  });

  it('flags an empty description', () => {
    expect(seoProblems('Pricing', '  ')).toContain('description is empty');
  });
});

describe('jsonLdGraph', () => {
  it('always includes Organization and WebSite', () => {
    const graph = jsonLdGraph(entity, { description: 'd', path: '/' })['@graph'] as {
      '@type': string;
    }[];
    expect(graph.map((node) => node['@type'])).toEqual(['Organization', 'WebSite']);
  });

  it('adds breadcrumbs only for nested pages', () => {
    const graph = jsonLdGraph(entity, {
      description: 'd',
      path: '/apps/prebuilt/',
      breadcrumbs: [
        { name: 'Apps', path: '/apps/' },
        { name: 'Prebuilt apps', path: '/apps/prebuilt/' },
      ],
    })['@graph'] as { '@type': string }[];
    expect(graph.at(-1)?.['@type']).toBe('BreadcrumbList');
  });
});

describe('serializeJsonLd', () => {
  it('escapes < so content cannot close the script tag', () => {
    expect(serializeJsonLd({ name: '</script>' })).not.toContain('</script>');
  });
});

describe('faqPageLd', () => {
  it('maps questions and answers', () => {
    const ld = faqPageLd([{ q: 'What is it?', a: 'A platform.' }]);
    expect(ld).toMatchObject({
      '@type': 'FAQPage',
      mainEntity: [
        { '@type': 'Question', name: 'What is it?', acceptedAnswer: { text: 'A platform.' } },
      ],
    });
  });
});

describe('softwareApplicationLd', () => {
  it('describes the product and links it to the organisation', () => {
    const ld = softwareApplicationLd(entity, '/platform/');
    expect(ld).toMatchObject({
      name: 'Example Platform',
      url: 'https://example.com/platform/',
      publisher: { '@id': 'https://example.com/#organization' },
    });
  });
});
