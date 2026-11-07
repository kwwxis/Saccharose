import { AsyncLocalStorage } from 'node:async_hooks';
import { NextFunction, Request, Response } from 'express';

export type RequestTraceInfo = {
  method: string,
  url: string, // full URL including query string
};

const requestTraceStorage = new AsyncLocalStorage<RequestTraceInfo>();

/**
 * Middleware that stores basic info about the current request (method + full URL, including query string)
 * in an `AsyncLocalStorage`, so it can be retrieved later from anywhere in the async call chain handling this
 * request -- even from code that has no direct access to the Express `req` object (e.g. deeply-nested utility
 * functions such as shell invocations, cache helpers, etc.)
 *
 * This should be registered as early as possible in the middleware chain (before any other middleware/router)
 * so that it wraps as much of the request-handling code as possible.
 */
export function requestTraceStoreMiddleware(req: Request, _res: Response, next: NextFunction): void {
  requestTraceStorage.run({ method: req.method, url: req.originalUrl || req.url }, next);
}

/**
 * Gets info about the current request (method + full URL, including query string), if this code is currently
 * running within the async call chain of an HTTP request. Returns `undefined` if there's no active request
 * context (e.g. for autonomous/background tasks not triggered by an HTTP request, such as scheduled jobs or
 * importer scripts).
 */
export function getCurrentRequestTrace(): RequestTraceInfo | undefined {
  return requestTraceStorage.getStore();
}

/**
 * Formats the given request's method + full URL (including query string) for inclusion in log/error output.
 * Prefer this over {@link formatCurrentRequestTrace} when a `req` object is directly available.
 */
export function formatRequestInfo(req: { method: string, originalUrl?: string, url: string }): string {
  return `${req.method} ${req.originalUrl || req.url}`;
}

/**
 * Formats the current request's method + full URL (including query string) for inclusion in log/error output,
 * using the `AsyncLocalStorage`-tracked request info. Returns a placeholder string if there's no active request
 * context (i.e. this code isn't running as part of handling an HTTP request).
 */
export function formatCurrentRequestTrace(): string {
  const info = getCurrentRequestTrace();
  return info ? formatRequestInfo({ method: info.method, url: info.url }) : 'no active HTTP request';
}
