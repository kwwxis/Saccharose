import { isElement } from '../../util/domutil.ts';
import { replaceBasePathInUrl } from '../../../shared/util/stringUtil.ts';
import { getDefaultBasePathForSiteMode, getSiteModeFromPath } from '../../../shared/types/site/site-mode-type.ts';
import { USER_PREFS } from '../userPreferences/sitePrefsContainer.ts';

export function enableSiteModePreferredBasePathAdjuster() {
  document.querySelectorAll('a').forEach(a => handleAnchor(a));

  const observer = new MutationObserver((mutationsList, observer) => {
    for (const mutation of mutationsList) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        for (const node of Array.from(mutation.addedNodes)) {
          if (isElement(node)) {
            // Check if the added node is an 'a' element or contains 'a' elements
            if (node.tagName === 'A') {
              handleAnchor(node as HTMLAnchorElement);
            } else if (node.querySelectorAll) {
              // Check for 'a' elements within the added node (e.g., if a whole div was added)
              node.querySelectorAll('a').forEach(anchor => {
                console.log('Found new <a> element inside an added node:', anchor);
                handleAnchor(anchor);
              });
            }
          }
        }
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

export function handleAnchor(a: HTMLAnchorElement) {
  if (!a.href || a.href.startsWith('#') || a.href.startsWith('javascript:')) {
    return;
  }
  try {
    const anchorSiteMode = getSiteModeFromPath(new URL(a.href).pathname);
    if (anchorSiteMode === 'unset') {
      return;
    }
    a.href = replaceBasePathInUrl(a.href, _currentBasePath => {
      return USER_PREFS?.preferredBasePaths?.[anchorSiteMode] || getDefaultBasePathForSiteMode(anchorSiteMode);
    });
  } catch (ignore) {}
}
