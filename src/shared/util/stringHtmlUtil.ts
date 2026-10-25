import { isUnset } from './genericUtil.ts';

const entityMap = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  '\'': '&#39;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

/**
 * Escapes HTML special characters in a string to prevent XSS attacks.
 * @param html The string to escape.
 * @returns The escaped string with HTML entities.
 */
export function escapeHtml(html: any) {
  return String(html).replace(/[&<>"'`=\/]/g, s => entityMap[s]);
}

/**
 * Escape HTML but allow HTML entities like &mdash;
 * @param html
 */
export function escapeHtmlAllowEntities(html: string) {
  // same as escapeHtml but without '&'
  return String(html).replace(/[<>"'`=\/]/g, s => entityMap[s]);
}

export function toParam(x: any): string {
  if (isUnset(x)) {
    return '';
  }
  return encodeURIComponent(String(x).replace(/ /g, '_'));
}

export function fromParam(param: string): string {
  if (isUnset(param)) {
    return '';
  }
  return decodeURIComponent(param).replace(/_/g, ' ');
}

export function paramCmp(a: any, b: any) {
  if (a === b) {
    return true;
  }
  return String(a).trim().toLowerCase().replace(/_/g, ' ') === String(b).trim().toLowerCase().replace(/_/g, ' ');
}

const htmlIdCache = new Map<string, string>();

/**
 * Converts any string into a valid HTML ID by sanitizing it and appending a hash to ensure uniqueness.
 *
 * Guaranteed to not collide with other different strings, even if they sanitize to the same base string.
 *
 * @param input The input string to convert.
 * @returns A valid HTML ID string.
 */
export function toHtmlId(input: string): string {
  // Return from cache if already computed
  const cached = htmlIdCache.get(input);
  if (cached) return cached;

  // Simple but reliable non-crypto hash (FNV-1a variant)
  let hash = 2166136261; // Constant from FNV-1a hash algorithm (offset basis)
  for (const ch of input) {
    hash ^= ch.codePointAt(0)!;
    hash = Math.imul(hash, 16777619); // Constant from FNV-1a hash algorithm (FNV prime)
  }
  const hashStr = (hash >>> 0).toString(36); // unsigned & compact

  // Sanitize base for HTML ID
  const base = input
    .normalize('NFKD')                      // handle Unicode safely
    .replace(/[^\w\-:.]+/g, '-')            // valid HTML id chars only
    .replace(/^-+|-+$/g, '')                // trim dashes
    .toLowerCase();

  // Ensure starts with a letter
  const safeBase = /^[a-z]/.test(base) ? base : 'id-' + base;

  const result = `${safeBase || 'id'}-${hashStr}`;

  // Cache the result
  htmlIdCache.set(input, result);
  return result;
}

export function replaceBasePathInUrl(
  url: string,
  replacer: (basePath: string) => string,
): string {
  const parsed = new URL(url);
  const { pathname } = parsed;

  // first path segment only
  const match = pathname.match(/^\/[^/]+/);
  if (!match) return url;

  const basePath = match[0];
  const replacement = replacer(basePath);

  if (replacement === basePath) return url;

  parsed.pathname = replacement + pathname.slice(basePath.length);
  return parsed.toString();
}
