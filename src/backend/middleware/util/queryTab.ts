import { Request } from 'express';

export function queryTab(req: Request, defaultTab: string, ... otherTabs: string[]): string {
  return queryOption(req, 'tab', defaultTab, ... otherTabs);
}

export function queryOption<T extends string = string>(req: Request, prop: string, defaultOption: T, ... otherOptions: T[]): string {
  const validOptions: Set<T> = new Set([defaultOption, ... otherOptions]);

  if (typeof req.query[prop] === 'string') {
    if (!validOptions.has(req.query[prop] as T)) {
      req.query[prop] = defaultOption;
    }

    if (!req.query[prop]) {
      req.query[prop] = defaultOption;
    }

    return req.query[prop] as T;
  } else {
    return defaultOption;
  }
}

export function paramOption<T extends string = string>(req: Request, prop: string, defaultOption: T, ... otherOptions: T[]): T {
  const validOptions: Set<T> = new Set([defaultOption, ... otherOptions]);

  if (typeof req.params[prop] === 'string') {
    if (!validOptions.has(req.params[prop] as T)) {
      req.params[prop] = defaultOption;
    }

    if (!req.params[prop]) {
      req.params[prop] = defaultOption;
    }

    return req.params[prop] as T;
  } else {
    return defaultOption;
  }
}