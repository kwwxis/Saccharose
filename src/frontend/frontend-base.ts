import axios from 'axios';
import Cookies from 'js-cookie';
import { copyToClipboard } from './util/domutil';
import { escapeHtml } from '../shared/util/stringUtil';
import { human_timing, timeConvert } from '../shared/util/genericUtil';

function waitForConstant(variableName: string, callback: (val: any) => void, interval: number = 50, currentTry: number = 0, maxTries: number = 100) {
  if (window[variableName]) {
    callback(window[variableName]);
    return;
  }
  if (currentTry >= maxTries) {
    return;
  }
  setTimeout(() => {
    waitForConstant(variableName, callback, interval, currentTry + 1, maxTries);
  }, interval);
}
function waitForElement(query: string, callback: (val: HTMLElement) => void, interval: number = 50, currentTry: number = 0, maxTries: number = 100) {
  let el: HTMLElement;
  if ((el = document.querySelector<HTMLElement>(query))) {
    callback(el);
    return;
  }
  if (currentTry >= maxTries) {
    return;
  }
  setTimeout(() => {
    waitForElement(query, callback, interval, currentTry + 1, maxTries);
  }, interval);
}

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

const app = {

  /**
   * Save JSON file.
   *
   * @param {object} exportObj the object to save
   * @param {string} exportName file name to save as
   * @param {number} indentation indentation level
   */
  downloadObjectAsJson(exportObj: any, exportName: string, indentation: number = 0) {
    if (exportName.endsWith('.json')) exportName = exportName.slice(0, -5);
    let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj, null, indentation));
    let downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", exportName + ".json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  },

  /**
   * Set current url query string parameter without moving the browser history state forward.
   */
  setQueryStringParameter(name, value) {
    const params = new URLSearchParams(window.location.search);
    params.set(name, value);
    window.history.replaceState({}, '', decodeURIComponent(`${window.location.pathname}?${params}`));
  },

  /**
   * Returns a CSS selector that selects any focusable elements (e.g. buttons, inputs, textareas, etc.)
   *
   * @param {string} [prefix] optional prefix for each component of the selector
   * @returns {string}
   */
  getFocusableSelector(prefix = '') {
    let arr = ['button', '[role=button]', 'a', 'input:not([type=hidden]):not([readonly])', 'select', 'textarea:not([readonly])', '[tabindex]:not([tabindex^="-"])'];
    if (prefix) {
      arr = arr.map(v => prefix + ' ' + v);
    }
    return arr.join(', ');
  },
  enableTippy(el, props={}) {
    waitForConstant('tippy', tippy => {
      let tip = el._tippy;

      if (!tip) {
        tip = tippy(el, props);
      } else {
        tip.setProps(props);
      }
    });
  },
  showTippy(el, props: any = {}) {
    if (el._tippyTimeout) return;
    waitForConstant('tippy', tippy => {
      let tip = el._tippy;

      if (!tip) {
        tip = tippy(el);
      }

      if (!props.trigger) {
        props.trigger = 'manual';
      }

      tip.setProps(props);
      tip.show();
    });
  },
  hideTippy(el) {
    if (el._tippyTimeout) return;
    waitForConstant('tippy', tippy => {
      if (el._tippy) {
        el._tippy.hide();
      }
    });
  },
  flashTippy(el, props: any = {}) {
    waitForConstant('tippy', tippy => {
      let tip = el._tippy;

      if (!tip) {
        tip = tippy(el);
      }

      if (!props.delay) {
        props.delay = [0, 2000];
      }

      if (!props.trigger) {
        props.trigger = 'manual';
      }

      tip.setProps(props);
      tip.show();

      clearTimeout(el._tippyTimeout);

      el._tippyTimeout = setTimeout(() => {
        tip.hide();
        el._tippyTimeout = undefined;
      }, tip.props.delay[1] || 0);
    });
  },
  handlingJavascriptError: false,
  showJavascriptErrorDialog(message, source, lineno, colno, error) {
    console.error(error || message);

    if (app.handlingJavascriptError) {
      return;
    }

    app.handlingJavascriptError = true;

    const searchAndRedact = (obj) => {
      if (typeof obj !== 'object' || !obj) return obj;
      Object.keys(obj).forEach(key => {
        if (typeof obj[key] === 'object') {
          obj[key] = searchAndRedact(obj[key]);
        }
        switch (key.toLowerCase()) {
          case 'x-csrf-token':
          case '_csrf':
          case 'x-api-key':
          case 'connect.sid':
            obj[key] = '<REDACTED>';
        }
      });
      return obj;
    };

    let errorAsJSON = error ? searchAndRedact(JSON.parse(JSON.stringify(error))) : error;

    let technicalDetails = [
      'Message: ' + escapeHtml(String(message)),
      'Source: ' + escapeHtml(String(source)),
      'Line: ' + escapeHtml(String(lineno)),
      'Column: ' + escapeHtml(String(colno)),
      'Error object: ' + escapeHtml(JSON.stringify(errorAsJSON, null, 2)),
      'Stacktrace:\n' + escapeHtml(error ? error.stack : 'undefined'),
    ].join('\n');

    // Just in case:
    technicalDetails = technicalDetails.replace(/(['"])(x-api-key|x-csrf-token|_csrf|connect\.sid)(['"])(:\s*)(['"])([^ "']+)(['"])/gi, '$1$2$3$4$5<REDACTED>$7');

    app.dialog.open(`<h2>Unexpected error</h2>
    <p class="spacer-top">
    An unexpected JavaScript error occurred. Try again in a few moments. If the problem
    persists then yell at kwwxis with the technical details below.</p>
    <div class="js-error-details">
      <button ui-trigger="js-error-details" aria-label="Toggle technical details">Technical Details</button>
      <div class="hide" ui-target="js-error-details">
        <button class="primary primary--2 copy-js-error-details spacer5-bottom"
          ui-tippy-hover="Click to copy technical details"
          ui-tippy-flash="{content:'Copied!', delay: [0,2000]}">Copy</button>
        <textarea readonly class="d-pre-code">${technicalDetails}</textarea>
      </div>
    </div>
    <div class="buttons spacer-top">
      <button class="primary dismiss-btn">Dismiss</button>
    </div>`, app.DIALOG_MODAL, {
      dialog_outer_class: 'js-error',
      blocking: true,
      disableDefaultCloseButton: true,
      disableEscToClose: true,
      callback() {
        this.querySelector('button.copy-js-error-details').addEventListener('click', () => {
          copyToClipboard(technicalDetails);
        });
        this.querySelector('button.dismiss-btn').addEventListener('click', () => {
          app.dialog.close();
          app.handlingJavascriptError = false;
        });
      }
    });

    return true;
  },
  /**
   * @type {{el: string|Element|Element[], ev: string, fn: function}[]}
   */
  initial_listeners: [
    {
      ev: 'ready',
      intervalId: null,
      intervalMS: 500,
      fn: function() {
        waitForConstant('moment', () => {
          this.intervalFunction(); // run immediately at start
          this.intervalId = setInterval(this.intervalFunction, this.intervalMS);
        });

        window.onerror = function() {
          return app.showJavascriptErrorDialog.apply(null, arguments);
        };

        window.addEventListener('unhandledrejection', function (event) {
          return app.showJavascriptErrorDialog.apply(null, [event.reason]);
        });

        window.addEventListener('hashchange', function (event) {
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

        function getTippyOpts(el, ... attrNames) {
          const attrName = attrNames.find(a => el.hasAttribute(a));
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

        waitForConstant('tippy', tippy => {
          document.querySelectorAll('[ui-tooltip],[ui-tippy]').forEach(el => {
            const opts = getTippyOpts(el, 'ui-tooltip', 'ui-tippy');
            app.enableTippy(el, opts);
          });

          document.querySelectorAll('[ui-tippy-hover]').forEach(el => {
            const opts = getTippyOpts(el, 'ui-tippy-hover');
            el.addEventListener('mouseenter', event => {
              app.showTippy(el, opts);
            });
            el.addEventListener('mouseleave', event => {
              app.hideTippy(el);
            });
          });

          document.querySelectorAll('[ui-tippy-flash]').forEach(el => {
            const opts = getTippyOpts(el, 'ui-tippy-flash');
            el.addEventListener('click', event => {
              app.flashTippy(el, opts);
            });
          });
        });

        document.querySelectorAll<HTMLImageElement>('img.lazy').forEach(el => {
          el.classList.remove('lazy');
          el.src = el.getAttribute('data-src');
        });
      },
    },
    {
      ev: 'readyAsync',
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

        waitForConstant('axios', () => {
          let csrfElement: HTMLMetaElement = document.querySelector('meta[name="csrf-token"]');
          axios.defaults.headers.common['x-csrf-token'] = csrfElement.content;
          csrfElement.remove();
        });
      },
    },
    {
      el: document.body,
      ev: 'keyup',
      fn: function(e) {
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
      fn: function(e) {
        /** @type {Element} */
        const target = e.target,
          parentDropdown = target.closest('.ui-dropdown'),
          copyTargetEl = target.closest('[copy-target]'),
          uiTrigger = target.closest('[ui-trigger]'),
          uiClear = target.closest('[ui-clear]'),
          uiTriggerTarget = getUITarget(uiTrigger),
          uiClearTarget = getUITarget(uiClear);

        getUITriggerGroup(uiTrigger).forEach(x => x.classList.remove('active'));
        getUITargetGroup(uiTrigger).forEach(x => x.classList.add('hide'));

        if (uiClearTarget && uiClearTarget instanceof HTMLInputElement && uiClearTarget.value) {
          uiClearTarget.value = '';
        }

        if (target.classList.contains('AppDialog_CloseTrigger')) {
          app.dialog.close();
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

            let focusableEl: HTMLElement = uiTriggerTarget.querySelector(app.getFocusableSelector());
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
            app.setQueryStringParameter(kvPair[0], kvPair.slice(1).join('='));
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
      fn: function(event, target) {
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
      fn: function(event, target) {
        let name = target.name;
        let value = target.value;
        console.log('Language selector: Name='+name+', Value='+value);
        Cookies.set(name, value, { expires: 365 });
      }
    }
  ],
  startListeners(listeners, rel = undefined) {
    if (typeof rel === 'string') {
      waitForElement(rel, el => {
        app.startListeners(listeners, el);
      });
      return;
    } else if (!rel || typeof rel === 'undefined') {
      app.startListeners(listeners, window.document);
      return;
    }

    listeners.forEach(opts => {
      if (opts.ev === 'ready') {
        opts.fn.call(opts);
        return;
      } else if (opts.ev === 'readyAsync') {
        setTimeout(() => {
          opts.fn.call(opts);
        }, 0);
        return;
      } else if (opts.ev === 'enter') {
        opts.ev = 'keypress';
        let originalFn = opts.fn;
        opts.fn = function(event, target) {
          if (event.code === 'Enter' || (event.keyCode ? event.keyCode : event.which) === 13) {
            originalFn.call(opts, event, target);
          }
        };
      }

      if (opts.multiple) {
        let targets: HTMLElement[];
        if (typeof opts.el === 'string') {
          targets = rel.querySelectorAll(opts.el);
        } else {
          targets = Array.isArray(opts.el) ? opts.el : [opts.el];
        }
        Array.from(targets).forEach(target =>
          target.addEventListener(opts.ev, function(event) {
            opts.fn.call(opts, event, target);
          })
        );
      } else {
        let target;
        if (opts.el === 'document') {
          target = window.document;
        } else if (opts.el === 'window') {
          target = window;
        } else if (typeof opts.el === 'string') {
          target = rel.querySelector(opts.el);
        } else {
          target = Array.isArray(opts.el) ? opts.el[0] : opts.el;
        }
        if (!target) return;
        target.addEventListener(opts.ev, function(event) {
          opts.fn.call(opts, event, target);
        });
      }
    });
  },
  endpoints: {
    base_uri: '/api',
    general_error_handler: err => {
      if (!err.response.data || err.response.data.error != 'BAD_REQUEST') {
        const errorObj: any = {error: err.toJSON()};

        if (err.response) {
          errorObj.response = {status: err.response.status, headers: err.response.headers, data: err.response.data};
        }

        app.showJavascriptErrorDialog(err.message,
          escapeHtml(`HTTP ${err.config.method.toUpperCase()} Request to ${err.config.url}`),
          undefined,
          undefined,
          errorObj
        );
      }
      return err.response.data;
    },
    ping() {
      return axios
        .get(`${this.base_uri}/ping`)
        .then(response => response.data)
        .catch(this.general_error_handler);
    },
    testGeneralErrorHandler() {
      return axios
        .get(`${this.base_uri}/nonexistant_endpoint`)
        .then(response => response.data)
        .catch(this.general_error_handler);
    },
    findMainQuest(nameOrId, asHTML = false) {
      return axios
        .get(`${this.base_uri}/quests/findMainQuest`, {
          params: {name: nameOrId },
          headers: {
            'Accept': asHTML ? 'text/html' : 'application/json',
            'Content-Type': asHTML ? 'text/html' : 'application/json',
          }
        })
        .then(response => response.data)
        .catch(this.general_error_handler);
    },
    generateMainQuest(id, asHTML = false) {
      return axios
        .get(`${this.base_uri}/quests/generate`, {
          params: {id: id},
          headers: {
            'Accept': asHTML ? 'text/html' : 'application/json',
            'Content-Type': asHTML ? 'text/html' : 'application/json',
          }
        })
        .then(response => response.data)
        .catch(this.general_error_handler);
    },
    generateOL(text, hideTl, addDefaultHidden, hideRm, asHTML = false) {
      return axios
        .get(`${this.base_uri}/OL/generate`, {
          params: {
            text: text,
            hideTl: hideTl ? 'true' : 'false',
            hideRm: hideRm ? 'true' : 'false',
            addDefaultHidden: addDefaultHidden ? 'true' : 'false'
          },
          headers: {
            'Accept': asHTML ? 'text/html' : 'application/json',
            'Content-Type': asHTML ? 'text/html' : 'application/json',
          }
        })
        .then(response => response.data)
        .catch(this.general_error_handler);
    },
    generateSingleDialogueBranch(text, npcFilter, asHTML = false) {
      return axios
        .get(`${this.base_uri}/dialogue/single-branch-generate`, {
          params: {text: text, npcFilter: npcFilter || null},
          headers: {
            'Accept': asHTML ? 'text/html' : 'application/json',
            'Content-Type': asHTML ? 'text/html' : 'application/json',
          }
        })
        .then(response => response.data)
        .catch(this.general_error_handler);
    },
    generateNpcDialogue(npcName, asHTML = false) {
      return axios
        .get(`${this.base_uri}/dialogue/npc-dialogue-generate`, {
          params: {name: npcName},
          headers: {
            'Accept': asHTML ? 'text/html' : 'application/json',
            'Content-Type': asHTML ? 'text/html' : 'application/json',
          }
        })
        .then(response => response.data)
        .catch(this.general_error_handler);
    },
    generateReminderDialogue(text, subsequentAmount = 0, asHTML = false) {
      return axios
        .get(`${this.base_uri}/dialogue/reminder-dialogue-generate`, {
          params: {text: text, subsequentAmount: subsequentAmount},
          headers: {
            'Accept': asHTML ? 'text/html' : 'application/json',
            'Content-Type': asHTML ? 'text/html' : 'application/json',
          }
        })
        .then(response => response.data)
        .catch(this.general_error_handler);
    },
  },

  TOAST_INFO: 'info',
  TOAST_SUCCESS: 'success',
  TOAST_ERROR: 'error',
  toaster: {
    /**
     * @param {Object} opts
     * @param {string} opts.type
     * @param {string} opts.title
     * @param {string} opts.content
     * @param {boolean} opts.escapeHTML
     * @param {number} [opts.ttl=4000] in milliseconds
     */
    makeToast(opts) {
      opts = Object.assign({
        type: app.TOAST_INFO,
        title: '',
        content: '',
        ttl: 4000,
        escapeHTML: true,
      }, opts);

      let toastContainer = document.getElementById('toast-container');
      if (!toastContainer) {
        toastContainer = document.createElement('DIV');
        toastContainer.id = 'toast-container';
        document.body.append(toastContainer);
      }

      let toast = document.createElement('DIV');
      toast.classList.add('toast', `toast-${opts.type}`);
      toast.innerHTML = `
      <div class="toast-card">
        <div class="toast-inner">
          <div class="toast-content">
            <div class="toast-title">${opts.escapeHTML ? escapeHtml(opts.title) : opts.title}</div>
            <div class="toast-desc">${opts.escapeHTML ? escapeHtml(opts.content) : opts.content}</div>
          </div>
          <button class="close small"></button>
        </div>
      </div>
      `;

      const transitionTime = 300;
      const transitionVal = `all ${transitionTime}ms ease`

      toast.style.cssText = 'position:absolute;left:-9999px;opacity:0;';
      toastContainer.append(toast);
      toast.style.cssText = `margin-bottom: -${toast.clientHeight}px;opacity:0`;

      function eatToast() {
        const rect = toast.getBoundingClientRect();
        const prevToast: HTMLElement = toast.previousElementSibling as HTMLElement;
        const bottomPos = toastContainer.clientHeight - (rect.top - toastContainer.offsetTop) - toast.clientHeight;

        toast.style.cssText = `bottom:${bottomPos}px;left:${rect.left}px;position:absolute;transition:${transitionVal};`;

        if (prevToast) {
          prevToast.style.removeProperty('transition');
        }

        const removeToastFunc = () => {
          window.requestAnimationFrame(() => {
            toast.style.marginLeft = '80px';
            toast.style.opacity = '0.0';

            setTimeout(() => {
              toast.remove();
              if (prevToast) {
                prevToast.style.transition = transitionVal;
                prevToast.style.marginBottom = '0px';
              }
            }, transitionTime);
          });
        };

        if (prevToast) {
          setTimeout(() => {
            prevToast.style.marginBottom = `${toast.clientHeight}px`;
            setTimeout(removeToastFunc, 5);
          }, 5);
        } else {
          setTimeout(removeToastFunc, 5);
        }
      }

      window.setTimeout(() => {
        toast.style.transition = transitionVal;
        toast.querySelector('button.close').addEventListener('click', () => eatToast());

        window.setTimeout(() => {
          window.requestAnimationFrame(() => {
            toast.style.marginBottom = '0px';
            toast.style.opacity = '0.8';
          });
        }, 5);
      }, 5);

      if (opts.ttl) {
        setTimeout(() => eatToast(), opts.ttl);
      }
    },
    info(opts) {
      opts.type = app.TOAST_INFO;
      this.makeToast(opts);
    },
    success(opts) {
      opts.type = app.TOAST_SUCCESS;
      this.makeToast(opts);
    },
    error(opts) {
      opts.type = app.TOAST_ERROR;
      this.makeToast(opts);
    }
  },

  DIALOG_ALERT: 0,
  DIALOG_MODAL: 1,
  DIALOG_ERROR: 2,
  DIALOG_TOAST: 3,
  dialog: {
    /**
     * @param {Element|String} contents
     * @param {0|1|2|3} dialog_type
     */
    open(contents, dialog_type, opts) {
      app.dialog.close();

      if (!contents) {
        return;
      }

      opts = opts || {};

      let inner, type_name;

      dialog_type = dialog_type || 0;

      if (dialog_type == app.DIALOG_ALERT) {
        type_name = 'alert';
        inner = `
            <div id="appDialogDesc" class="AppDialog_Content"></div>
            <div class="AppDialog_ButtonGroup">
              <button class="secondary AppDialog_CloseTrigger">OK</button>
            </div>`;
      } else if (dialog_type == app.DIALOG_MODAL) {
        type_name = 'modal';
        inner = `<div id="appDialogDesc" class="AppDialog_Content"></div>`;
        if (!opts.disableDefaultCloseButton) {
          inner += `<button class="close small AppDialog_CloseTrigger" aria-label="Close dialog"
            ui-tippy-hover="{content:'Keyboard shortcut: <strong>esc</strong>', delay:[100,100]}"></button>`;
        }
      } else if (dialog_type == app.DIALOG_ERROR || dialog_type == app.DIALOG_TOAST) {
        type_name = 'toast';
        let iconHTML = '';
        if (dialog_type === app.DIALOG_ERROR) {
          iconHTML = document.getElementById('template-alert-icon').innerHTML;
        } else {
          iconHTML = document.getElementById('template-info-icon').innerHTML;
        }
        inner = `${iconHTML}
            <div id="appDialogDesc" class="AppDialog_Content"></div>`;
        if (!opts.disableDefaultCloseButton) {
          inner += `<button class="close small AppDialog_CloseTrigger" aria-label="Close dialog"
            ui-tippy-hover="{content:'Keyboard shortcut: <strong>esc</strong>', delay:[100,100]}"></button>`;
        }
      }

      const id = 'dialog-' + Date.now();

      document.body.insertAdjacentHTML('beforeend',
        `<div id="${id}" class="AppDialogOuter ${opts.dialog_outer_class || ''} ${opts.blocking ? 'AppDialogBlocking' : ''}"
            data-type="${type_name}" role="dialog" aria-describedby="appDialogDesc">
          <div class="AppDialog" data-type="${type_name}" ${opts.dialog_class ? 'class="'+escapeHtml(opts.dialog_class)+'"' : ''} ${opts.dialog_style ? 'style="'+escapeHtml(opts.dialog_style)+'"' : ''}>
            <div class="AppDialog_Inner">${inner}</div>
          </div>
        </div>`
      );

      if (contents instanceof Node) {
        document.querySelector(`#${id} .AppDialog_Content`).append(contents);
      } else {
        document.querySelector(`#${id} .AppDialog_Content`).innerHTML = contents;
      }

      window.requestAnimationFrame(function() {
        const selInput: HTMLElement = document.querySelector(app.getFocusableSelector(`#${id}`));
        if (selInput) {
          if (typeof selInput.focus === 'function')
            selInput.focus();
          if (typeof (<any> selInput).select === 'function')
            (<any> selInput).select();
        }
      });

      if (opts.callback) {
        opts.callback.apply(document.getElementById(id), []);
      }

      if (!opts.disableEscToClose) {
        document.body.addEventListener('keyup', app.dialog.active_listener);
      }
    },
    active_listener(e) {
      const tag = e.target.tagName.toUpperCase();

      const key = e.which || e.keyCode || 0;
      if (key === 13 && tag != 'TEXTAREA' && tag != 'INPUT' && tag != 'SELECT') app.dialog.close();
      if (key === 27) app.dialog.close();
    },
    close() {
      document.querySelectorAll('.AppDialogOuter').forEach(el => el.remove());
      document.body.removeEventListener('keyup', app.dialog.active_listener);
    },
  },
};

if (!(<any> window).app) {
  (<any> window).app = app;
}

if (/comp|inter|loaded/.test(document.readyState)) {
  app.startListeners(app.initial_listeners, document);
} else {
  document.addEventListener('DOMContentLoaded', function() {
    app.startListeners(app.initial_listeners, document);
  });
}
