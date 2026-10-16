import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { imageSize } from 'image-size';
import { assetsDir } from './assets';

const IMAGE_SRC =
  /^((?!.*\.\.)(?!.*\/\/)assets\/[A-Za-z0-9._/-]+\.(svg|png|jpe?g|webp|avif)|https:\/\/\S+)$/;

/**
 * Every image the content uses: any `{ src, alt }` object whose `src` is a valid image source.
 * Walks the whole site so new sections with images need no changes here.
 */
export function collectImageSrcs(value: unknown, found = new Set<string>()): Set<string> {
  if (Array.isArray(value)) {
    for (const item of value) collectImageSrcs(item, found);
  } else if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (
      typeof record.src === 'string' &&
      typeof record.alt === 'string' &&
      IMAGE_SRC.test(record.src)
    ) {
      found.add(record.src);
    }
    for (const child of Object.values(record)) collectImageSrcs(child, found);
  }
  return found;
}

export interface ImageSize {
  width?: number;
  height?: number;
}

/**
 * Size of every `assets/` image, read from the files so pages reserve the right space while
 * images load. A missing file fails the build with its name; https images have no known size.
 */
export function readImageSizes(
  srcs: Iterable<string>,
  dir: string = assetsDir(),
): Record<string, ImageSize> {
  const sizes: Record<string, ImageSize> = {};
  for (const src of srcs) {
    if (!src.startsWith('assets/')) {
      sizes[src] = {};
      continue;
    }
    let bytes: Buffer;
    try {
      bytes = readFileSync(join(dir, src.slice('assets/'.length)));
    } catch {
      throw new Error(`Image "${src}" is used in site.json but the file is not in assets/.`);
    }
    try {
      const { width, height } = imageSize(bytes);
      sizes[src] = { width, height };
    } catch {
      throw new Error(
        `Image "${src}" could not be read. Is it a valid PNG, JPEG, WebP, AVIF or SVG?`,
      );
    }
  }
  return sizes;
}
