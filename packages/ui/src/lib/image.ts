import { withBase } from './href';
import type { RenderContext } from './resolve';

/** An image ready to render: final address plus the size read at build time (if known). */
export interface ResolvedImage {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

/** A content object with its `image` swapped for a ResolvedImage. */
export type WithResolvedImage<T, K extends string = 'image'> = Omit<T, K> & {
  [P in K]?: ResolvedImage;
};

/**
 * `assets/hero.webp` → `<base>/assets/hero.webp`, https addresses unchanged. Width and height
 * come from the file so the page doesn't jump while images load.
 */
export function resolveImage(
  image: { src: string; alt: string },
  ctx: Pick<RenderContext, 'images'>,
): ResolvedImage {
  const size = ctx.images[image.src] ?? {};
  const src = image.src.startsWith('assets/') ? withBase(`/${image.src}`) : image.src;
  return { src, alt: image.alt, ...size };
}

/** Resolve an optional `image` field on any content object. */
export function withImage<T extends { image?: { src: string; alt: string } }>(
  item: T,
  ctx: Pick<RenderContext, 'images'>,
): WithResolvedImage<T> {
  const { image, ...rest } = item;
  return { ...rest, ...(image ? { image: resolveImage(image, ctx) } : {}) } as WithResolvedImage<T>;
}
