/** CORS headers for a request, allowing only the listed site origins. */
export function corsHeaders(requestOrigin: string | null, allowed: string): Record<string, string> {
  const origins = allowed
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  if (!requestOrigin || !origins.includes(requestOrigin)) return {};
  return {
    'Access-Control-Allow-Origin': requestOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Accept, Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}
