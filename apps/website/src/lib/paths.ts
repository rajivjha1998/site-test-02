/** The catch-all route's `slug` param for a path (undefined for the home page). */
export function slugFromPath(path: string): string | undefined {
  const slug = path.replace(/^\/|\/$/g, '');
  return slug === '' ? undefined : slug;
}
