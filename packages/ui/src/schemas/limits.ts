/**
 * Size limits of a site. They exist because every save travels as one GitHub request
 * (about 65,000 characters) and because the editor keeps the whole file in memory.
 * `maxBytes` must equal `maxBytes` in site-builder.files.json (checked by a test).
 */
export const SITE_LIMITS = {
  /** Pages in `pages`. */
  maxPages: 8,
  /** Size of site.json in bytes (60 KB). */
  maxBytes: 61440,
} as const;

/** Image used by sample content. It must be replaced before publishing (see check-publish). */
export const PLACEHOLDER_IMAGE = 'assets/placeholder.svg';

/** Marker for text that still needs a real value. Blocks publishing until replaced. */
export const PENDING_MARKER = '[Pending:';
