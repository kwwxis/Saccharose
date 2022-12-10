import axios from 'axios';
import Cookies from 'js-cookie';
import { copyToClipboard, setQueryStringParameter } from './util/domutil';
import { human_timing, timeConvert } from '../shared/util/genericUtil';
import { Props as TippyProps } from 'tippy.js';
import { closeDialog } from './util/dialog';
import { enableTippy, flashTippy, hideTippy, showTippy } from './util/tooltips';
import { Listener, runWhenDOMContentLoaded, startListeners } from './util/eventLoader';
import { showJavascriptErrorDialog } from './util/errorHandler';
import autosize from 'autosize';
import { isInt } from '../shared/util/numberUtil';

function parseUiAction(actionStr: string|HTMLElement): {[actionType: string]: string[]} {
  if (actionStr instanceof HTMLElement) {
    actionStr = actionStr.getAttribute('ui-action');
  }
  const result = {};
  const actions = actionStr.split(';');
  for (let action of actions) {
    if (!action.includes(':')) {
      result[action.trim()] = [];
      continue;
    }
    const actionType = action.split(':')[0].trim().toLowerCase();
    result[actionType] = action.split(':')[1].split(',').map(x => x.trim());
  }
  return result;
}

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

      window.addEventListener('hashchange', function (_event: HashChangeEvent) {
        let hash = window.location.hash;
        if (hash && hash.length > 1) {
          hash = hash.slice(1);
          console.log('Hash Change:', hash);
          let target = document.getElementById(hash);
          if (target) {
            window.history.replaceState({}, null, window.location.href.split('#')[0]);
            target.classList.add('flash');
            setTimeout(() => {
              target.classList.remove('flash');
            }, 1000);
          }
        }
      });
    },
    intervalFunction() {
      document.querySelectorAll<HTMLElement>('.timestamp.is--formatted.is--unconverted').forEach(el => {
        el.classList.remove('is--unconverted');
        el.classList.add('is--converted');
        el.innerText = timeConvert(parseInt(el.getAttribute('data-timestamp')), el.getAttribute('data-format') || null);
      });

      document.querySelectorAll<HTMLElement>('.timestamp.is--humanTiming').forEach(el => {
        el.innerText = human_timing(parseInt(el.getAttribute('data-timestamp')));
      });

      function getTippyOpts(el: HTMLElement, attrName: string): Partial<TippyProps> {
        const attrVal = el.getAttribute(attrName).trim();

        let opts;
        if (attrVal.startsWith('{') && attrVal.endsWith('}')) {
          opts = eval('('+attrVal+')');
        } else {
          opts = {content: attrVal};
        }
        if (!opts.delay) {
          opts.delay = [100,100];
        }

        el.removeAttribute(attrName);
        return opts;
      }

      document.querySelectorAll<HTMLElement>('[ui-tippy]').forEach(el => {
        const opts = getTippyOpts(el, 'ui-tippy');
        enableTippy(el, opts);
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

      document.querySelectorAll<HTMLImageElement>('img.lazy').forEach(el => {
        el.classList.remove('lazy');
        el.src = el.getAttribute('data-src');
      });

      document.querySelectorAll<HTMLImageElement>('textarea.autosize').forEach(el => {
        if (el.closest('.hide')) {
          return;
        }
        el.classList.remove('autosize');
        autosize(el);
      });
    },
  },
  {
    ev: 'ready',
    fn: function() {
      if (location.hash) {
        let el = document.querySelector(location.hash);
        if (el) {
          setTimeout(() => {
            el.classList.add('flash');
            window.history.replaceState(null, null, ' '); // remove hash
            setTimeout(() => {
              el.classList.remove('flash');
            }, 2000);
          }, 500);
        }
      }

      let csrfElement: HTMLMetaElement = document.querySelector('meta[name="csrf-token"]');
      axios.defaults.headers.common['x-csrf-token'] = csrfElement.content;
      csrfElement.remove();
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

      if (actionEl) {
        const actions = parseUiAction(actionEl);
        for (let actionType of Object.keys(actions)) {
          let actionParams = actions[actionType];

          switch (actionType) {
            case 'toggle-class':
              let toggleClassTarget = document.querySelector(actionParams[0]);
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
                const showTarget = document.querySelector(selector);
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
                const hideTarget = document.querySelector(selector);
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
              const dropdown = document.querySelector(actionParams[0]);
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
            case 'toggle':
              let toggleEase = 0;
              if (isInt(actionParams[0])) {
                toggleEase = parseInt(actionParams[0]);
                actionParams = actionParams.slice(1);
              }
              for (let selector of actionParams) {
                const toggleTarget = document.querySelector(selector);
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
              let copyTarget: HTMLInputElement = document.getElementById(actionParams[0]) as HTMLInputElement;
              if (copyTarget) {
                // noinspection JSIgnoredPromiseFromCall
                copyToClipboard(copyTarget.value);
              }
              break;
            case 'tab':
              const tabpanel = document.querySelector(actionParams[0]);
              const tabgroup = actionParams[1];
              if (tabpanel) {
                tabpanel.classList.remove('hide');
                tabpanel.classList.add('active');
                actionEl.classList.add('active');
              }
              let otherTabs = Array.from(document.querySelectorAll<HTMLElement>('[ui-action*="tab:"]'));
              for (let tab of otherTabs) {
                let tabActions = parseUiAction(tab);
                if (tabActions.tab && tabActions.tab[1] == tabgroup && tabActions.tab[0] !== actionParams[0]) {
                  tab.classList.remove('active');
                  const otherTabPanel = document.querySelector(tabActions.tab[0]);
                  otherTabPanel.classList.remove('active');
                  otherTabPanel.classList.add('hide');
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
        Cookies.remove('nightmode');
      } else if (value === 'nightmode') {
        document.body.classList.add('nightmode');
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
  }
];

runWhenDOMContentLoaded(() => startListeners(initial_listeners, document));