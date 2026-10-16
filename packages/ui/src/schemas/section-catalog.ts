import { PLACEHOLDER_IMAGE } from './limits';
import type { Section } from './sections';

/**
 * The sections a customer can add, with starter content. The Studio shows this list in "Add
 * section" and inserts `sample`; every sample is checked against the schema by a test.
 * Placeholders use "[Pending: …]" so the site can't be published with them left in.
 */
export interface SectionCatalogEntry {
  type: Section['type'];
  label: string;
  description: string;
  category: 'intro' | 'content' | 'proof' | 'convert' | 'info';
  sample: Section;
}

const image = (what: string) => ({
  src: PLACEHOLDER_IMAGE,
  alt: `[Pending: describe ${what}]`,
});

export const sectionCatalog: SectionCatalogEntry[] = [
  {
    type: 'hero',
    label: 'Hero',
    description: 'The big opening: headline, one sentence, buttons and an optional picture.',
    category: 'intro',
    sample: {
      type: 'hero',
      layout: 'centered',
      title: 'Your headline goes here.',
      lede: 'One clear sentence on what you offer and why it matters.',
      ctas: [{ label: 'Get started', href: '#contact', variant: 'primary' }],
    },
  },
  {
    type: 'logoStrip',
    label: 'Logos',
    description: 'A row of partner, client or tool names (or logos).',
    category: 'proof',
    sample: {
      type: 'logoStrip',
      label: 'Trusted by',
      items: [{ name: '[Pending: first name]' }, { name: '[Pending: second name]' }],
    },
  },
  {
    type: 'statStrip',
    label: 'Key figures',
    description: '2 to 4 numbers that back up your claims.',
    category: 'proof',
    sample: {
      type: 'statStrip',
      title: 'In numbers',
      items: [
        { value: '[Pending: figure]', label: '[Pending: what it measures]' },
        { value: '[Pending: figure]', label: '[Pending: what it measures]' },
      ],
    },
  },
  {
    type: 'featureGrid',
    label: 'Features',
    description: 'Up to 4 benefits or capabilities, each with an icon or picture.',
    category: 'content',
    sample: {
      type: 'featureGrid',
      title: 'Why choose us.',
      columns: 3,
      variant: 'cards',
      items: [
        { icon: 'zap', title: 'First benefit', body: 'Describe it in one short sentence.' },
        { icon: 'shield', title: 'Second benefit', body: 'Describe it in one short sentence.' },
        { icon: 'users', title: 'Third benefit', body: 'Describe it in one short sentence.' },
      ],
      ctas: [],
    },
  },
  {
    type: 'split',
    label: 'Text and picture',
    description: 'One idea told in words, next to a picture.',
    category: 'content',
    sample: {
      type: 'split',
      title: 'Tell one story well.',
      body: ['Start with the sentence that answers your heading on its own.'],
      bullets: [],
      ctas: [],
      image: image('the picture'),
      reverse: false,
    },
  },
  {
    type: 'steps',
    label: 'Steps',
    description: 'A real sequence: how it works, what happens next.',
    category: 'content',
    sample: {
      type: 'steps',
      title: 'How it works.',
      steps: [
        { title: 'First step', body: 'What the customer does.' },
        { title: 'Second step', body: 'What happens next.' },
        { title: 'Third step', body: 'The result they get.' },
      ],
      ctas: [],
    },
  },
  {
    type: 'offers',
    label: 'Products or services',
    description: 'Cards for what you sell, with optional picture, price and button.',
    category: 'content',
    sample: {
      type: 'offers',
      title: 'What we offer.',
      columns: 3,
      items: [
        { title: 'First offer', body: 'Say what it is and who it is for.' },
        { title: 'Second offer', body: 'Say what it is and who it is for.' },
        { title: 'Third offer', body: 'Say what it is and who it is for.' },
      ],
    },
  },
  {
    type: 'gallery',
    label: 'Gallery',
    description: 'A grid of pictures with optional captions.',
    category: 'content',
    sample: {
      type: 'gallery',
      title: 'Our work.',
      columns: 3,
      images: [image('the first photo'), image('the second photo')],
    },
  },
  {
    type: 'team',
    label: 'Team',
    description: 'People behind the business, with photo, role and a short bio.',
    category: 'proof',
    sample: {
      type: 'team',
      title: 'Meet the team.',
      members: [{ name: '[Pending: name]', role: '[Pending: role]' }],
    },
  },
  {
    type: 'testimonial',
    label: 'Customer quote',
    description: 'One real quote, used with the customer’s permission.',
    category: 'proof',
    sample: {
      type: 'testimonial',
      quote: '[Pending: add a real customer quote]',
      name: '[Pending: customer name]',
      role: '[Pending: their role or company]',
    },
  },
  {
    type: 'pricingTable',
    label: 'Pricing',
    description: 'Up to 4 plans with price, features and a button.',
    category: 'convert',
    sample: {
      type: 'pricingTable',
      title: 'Simple pricing.',
      plans: [
        {
          name: 'Basic',
          price: '[Pending: price]',
          summary: 'For getting started.',
          features: ['First feature', 'Second feature'],
          cta: { label: 'Choose Basic', href: '#contact', variant: 'secondary' },
          highlight: false,
        },
        {
          name: 'Pro',
          price: '[Pending: price]',
          summary: 'For growing teams.',
          features: ['Everything in Basic', 'Third feature'],
          cta: { label: 'Choose Pro', href: '#contact', variant: 'primary' },
          highlight: true,
        },
      ],
    },
  },
  {
    type: 'comparisonTable',
    label: 'Comparison table',
    description: 'Compare plans or options feature by feature.',
    category: 'convert',
    sample: {
      type: 'comparisonTable',
      title: 'Compare options.',
      columns: [
        { name: 'Basic', highlight: false },
        { name: 'Pro', highlight: true },
      ],
      groups: [{ rows: [{ label: 'First feature', values: [true, true] }] }],
      yesLabel: 'Included',
      noLabel: 'Not included',
    },
  },
  {
    type: 'faq',
    label: 'Questions and answers',
    description: 'Up to 5 questions customers ask. Also helps search engines.',
    category: 'content',
    sample: {
      type: 'faq',
      title: 'Questions, answered.',
      items: [
        { q: 'A question customers often ask?', a: 'A short, direct answer in plain words.' },
      ],
    },
  },
  {
    type: 'ctaPanel',
    label: 'Call to action',
    description: 'The closing ask: a headline and one or two buttons.',
    category: 'convert',
    sample: {
      type: 'ctaPanel',
      title: 'Ready to start?',
      lede: 'Tell visitors what happens when they click.',
      ctas: [{ label: 'Contact us', href: '#contact', variant: 'primary' }],
    },
  },
  {
    type: 'contact',
    label: 'Contact details',
    description: 'Email, phone, address and opening hours.',
    category: 'info',
    sample: {
      type: 'contact',
      anchor: 'contact',
      title: 'Get in touch.',
      email: 'hello@example.com',
      hours: [],
      ctas: [],
      emailLabel: 'Email',
      phoneLabel: 'Phone',
      addressLabel: 'Address',
      hoursLabel: 'Opening hours',
    },
  },
  {
    type: 'richText',
    label: 'Text page',
    description: 'Long text: about us, policies, terms. Supports headings, lists and links.',
    category: 'info',
    sample: {
      type: 'richText',
      title: 'About us',
      body: '## Our story\n\n[Pending: write a few paragraphs]',
    },
  },
  {
    type: 'pageCards',
    label: 'Page links',
    description: 'Cards that link to your other pages.',
    category: 'info',
    sample: {
      type: 'pageCards',
      title: 'Explore',
      group: 'main',
      excludeCurrent: true,
      columns: 3,
      linkLabel: 'Learn more',
    },
  },
];

/** Sections the editor can add. `form` is left out until the forms service exists. */
export const catalogTypes = sectionCatalog.map((entry) => entry.type);
