import { SITE_MODE_WIKI_DOMAIN } from '../../userPreferences/siteMode.ts';
import { escapeHtml, fromParam, toParam, ucFirst } from '../../../../shared/util/stringUtil.ts';
import { getSiblingsOfSameClass, hasSelection } from '../../../util/domutil.ts';
import { listen, runWhenDOMContentLoaded } from '../../../util/eventListen.ts';
import { defaultMap } from '../../../../shared/util/genericUtil.ts';
import { AceTooltip, createAceTooltip, determineTooltipPlacement } from '../aceTooltips.ts';

// noinspection JSDeprecatedSymbols
const isMac: boolean = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

let didInitialSetup = false;

function initialSetup() {
  if (didInitialSetup) {
    return;
  }
  didInitialSetup = true;

  runWhenDOMContentLoaded(() => {
    listen([
      {
        selector: document,
        event: 'click',
        handle(event: MouseEvent) {
          if (!(event.ctrlKey || event.metaKey || event.altKey) || !event.target || typeof event.target['closest'] !== 'function') {
            return;
          }

          let target: HTMLElement = event.target as HTMLElement;
          let token = target.closest('.ace_template-name, .ace_link-name');

          if (token) {
            const url = token.getAttribute('data-href');
            if (url) {
              window.open(url, '_blank');
            }
          }
        },
      }
    ]);
  });
}


function configureClickableToken(initialToken: HTMLElement): void {
  let linkPrefix: string;
  let tooltipType: string;
  let tokenClass: string;

  if (initialToken.classList.contains('ace_template-name')) {
    linkPrefix = 'Template:';
    tooltipType = 'template';
    tokenClass = 'ace_template-name';
  } else if (initialToken.classList.contains('ace_link-name')) {
    linkPrefix = '';
    tooltipType = 'link';
    tokenClass = 'ace_link-name';
  } else {
    throw 'Unsupported token type';
  }

  const tokens: HTMLElement[] = getSiblingsOfSameClass(initialToken, tokenClass) as HTMLElement[];
  const pageName: string = tokens.map(tok => fromParam(tok.innerText)).join('');
  const pageUrl: string = `https://${SITE_MODE_WIKI_DOMAIN}/wiki/${linkPrefix}${toParam(ucFirst(pageName))}`;

  const tooltip: AceTooltip = createAceTooltip({
    tooltipType,
    tooltipHtml: `<span>${isMac ? 'Command' : 'Ctrl'}-click to open in new tab (alt-click to focus)</span><br />` +
      `<a>${escapeHtml(pageUrl)}</a>`
  })

  for (let involvedToken of tokens) {
    involvedToken.setAttribute('data-href', pageUrl);

    involvedToken.addEventListener('mouseenter', () => {
      if (hasSelection())
        return;
      tokens.forEach(el => el.classList.add('hovered'));
      tooltip.showAt(involvedToken, tokenClass);
    });

    involvedToken.addEventListener('mouseleave', () => {
      tokens.forEach(el => el.classList.remove('hovered'));
      tooltip.hide();
    });
  }
}

function isClickableTokenConfigured(token: HTMLElement) {
  return token.hasAttribute('data-href');
}

export function applyWikitextClickableLinks(element: HTMLElement) {
  initialSetup();
  element.querySelectorAll('.ace_template-name, .ace_link-name').forEach((el: HTMLElement) => {
    if (!isClickableTokenConfigured(el)) {
      configureClickableToken(el);
    }
  });
}
