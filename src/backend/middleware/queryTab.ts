import { Request } from '../util/router';

export function queryTab(req: Request, defaultTab: string, ... otherTabs: string[]): string {
  const validTabs = new Set([defaultTab, ... otherTabs]);

  if (typeof req.query.tab === 'string') {
    if (!validTabs.has(req.query.tab)) {
      req.query.tab = defaultTab;
    }

    if (!req.query.tab) {
      req.query.tab = defaultTab;
    }

    return req.query.tab;
  } else {
    return defaultTab;
  }
}