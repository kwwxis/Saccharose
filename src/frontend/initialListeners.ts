import axios from 'axios';
import Cookies from 'js-cookie';
import {
  copyToClipboard,
  getScrollbarWidth,
  hashFlash,
  setQueryStringParameter,
} from './util/domutil';
import { humanTiming, timeConvert } from '../shared/util/genericUtil';
import { closeDialog } from './util/dialog';
import { enableTippy, flashTippy, getTippyOpts, hideTippy, showTippy } from './util/tooltips';
import { Listener, runWhenDOMContentLoaded, startListeners } from './util/eventLoader';
import { showJavascriptErrorDialog } from './util/errorHandler';
import autosize from 'autosize';
import { isInt } from '../shared/util/numberUtil';
import { uuidv4 } from '../shared/util/stringUtil';
import { highlightReplace, highlightWikitextReplace } from './util/ace/wikitextEditor';

type UiAction = {actionType: string, actionParams: string[]};

function parseUiAction(actionStr: string|HTMLElement): UiAction[] {
  if (actionStr instanceof HTMLElement) {
    actionStr = actionStr.getAttribute('ui-action');
  }
  const result: UiAction[] = [];
  const actions = actionStr.split(';');
  for (let action of actions) {
    if (!action.includes(':')) {
      result.push({actionType: action.trim(), actionParams: []});
      continue;
    }
    const actionType = action.split(':')[0].trim().toLowerCase();
    result.push({
      actionType,
      actionParams: action.split(':')[1].split(',').map(x => x.trim())
    });
  }
  return result;
}

const allowReadonlyKeys = new Set(['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft', 'Shift', 'Control ', 'Alt', 'Tab',
  'PageUp', 'PageDown', 'Home', 'End']);

