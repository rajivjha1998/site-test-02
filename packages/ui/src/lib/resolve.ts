import type { Media } from '../schemas/common';
import type { Screen } from '../schemas/screen';
import type { FormDefinition } from '../schemas/form';
import type { PageCard } from '../schemas/page';

/** Everything a section may need beyond its own content. Built once per page by the site. */
export interface RenderContext {
  screens: Record<string, Screen>;
  /** Size of every image used on the site, keyed by its `src`, read at build time. */
  images: Record<string, { width?: number; height?: number }>;
  forms: Record<string, FormDefinition>;
  cards: PageCard[];
  currentPath: string;
  turnstileSiteKey?: string;
  /**
   * Where form submissions go when the site is hosted statically (e.g. GitHub Pages): the
   * origin of the forms worker. Unset = same-site `/api/...` (Cloudflare Pages Functions).
   */
  formsOrigin?: string;
}

export interface ResolvedMediaData {
  screens: { label: string; screen: Screen }[];
  caption: string;
  autoplay: boolean;
}

/** Swap screen ids for screen data; an unknown id fails the build with the id and page. */
export function resolveMedia(media: Media, ctx: RenderContext): ResolvedMediaData {
  return {
    caption: media.caption,
    autoplay: media.autoplay,
    screens: media.screens.map(({ label, screen }) => {
      const data = ctx.screens[screen];
      if (!data) throw new Error(`Unknown screen "${screen}" on ${ctx.currentPath}`);
      return { label, screen: data };
    }),
  };
}

export function resolveForm(id: string, ctx: RenderContext): FormDefinition {
  const form = ctx.forms[id];
  if (!form) throw new Error(`Unknown form "${id}" on ${ctx.currentPath}`);
  return form;
}
