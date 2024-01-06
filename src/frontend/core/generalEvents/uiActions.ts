import { Listener } from '../../util/eventListen.ts';
import { isInt } from '../../../shared/util/numberUtil.ts';
import {
  copyTextToClipboard,
  deleteQueryStringParameter,
  getHiddenElementBounds, getInputValue,
  setQueryStringParameter,
} from '../../util/domutil.ts';
import { modalService } from '../../util/modalService.ts';
import { getInputLanguage, getOutputLanguage } from '../userPreferences/siteLanguage.ts';
import { uuidv4 } from '../../../shared/util/uuidv4.ts';
import Cookies from 'js-cookie';
import { flashTippy } from '../../util/tooltipUtil.ts';
import { Marker } from '../../../shared/util/highlightMarker.ts';
import { highlightWikitextReplace } from '../ace/wikitextEditor.ts';
import { getSiteSearchMode } from '../userPreferences/siteSearchMode.ts';

function parseUiAction(actionEl: HTMLElement): UiAction[] {
  const actionStr = actionEl.getAttribute('ui-action');
  const result: UiAction[] = [];
  const actions = actionStr.split(';');
  for (let action of actions) {
    if (!action.includes(':')) {
      result.push({actionType: action.trim(), actionParams: []});
      continue;
    }
    const actionType = action.split(':')[0].trim().toLowerCase();
    const actionParams = action.split(':')[1].split(',').map(param => param.trim()).map(param => {
      if (param.startsWith('attr.')) {
        return actionEl.getAttribute(param.slice('attr.'.length));
      } else {
        return param;
      }
    });

    result.push({
      actionType,
      actionParams,
    });
  }
  return result;
}

export type UiAction = {actionType: string, actionParams: string[]};

