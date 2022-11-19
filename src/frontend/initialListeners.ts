import axios from 'axios';
import Cookies from 'js-cookie';
import { copyToClipboard, getFocusableSelector, setQueryStringParameter } from './util/domutil';
import { human_timing, timeConvert } from '../shared/util/genericUtil';
import { Props as TippyProps } from 'tippy.js';
import { closeDialog } from './util/dialog';
import { enableTippy, showTippy, hideTippy, flashTippy } from './util/tooltips';
import { Listener, runWhenDOMContentLoaded, startListeners } from './util/eventLoader';
import { showJavascriptErrorDialog } from './util/errorHandler';
import autosize from 'autosize';

function getUITriggerString(o: string|HTMLElement): string {
  if (!o) return undefined;
  return typeof o === 'string'
    ? o
    : o.getAttribute('ui-trigger') ||
        o.getAttribute('ui-clear') ||
        o.getAttribute('ui-target') ||
        undefined;
}

function getUITriggers(o: string|HTMLElement): HTMLElement[] {
  let str = getUITriggerString(o);
  return !str ? [] : Array.from(document.querySelectorAll(`[ui-trigger="${str}"]`));
}

function getUITriggerGroup(o: string|HTMLElement): HTMLElement[] {
  let str = getUITriggerString(o);
  return !str ? [] : Array.from(document.querySelectorAll(`[ui-trigger^="${str.split(':')[0]}:"]`));
}

function getUITargetGroup(o: string|HTMLElement): HTMLElement[] {
  let str = getUITriggerString(o);
  return !str ? [] : Array.from(document.querySelectorAll(`[ui-target^="${str.split(':')[0]}:"]`));
}

function getUITarget(o: string|HTMLElement): HTMLElement {
  let str = getUITriggerString(o);
  return document.querySelector(`[ui-target="${str}"]`) || undefined;
}

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
    el: document.body,
    ev: 'keyup',
    fn: function(e: KeyboardEvent) {
      const key = e.which || e.keyCode || 0;
      if (key === 27) { // escape key
        document.querySelectorAll<HTMLElement>('.ui-dropdown').forEach(dropdownEl => {
          if (dropdownEl.contains(document.activeElement)) {
            // If focused element is inside dropdown, then
            // focus the first trigger for the dropdown that is focusable
            let firstTrigger = Array.from(getUITriggers(dropdownEl)).filter(el => el.focus)[0];
            if (firstTrigger) firstTrigger.focus();
          }

          dropdownEl.classList.add('hide');
          dropdownEl.classList.remove('active');
          getUITriggers(dropdownEl).forEach(x => x.classList.remove('active'));
        });
      }
    },
  },
  {
    el: document,
    ev: 'click',
    fn: function(e: Event) {
      /** @type {Element} */
      const target: HTMLElement = e.target as HTMLElement,
        parentDropdown = target.closest<HTMLElement>('.ui-dropdown'),
        copyTargetEl = target.closest<HTMLElement>('[copy-target]'),
        uiTrigger = target.closest<HTMLElement>('[ui-trigger]'),
        uiClear = target.closest<HTMLElement>('[ui-clear]'),
        uiTriggerTarget = getUITarget(uiTrigger),
        uiClearTarget = getUITarget(uiClear);

      getUITriggerGroup(uiTrigger).forEach(x => x.classList.remove('active'));
      getUITargetGroup(uiTrigger).forEach(x => x.classList.add('hide'));

      if (uiClearTarget && uiClearTarget instanceof HTMLInputElement && uiClearTarget.value) {
        uiClearTarget.value = '';
      }

      if (target.classList.contains('AppDialog_CloseTrigger')) {
        closeDialog();
      }

      if (copyTargetEl) {
        let copyTargetId = copyTargetEl.getAttribute('copy-target');
        let copyTarget: HTMLInputElement = document.getElementById(copyTargetId) as HTMLInputElement;

        if (copyTarget) {
          copyToClipboard(copyTarget.value);
        }
      }

      if (uiTriggerTarget && (!parentDropdown || parentDropdown != uiTriggerTarget)) {
        if (uiTriggerTarget.classList.toggle('hide')) {
          // Target hidden
          uiTriggerTarget.classList.remove('active');
          getUITriggers(uiTriggerTarget).forEach(x => x.classList.remove('active'));
        } else {
          // Target shown
          uiTriggerTarget.classList.add('active');
          getUITriggers(uiTriggerTarget).forEach(x => x.classList.add('active'));

          let focusableEl: HTMLElement = uiTriggerTarget.querySelector(getFocusableSelector());
          if (focusableEl) {
            e.preventDefault();
            e.stopPropagation();
            // Focus the first focusable element inside the target
            focusableEl.focus();
            setTimeout(() => focusableEl.focus(), 0);
          }
        }

        if (uiTrigger.hasAttribute('ui-set-query-param')) {
          let kvPair = uiTrigger.getAttribute('ui-set-query-param').split('=');
          setQueryStringParameter(kvPair[0], kvPair.slice(1).join('='));
        }

        if (uiTrigger.hasAttribute('ui-set-path')) {
          let path = uiTrigger.getAttribute('ui-set-path');
          window.history.pushState({}, null, path);
        }

        if (uiTrigger.hasAttribute('ui-replace-path')) {
          let path = uiTrigger.getAttribute('ui-replace-path');
          window.history.replaceState({}, null, path);
        }
      }

      document.querySelectorAll<HTMLElement>('.ui-dropdown').forEach(dropdownEl => {
        // Don't try to hide dropdown if we clicked the trigger for it.
        if (uiTriggerTarget && uiTriggerTarget === dropdownEl) {
          return;
        }

        // Don't hide to try to hide the dropdown if we clicked inside it
        if (!parentDropdown || dropdownEl !== parentDropdown) {
          if (!dropdownEl.classList.contains('hide')) {
            dropdownEl.classList.add('hide');
            dropdownEl.classList.remove('active');
            getUITriggers(dropdownEl).forEach(x => x.classList.remove('active'));
          }
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