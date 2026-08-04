import { SiteUser } from '../../shared/types/site/site-user-types.ts';
import { Request } from 'express';

/**
 * ThinRequest is a minimal, request-scoped snapshot of an incoming HTTP request,
 * intended for use outside the Express routing layer (e.g. Vue SSR rendering).
 *
 * Why this exists:
 * ----------------
 * The Express `Request` object is large, mutable, and tightly coupled to the
 * underlying HTTP server implementation. Passing it through application,
 * rendering, or view layers retains a broad object graph for the lifetime of
 * the request and encourages deep coupling to transport-specific details.
 *
 * ThinRequest avoids those issues by:
 * - Copying only the request data that is safe and relevant beyond routing
 * - Avoiding retention of the Express `Request` object and its internals
 * - Providing a stable, framework-agnostic API for request-derived values
 * - Making request context explicit without relying on ambient globals
 *
 * Design guarantees:
 * ------------------
 * - Contains no references to Express `Request` or `Response`
 * - Safe to pass through Vue server-side rendering without extending lifetimes
 * - Compatible with concurrent renders in a single Node process
 * - Read-only by convention (and may be frozen by the caller)
 *
 * ThinRequest represents *what the application needs to know* about a request,
 * not *how the request was received*, keeping rendering logic decoupled from
 * HTTP transport concerns.
 */
export interface ThinRequest {
  user: SiteUser;
  query: Record<string, unknown>;
  cookies: Record<string, any>;
  url: string;
  path: string;
  originalUrl: string;
  method: string;

  isAuthenticated(): boolean;
}

export function createThinRequest(req: Request): ThinRequest {
  const authenticated =
    typeof req.isAuthenticated === 'function'
      ? req.isAuthenticated()
      : false;

  return {
    user: req.user,
    query: { ...req.query },
    cookies: req.cookies ? { ...req.cookies } : {},
    url: req.url,
    path: req.path,
    originalUrl: req.originalUrl,
    method: req.method,

    isAuthenticated() {
      return authenticated;
    },
  };
}
