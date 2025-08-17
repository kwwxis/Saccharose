import { Request } from 'express';

export function queryTab<Default extends string, Others extends string[]>(
  req: Request,
  defaultTab: Default,
  ... otherTabs: Others
): Default | Others[number] {
  return queryOption<Default, Others>(req, 'tab', defaultTab, ... otherTabs);
}

export function queryOption<Default extends string, Others extends string[]>(
  req: Request,
  prop: string,
  defaultOption: Default,
  ... otherOptions: Others
): Default | Others[number] {
  const validOptions: Set<Default | Others[number]> = new Set([defaultOption, ... otherOptions]);

  if (typeof req.query[prop] === 'string') {
    if (!validOptions.has(req.query[prop] as Default | Others[number])) {
      req.query[prop] = defaultOption;
    }

    if (!req.query[prop]) {
      req.query[prop] = defaultOption;
    }

    return req.query[prop] as Default | Others[number];
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