export function runUiActions(actionEl: HTMLElement, actions: UiAction[]) {
  const qs = <T extends HTMLElement = HTMLElement>(selector: string): T =>
    (selector === 'this' || selector === 'self') ? (actionEl as T): document.querySelector<T>(selector);
  const qsAll = <T extends HTMLElement = HTMLElement>(selector: string): T[] =>
    (selector === 'this' || selector === 'self') ? ([actionEl as T]): Array.from(document.querySelectorAll<T>(selector));
  const normClassList = (cls: string): string[] => cls.split(/[\s.]+/g).filter(x => !!x);

  for (let action of actions) {
    let actionType = action.actionType;
    let actionParams = action.actionParams;

    switch (actionType) {
      // Misc Simple Actions
      // ----------------------------------------------------------------------------------------------------
      case 'refresh-page': {
        window.location.reload();
        break;
      }
      case 'close-modal':
      case 'close-modals': {
        modalService.closeAll();
        break;
      }

      // ClassList Actions
      // ----------------------------------------------------------------------------------------------------
      case 'add-class': {
        let addClassTarget = qs(actionParams[0]);
        if (addClassTarget) {
          for (let cls of actionParams.slice(1)) {
            addClassTarget.classList.add(... normClassList(cls));
          }
        }
        break;
      }
      case 'remove-class': {
        let removeClassTarget = qs(actionParams[0]);
        if (removeClassTarget) {
          for (let cls of actionParams.slice(1)) {
            removeClassTarget.classList.remove(... normClassList(cls));
          }
        }
        break;
      }
      case 'toggle-class': {
        let toggleClassTarget = qs(actionParams[0]);
        if (toggleClassTarget) {
          for (let cls of actionParams.slice(1)) {
            for (let cls2 of normClassList(cls)) {
              toggleClassTarget.classList.toggle(cls2);
            }
          }
        }
        break;
      }

      // Show/Hide/Toggle Elements
      // ----------------------------------------------------------------------------------------------------
      case 'show': {
        let showEase = 0;
        if (isInt(actionParams[0])) {
          showEase = parseInt(actionParams[0]);
          actionParams = actionParams.slice(1);
        }
        for (let selector of actionParams) {
          const showTarget = qs(selector);
          if (showTarget) {
            showTarget.classList.remove('hide');
            setTimeout(() => {
              showTarget.classList.add('active');
            }, showEase);
          }
        }
        break;
      }
      case 'hide': {
        let hideEase = 0;
        if (isInt(actionParams[0])) {
          hideEase = parseInt(actionParams[0]);
          actionParams = actionParams.slice(1);
        }
        for (let selector of actionParams) {
          const hideTarget = qs(selector);
          if (hideTarget) {
            hideTarget.classList.remove('active');
            setTimeout(() => {
              hideTarget.classList.add('hide');
            }, hideEase);
          }
        }
        break;
      }
      case 'toggle': {
        let toggleEase = 0;
        if (isInt(actionParams[0])) {
          toggleEase = parseInt(actionParams[0]);
          actionParams = actionParams.slice(1);
        }
        for (let selector of actionParams) {
          const toggleTarget = qs(selector);
          if (toggleTarget) {
            (<any> toggleTarget)._toggledBy = actionEl;

            if (toggleTarget.classList.contains('hide')) {
              toggleTarget.classList.remove('hide');
              setTimeout(() => {
                toggleTarget.classList.add('active');
                actionEl.classList.add('active');
              }, toggleEase);
            } else {
              toggleTarget.classList.remove('active');
              actionEl.classList.remove('active');
              setTimeout(() => {
                toggleTarget.classList.add('hide');
              }, toggleEase);
            }
          }
        }
        break;
      }

      // Dropdown Actions
      // ----------------------------------------------------------------------------------------------------
      case 'toggle-dropdown':
      case 'dropdown': {
        const dropdown = qs(actionParams[0]);
        const bounds = getHiddenElementBounds(dropdown);
        const actionElPosX = actionEl.getBoundingClientRect().left;
        const posRight: boolean = dropdown.classList.contains('right');

        if (posRight || actionElPosX + bounds.width > window.innerWidth) {
          dropdown.style.left = 'auto';
          dropdown.style.right = '0';
          dropdown.style.transformOrigin = 'right top';
        } else {
          dropdown.style.left = '0';
          dropdown.style.right = 'auto';
          dropdown.style.transformOrigin = 'left top';
        }

        if (dropdown) {
          (<any> dropdown)._toggledBy = actionEl;
          if (dropdown.classList.contains('active')) {
            dropdown.classList.remove('active');
            actionEl.classList.remove('active');
            setTimeout(() => dropdown.classList.add('hide'), 110);
          } else {
            dropdown.classList.remove('hide');
            setTimeout(() => {
              dropdown.classList.add('active');
              actionEl.classList.add('active');
            });
          }
        }
        break;
      }
      case 'dropdown-close':
      case 'close-dropdown':
      case 'close-dropdowns': {
        qsAll('.ui-dropdown.active').forEach(dropdownEl => {
          const toggledBy = (<any> dropdownEl)._toggledBy;
          dropdownEl.classList.remove('active');
          if (toggledBy) {
            toggledBy.classList.remove('active');
          }
          setTimeout(() => dropdownEl.classList.add('hide'), 110);
        });
        break;
      }

      // Copy Actions
      // ----------------------------------------------------------------------------------------------------
      case 'copy': {
        let copyTarget = qs(actionParams[0]);

        if ((<any> copyTarget).value) {
          // noinspection JSIgnoredPromiseFromCall
          copyTextToClipboard((<any> copyTarget).value.trim());
        } else if (copyTarget.hasAttribute('contenteditable')) {
          if (copyTarget.querySelector('.ace_static_text_layer')) {
            copyTarget = copyTarget.querySelector('.ace_static_text_layer');
          }
          // noinspection JSIgnoredPromiseFromCall
          copyTextToClipboard(copyTarget.textContent.trim());
        } else {
          // noinspection JSIgnoredPromiseFromCall
          copyTextToClipboard(copyTarget.textContent.trim());
        }
        break;
      }
      case 'copy-all': {
        let copyTargets: HTMLInputElement[] = actionParams.map(sel => qsAll<HTMLInputElement>(sel)).flat(Infinity) as HTMLInputElement[];
        let combinedValues: string[] = [];
        let sep = actions.find(a => a.actionType === 'copy-sep')?.actionParams?.[0].replace(/\\n/g, '\n') || '\n';
        if (copyTargets) {
          for (let copyTarget of copyTargets) {
            if ((<any> copyTarget).value) {
              combinedValues.push(copyTarget.value.trim());
            } else if (copyTarget.hasAttribute('contenteditable')) {
              if (copyTarget.querySelector('.ace_static_text_layer')) {
                copyTarget = copyTarget.querySelector('.ace_static_text_layer');
              }
              console.log('Copy target', copyTarget);
              combinedValues.push(copyTarget.textContent.trim());
            } else {
              combinedValues.push(copyTarget.textContent.trim());
            }
          }
          // noinspection JSIgnoredPromiseFromCall
          copyTextToClipboard(combinedValues.join(sep));
        }
        break;
      }

      // Tabs Action
      // ----------------------------------------------------------------------------------------------------
      case 'tab': {
        const tabpanel = qs(actionParams[0]);
        const tabgroup = actionParams[1];
        if (tabpanel) {
          tabpanel.classList.remove('hide');
          tabpanel.classList.add('active');
          actionEl.classList.add('active');
        }
        let otherTabEls = qsAll<HTMLElement>('[ui-action*="tab:"]');
        for (let otherTabEl of otherTabEls) {
          let otherTabActions = parseUiAction(otherTabEl);
          for (let otherTabAction of otherTabActions.filter(x => x.actionType === 'tab')) {
            if (otherTabAction.actionParams[1] == tabgroup && otherTabAction.actionParams[0] !== actionParams[0]) {
              otherTabEl.classList.remove('active');
              const otherTabPanel = qs(otherTabAction.actionParams[0]);
              if (otherTabPanel) {
                otherTabPanel.classList.remove('active');
                otherTabPanel.classList.add('hide');
              }
            }
          }
        }
        break;
      }

      // Set Query Parameter
      // ----------------------------------------------------------------------------------------------------
      case 'set-query-param': {
        const kvPairs: string[] = actionParams.map(x => x.split('&')).flat(Infinity) as string[];
        for (let kvPair of kvPairs) {
          let key = kvPair.split('=')[0];
          let value = kvPair.split('=')[1];
          setQueryStringParameter(key, value);
        }
        break;
      }
      case 'delete-query-param': {
        for (let key of actionParams) {
          deleteQueryStringParameter(key);
        }
        break;
      }

      // Copy Pref Link
      // ----------------------------------------------------------------------------------------------------
      case 'copy-pref-link': {
        const params = new URLSearchParams(window.location.search);

        params.set('input', getInputLanguage());
        params.set('output', getOutputLanguage());
        params.set('searchMode', getSiteSearchMode());

        const newUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}?${params.toString()}`;
        copyTextToClipboard(newUrl);
        break;
      }

      // Expando
      // ----------------------------------------------------------------------------------------------------
      case 'expando': {
        const animId = uuidv4();
        const container = qs(actionParams[0]);

        const inTransition = container.classList.contains('collapsing') || container.classList.contains('expanding');
        if (inTransition) {
          return;
        }

        if (container.classList.contains('collapsed')) {
          actionEl.classList.remove('expand-action');
          actionEl.classList.add('collapse-action');

          actionEl.classList.add('expanded-state');
          actionEl.classList.remove('collapsed-state');

          container.classList.remove('hide');

          let height;
          if (container.hasAttribute('data-original-height')) {
            // Use data-original-height (if it exists)
            height = parseInt(container.getAttribute('data-original-height'));
            container.removeAttribute('data-original-height');
          } else {
            // Otherwise use scrollHeight, which should be approximately correct.
            height = container.scrollHeight;
          }
          const styleEl = document.createElement('style');
          const duration = Math.min(500, Math.max(200, height / 5 | 0));

          styleEl.textContent = `
                .expanding-${animId} { overflow: hidden; animation: expanding-${animId} ${duration}ms ease forwards; }
                @keyframes expanding-${animId} { 100% { height: ${height}px; } }
              `;
          container.style.height = '0';
          container.style.overflow = 'hidden';

          document.head.append(styleEl);
          container.classList.remove('collapsed');
          container.classList.add('expanding', 'expanding-' + animId);
          setTimeout(() => {
            container.style.removeProperty('height');
            container.style.removeProperty('overflow');
            container.classList.add('expanded');
            container.classList.remove('expanding', 'expanding-' + animId);
            styleEl.remove();
          }, duration);
        } else {
          actionEl.classList.add('expand-action');
          actionEl.classList.remove('collapse-action');

          actionEl.classList.remove('expanded-state');
          actionEl.classList.add('collapsed-state');

          const styleEl = document.createElement('style');
          const height = container.getBoundingClientRect().height;
          const duration = Math.min(500, Math.max(200, height / 5 | 0));
          container.setAttribute('data-original-height', String(height));

          styleEl.textContent = `
                .collapsing-${animId} { overflow: hidden; animation: collapsing-${animId} ${duration}ms ease forwards; }
                @keyframes collapsing-${animId} { 100% { height: 0; } }
              `;
          container.style.height = height + 'px';
          container.style.overflow = 'hidden';

          document.head.append(styleEl);
          container.classList.remove('expanded');
          container.classList.add('collapsing', 'collapsing-' + animId);
          setTimeout(() => {
            container.style.removeProperty('height');
            container.style.removeProperty('overflow');
            container.classList.add('collapsed');
            container.classList.remove('collapsing', 'collapsing-' + animId);
            styleEl.remove();
            setTimeout(() => {
              container.classList.add('hide');
            });
          }, duration);
        }

        break;
      }

      // Cookie Actions
      // ----------------------------------------------------------------------------------------------------
      case 'set-cookie': {
        Cookies.set(actionParams[0].trim(), actionParams[1].trim(), { expires: 365 });
        break;
      }
      case 'remove-cookie':
      case 'delete-cookie': {
        Cookies.remove(actionParams[0].trim());
        break;
      }

      // Lazy Image Click
      // ----------------------------------------------------------------------------------------------------
      case 'lazy-image-click': {
        let a = document.createElement('a');
        a.classList.add('image-loaded');
        a.href = actionEl.getAttribute('data-src');
        a.target = '_blank';

        let div = document.createElement('div');

        let img = document.createElement('img');
        img.src = actionEl.getAttribute('data-src');
        img.style.maxWidth = '100%';

        if (a.hasAttribute('data-name')) {
          a.setAttribute('data-name', decodeURIComponent(a.getAttribute('data-name')));
        } else {
          a.setAttribute('data-name', decodeURIComponent(img.src.split('/').reverse()[0]));
        }

        div.append(img);
        a.append(div);

        actionEl.replaceWith(a);
        break;
      }

      // Wikitext Indent
      // ----------------------------------------------------------------------------------------------------
      case 'wikitext-indent': {
        if (actionParams[1] !== 'increase' && actionParams[1] !== 'decrease') {
          return;
        }
        const contentEditableEl: HTMLElement = qs(actionParams[0]);
        const indentAction: 'increase' | 'decrease' = actionParams[1];
        let lines: string[] = getInputValue(contentEditableEl).split(/\n/g);

        const lowestIndent = Math.min(... lines.filter(line => line.startsWith(':')).map(line => {
          let indent: string = /^:*/.exec(line)[0];
          return indent.length;
        }));

        if (lowestIndent === 1 && indentAction === 'decrease') {
          flashTippy(actionEl, {content: 'Cannot decrease indent any further.'});
          return;
        }

        if (contentEditableEl.hasAttribute('data-markers')) {
          const markers = Marker.fromJoinedString(contentEditableEl.getAttribute('data-markers'));
          markers.filter(m => !m.fullLine).forEach(m => {
            if (indentAction === 'decrease') {
              m.startCol--;
              m.endCol--;
            } else {
              m.startCol++;
              m.endCol++;
            }
          });
          contentEditableEl.setAttribute('data-markers', Marker.joinedString(markers));
        }

        lines = lines.map(line => {
          if (!line.startsWith(':')) {
            return line;
          }
          if (indentAction === 'decrease') {
            line = line.slice(1);
          } else {
            line = ':' + line;
          }
          return line;
        });
        highlightWikitextReplace(contentEditableEl, lines.join('\n').trim());
        break;
      }
      default:
        break;
    }
  }
}

export const UIActionListener: Listener = {
  selector: document,
  event: 'click',
  handle: function(e: Event) {
    const target: HTMLElement = e.target as HTMLElement;
    const actionEl: HTMLElement = target.closest<HTMLElement>('[ui-action]');

    closeMobileMenuIfDefocused(target);
    closeDropdownsIfDefocused(target);

    if (actionEl) {
      runUiActions(actionEl, parseUiAction(actionEl));
    }
  },
};

function closeMobileMenuIfDefocused(target: HTMLElement) {
  if (!target.closest('#mobile-menu') && !target.closest('#mobile-menu-trigger')
    && document.querySelector('#mobile-menu').classList.contains('active')) {
    document.querySelector<HTMLButtonElement>('#mobile-menu-trigger button').click();
  }
}

/**
 * Close all dropdowns that the user did not click inside.
 * @param target The clicked element
 */
function closeDropdownsIfDefocused(target: HTMLElement) {
  // See if the user clicked inside a dropdown:
  const parentDropdownEl: HTMLElement = target.closest<HTMLElement>('.ui-dropdown');

  // Loop through all open dropdowns:
  document.querySelectorAll<HTMLElement>('.ui-dropdown.active').forEach(dropdownEl => {
    // If we clicked inside the dropdown, don't close it.
    if (dropdownEl === parentDropdownEl) {
      return;
    }

    const toggledBy = (<any> dropdownEl)._toggledBy;

    // If we clicked inside the trigger for the dropdown, don't close it.
    if (toggledBy && (toggledBy === target || toggledBy.contains(target))) {
      return;
    }

    dropdownEl.classList.remove('active');
    if (toggledBy) {
      toggledBy.classList.remove('active');
    }
    setTimeout(() => dropdownEl.classList.add('hide'), 110);
  });
}