// noinspection JSIgnoredPromiseFromCall
const initial_listeners: Listener[] = [
  {
    ev: 'ready',
    intervalId: null,
    intervalMS: 500,
    fn: function() {
      this.intervalFunction(); // run immediately at start
      this.intervalId = setInterval(this.intervalFunction, this.intervalMS);

      window.onerror = function() {
        return showJavascriptErrorDialog.apply(null, arguments);
      };

      window.addEventListener('unhandledrejection', function (event: PromiseRejectionEvent) {
        return showJavascriptErrorDialog.apply(null, [event.reason]);
      });

      hashFlash();
      window.addEventListener('hashchange', () => hashFlash());

      const csrfElement: HTMLMetaElement = document.querySelector('meta[name="csrf-token"]');
      axios.defaults.headers.common['x-csrf-token'] = csrfElement.content;
      csrfElement.remove();

      const changeAvatarNameInURL: HTMLMetaElement = document.querySelector('meta[name="X-ChangeAvatarNameInURL"]');
      if (changeAvatarNameInURL) {
        let [oldName, newName] = changeAvatarNameInURL.content.split(';');
        window.history.replaceState({}, null, window.location.href.replace(oldName, newName).replace(encodeURIComponent(oldName), newName));
      }

      const scrollbarWidth = getScrollbarWidth();
      document.head.insertAdjacentHTML('beforeend',
        `<style>body.mobile-menu-open { margin-right: ${scrollbarWidth}px; }\n` +
        `body.mobile-menu-open #header { padding-right: ${scrollbarWidth}px; }\n` +
        `.collapsed { height: 0; overflow: hidden; }\n` +
        `</style>`
      );
    },

    intervalFunction() {
      document.querySelectorAll<HTMLTextAreaElement>('textarea.wikitext').forEach(el => {
        if (el.closest('.hide'))
          return;
        highlightWikitextReplace(el);
      });
      document.querySelectorAll<HTMLTextAreaElement>('textarea.json').forEach(el => {
        if (el.closest('.hide'))
          return;
        highlightReplace(el, 'ace/mode/json');
      });

      document.querySelectorAll<HTMLTextAreaElement>('textarea.autosize').forEach(el => {
        if (el.closest('.hide')) {
          return;
        }
        el.classList.remove('autosize');
        autosize(el);
      });

      document.querySelectorAll<HTMLElement>('[ui-tippy]').forEach(el => {
        enableTippy(el, getTippyOpts(el, 'ui-tippy'));
      });

      document.querySelectorAll<HTMLElement>('[ui-tippy-hover]').forEach(el => {
        const opts = getTippyOpts(el, 'ui-tippy-hover');
        el.addEventListener('mouseenter', _event => {
          showTippy(el, opts);
        });
        el.addEventListener('mouseleave', _event => {
          hideTippy(el);
        });
      });

      document.querySelectorAll<HTMLElement>('[ui-tippy-flash]').forEach(el => {
        const opts = getTippyOpts(el, 'ui-tippy-flash');
        el.addEventListener('click', _event => {
          flashTippy(el, opts);
        });
      });

      document.querySelectorAll('[contenteditable][readonly]:not(.readonly-contenteditable-processed)').forEach(el => {
        el.classList.add('readonly-contenteditable-processed');
        el.addEventListener('paste', event => {
          event.stopPropagation();
          event.preventDefault();
        });
        el.addEventListener('cut', event => {
          event.stopPropagation();
          event.preventDefault();
        });
        el.addEventListener('keydown', (event: KeyboardEvent) => {
          if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey || allowReadonlyKeys.has(event.key)) {
            return;
          }
          event.stopPropagation();
          event.preventDefault();
        });
        el.addEventListener('copy', (event: ClipboardEvent) => {
          const selection = document.getSelection();
          if (selection && selection.toString().trim() === el.textContent.trim()) {
            event.clipboardData.setData('text/plain', selection.toString().trim());
            event.preventDefault();
          }
        });
      });

      document.querySelectorAll<HTMLElement>('.timestamp.is--formatted.is--unconverted').forEach(el => {
        el.classList.remove('is--unconverted');
        el.classList.add('is--converted');
        el.innerText = timeConvert(parseInt(el.getAttribute('data-timestamp')), el.getAttribute('data-format') || null);
      });

      document.querySelectorAll<HTMLElement>('.timestamp.is--humanTiming').forEach(el => {
        el.innerText = humanTiming(parseInt(el.getAttribute('data-timestamp')));
      });
    },
  },
  {
    el: document,
    ev: 'click',
    fn: function(e: Event) {
      const target: HTMLElement = e.target as HTMLElement;
      const actionEl = target.closest<HTMLElement>('[ui-action]');

      if (!target.closest('#mobile-menu') && !target.closest('#mobile-menu-trigger')
          && document.querySelector('#mobile-menu').classList.contains('active')) {
        document.querySelector<HTMLButtonElement>('#mobile-menu-trigger button').click();
      }

      const qs = <T extends HTMLElement = HTMLElement>(selector: string): T =>
        (selector === 'this') ? (actionEl as T): document.querySelector<T>(selector);
      const qsAll = <T extends HTMLElement = HTMLElement>(selector: string): T[] =>
        (selector === 'this') ? ([actionEl as T]): Array.from(document.querySelectorAll<T>(selector));

      if (actionEl) {
        const actions: UiAction[] = parseUiAction(actionEl);
        for (let action of actions) {
          let actionType = action.actionType;
          let actionParams = action.actionParams;

          switch (actionType) {
            case 'add-class':
              let addClassTarget = qs(actionParams[0]);
              if (addClassTarget) {
                for (let cls of actionParams.slice(1)) {
                  addClassTarget.classList.add(cls);
                }
              }
              break;
            case 'remove-class':
              let removeClassTarget = qs(actionParams[0]);
              if (removeClassTarget) {
                for (let cls of actionParams.slice(1)) {
                  removeClassTarget.classList.remove(cls);
                }
              }
              break;
            case 'toggle-class':
              let toggleClassTarget = qs(actionParams[0]);
              if (toggleClassTarget) {
                for (let cls of actionParams.slice(1)) {
                  toggleClassTarget.classList.toggle(cls);
                }
              }
              break;
            case 'show':
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
            case 'hide':
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
            case 'toggle-dropdown':
            case 'dropdown':
              const dropdown = qs(actionParams[0]);
              if (dropdown) {
                (<any> dropdown)._toggledBy = actionEl;
                if (dropdown.classList.contains('active')) {
                  dropdown.classList.remove('active');
                  actionEl.classList.remove('active');
                } else {
                  dropdown.classList.add('active');
                  actionEl.classList.add('active');
                }
              }
              break;
            case 'dropdown-close':
            case 'close-dropdown':
            case 'close-dropdowns':
              qsAll('.ui-dropdown.active').forEach(dropdownEl => {
                const toggledBy = (<any> dropdownEl)._toggledBy;
                dropdownEl.classList.remove('active');
                if (toggledBy) {
                  toggledBy.classList.remove('active');
                }
              });
              break;
            case 'toggle':
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
            case 'refresh-page':
              window.location.reload();
              break;
            case 'close-modals':
              closeDialog();
              break;
            case 'copy':
              let copyTarget = qs(actionParams[0]);

              if ((<any> copyTarget).value) {
                // noinspection JSIgnoredPromiseFromCall
                copyToClipboard((<any> copyTarget).value.trim());
              }

              if (copyTarget.hasAttribute('contenteditable')) {
                if (copyTarget.querySelector('.ace_static_text_layer')) {
                  copyTarget = copyTarget.querySelector('.ace_static_text_layer');
                }
                let value = copyTarget.textContent;
                // noinspection JSIgnoredPromiseFromCall
                copyToClipboard(value.trim());
              }
              break;
            case 'copy-all':
              let copyTargets: HTMLInputElement[] = actionParams.map(sel => qsAll<HTMLInputElement>(sel)).flat(Infinity) as HTMLInputElement[];
              let combinedValues: string[] = [];
              let sep = actions.find(a => a.actionType === 'copy-sep')?.actionParams?.[0].replace(/\\n/g, '\n') || '\n';
              if (copyTargets) {
                for (let copyTarget of copyTargets) {
                  if ((<any> copyTarget).value) {
                    combinedValues.push(copyTarget.value.trim());
                  }
                  if (copyTarget.hasAttribute('contenteditable')) {
                    if (copyTarget.querySelector('.ace_static_text_layer')) {
                      copyTarget = copyTarget.querySelector('.ace_static_text_layer');
                    }
                    console.log('Copy target', copyTarget);
                    combinedValues.push(copyTarget.textContent.trim());
                  }
                }
                // noinspection JSIgnoredPromiseFromCall
                copyToClipboard(combinedValues.join(sep));
              }
              break;
            case 'tab':
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
                    otherTabPanel.classList.remove('active');
                    otherTabPanel.classList.add('hide');
                  }
                }
              }
              break;
            case 'set-query-param':
              const kvPairs: string[] = actionParams.map(x => x.split('&')).flat(Infinity) as string[];
              for (let kvPair of kvPairs) {
                let key = kvPair.split('=')[0];
                let value = kvPair.split('=')[1];
                setQueryStringParameter(key, value);
              }
              break;
            case 'expando':
              const animId = uuidv4();
              const container = qs(actionParams[0]);

              const inTransition = container.classList.contains('collapsing') || container.classList.contains('expanding');
              if (inTransition) {
                return;
              }

              if (container.classList.contains('collapsed')) {
                actionEl.classList.remove('expand');
                actionEl.classList.add('collapse');

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
                actionEl.classList.add('expand');
                actionEl.classList.remove('collapse');

                const styleEl = document.createElement('style');
                const height = container.getBoundingClientRect().height;
                const duration = Math.min(500, Math.max(200, height / 5 | 0));
                container.setAttribute('data-original-height', String(height));

                styleEl.textContent = `
                  .collapsing-${animId} { overflow: hidden; animation: collapsing-${animId} ${duration}ms ease forwards; }
                  @keyframes collapsing-${animId} { 100% { height: 0; } }
                `;
                container.style.height = height+'px';
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
                }, duration);
              }

              break;
            case 'set-cookie':
              Cookies.set(actionParams[0].trim(), actionParams[1].trim(), {expires: 365});
              break;
            case 'remove-cookie':
            case 'delete-cookie':
              Cookies.remove(actionParams[0].trim());
              break;
            default:
              break;
          }
        }
      }

      const parentDropdownEl = target.closest<HTMLElement>('.ui-dropdown');
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
      });
    },
  },
  {
    el: '.toggle-theme-buttons button',
    ev: 'click',
    multiple: true,
    fn: function(event: MouseEvent, target: HTMLButtonElement) {
      let value = target.value;
      console.log('Toggle theme button clicked with value:', value);

      document.querySelectorAll('.toggle-theme-buttons button').forEach(el => el.classList.remove('selected'));
      target.classList.add('selected');

      if (value === 'daymode') {
        document.body.classList.remove('nightmode');
        document.documentElement.classList.remove('nightmode');
        Cookies.remove('nightmode');
      } else if (value === 'nightmode') {
        document.body.classList.add('nightmode');
        document.documentElement.classList.add('nightmode');
        Cookies.set('nightmode', '1', { expires: 365 });
      }
    }
  },
  {
    el: '.header-language-selector select',
    ev: 'change',
    multiple: true,
    fn: function(event: Event, target: HTMLSelectElement) {
      let name = target.name;
      let value = target.value;
      console.log('Language selector: Name='+name+', Value='+value);
      Cookies.set(name, value, { expires: 365 });
    }
  },
  {
    el: '#search-mode-dropdown .option',
    ev: 'click',
    multiple: true,
    fn: function(event: Event, target: HTMLElement) {
      document.querySelectorAll('#search-mode-dropdown .option').forEach(el => el.classList.remove('selected'));
      target.classList.add('selected');

      let val = target.getAttribute('data-value');
      document.querySelector<HTMLElement>('#search-mode-button .code').innerText = val;
      Cookies.set('search-mode', val, { expires: 365 });
    }
  }
];

runWhenDOMContentLoaded(() => startListeners(initial_listeners, document));