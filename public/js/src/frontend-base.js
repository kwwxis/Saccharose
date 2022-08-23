'use strict';

/**
 * Escape HTML.
 * @param {string} unsafe
 * @returns {string}
 */
function esc(unsafe) {
  if (!unsafe || typeof unsafe !== 'string') return '';
  return unsafe.replace(/[&<>"']/g, function(m) {
    switch (m) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      default:
        return '&#039;';
    }
  });
}

/**
 * Should be called from a user-interaction event listener such as `click`.
 *
 * Copied from https://stackoverflow.com/a/33928558
 *
 * @param {string} text
 */
function copyToClipboard(text) {
  if (window.clipboardData && window.clipboardData.setData) {
    // IE specific code path to prevent textarea being shown while dialog is visible.
    return clipboardData.setData('Text', text);
  } else if (document.queryCommandSupported && document.queryCommandSupported('copy')) {
    var textarea = document.createElement('textarea');
    textarea.textContent = text;

    textarea.style.position = 'fixed'; // Prevent scrolling to bottom of page in MS Edge.
    textarea.style.top = 0;
    textarea.style.left = 0;
    textarea.style.width = '2em';
    textarea.style.height = '2em';
    textarea.style.background = 'transparent';

    document.body.appendChild(textarea);
    textarea.select();

    try {
      return document.execCommand('copy'); // Security exception may be thrown by some browsers.
    } catch (ex) {
      console.warn('Copy to clipboard failed.', ex);
      return false;
    } finally {
      document.body.removeChild(textarea);
    }
  }
}

/** @returns {string} */
function getUITriggerString(o) {
  if (!o) return undefined;
  return typeof o === 'string'
    ? o
    : o.getAttribute('ui-trigger') ||
        o.getAttribute('ui-clear') ||
        o.getAttribute('ui-target') ||
        undefined;
}

/** @returns {Element[]} */
function getUITriggers(o) {
  let str = getUITriggerString(o);
  return !str ? [] : document.querySelectorAll(`[ui-trigger="${str}"]`);
}

/** @returns {Element[]} */
function getUITriggerGroup(o) {
  let str = getUITriggerString(o);
  return !str ? [] : document.querySelectorAll(`[ui-trigger^="${str.split(':')[0]}:"]`);
}

/** @returns {Element[]} */
function getUITargetGroup(o) {
  let str = getUITriggerString(o);
  return !str ? [] : document.querySelectorAll(`[ui-target^="${str.split(':')[0]}:"]`);
}

/**  @returns {Element} */
function getUITarget(o) {
  let str = getUITriggerString(o);
  return document.querySelector(`[ui-target="${str}"]`) || undefined;
}

function timeConvert(UNIX_timestamp, format = undefined, tzOffset = null, tzAbrv = null) {
  if (isNaN(UNIX_timestamp)) {
    return 'n/a';
  }

  if (!UNIX_timestamp) {
    return String(UNIX_timestamp);
  }

  if (UNIX_timestamp instanceof Date) {
    var a = moment(UNIX_timestamp);
  } else if (typeof UNIX_timestamp === 'number') {
    var a = moment(UNIX_timestamp * 1000);
  } else {
    return String(UNIX_timestamp);
  }

  if (typeof format !== 'string') {
    format = format ? 'MMM DD YYYY' : 'MMM DD YYYY hh:mm:ss a';
  }

  return a.format(format);
}

function humanTiming(time, suffix) {
  suffix = suffix || null;

  if (time instanceof Date) time = (time / 1000) | 0;
  if (time === null) return null;
  if (time <= 0) return 'never';

  time = Math.floor(Date.now() / 1000) - time;
  suffix = suffix ? suffix : time < 0 ? 'from now' : 'ago';
  time = Math.abs(time);

  if (time <= 1) return 'Just now';

  var tokens = [
    [31536000, 'year'],
    [2592000, 'month'],
    [604800, 'week'],
    [86400, 'day'],
    [3600, 'hour'],
    [60, 'minute'],
    [1, 'second'],
  ];

  var ret = null;

  for (let i = 0; i < tokens.length; i++) {
    let token = tokens[i];
    var unit = token[0];
    var text = token[1];

    if (time < unit) continue;

    var numberOfUnits = Math.floor(time / unit);
    ret = numberOfUnits + ' ' + text + (numberOfUnits > 1 ? 's' : '') + ' ' + suffix;
    break;
  }

  return ret;
}

const app = {

  /**
   * Save JSON file.
   *
   * @param {object} exportObj the object to save
   * @param {string} exportObj file name to save as
   * @param {number} exportObj indentation level
   */
  downloadObjectAsJson(exportObj, exportName, indentation=0) {
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
  showTippy(el, props={}) {
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
  flashTippy(el, props={}) {
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
      'Message: ' + esc(String(message)),
      'Source: ' + esc(String(source)),
      'Line: ' + esc(String(lineno)),
      'Column: ' + esc(String(colno)),
      'Error object: ' + esc(JSON.stringify(errorAsJSON, null, 2)),
      'Stacktrace:\n' + esc(error ? error.stack : 'undefined'),
    ].join('\n');

    // Just in case:
    technicalDetails = technicalDetails.replace(/('|")(x-api-key|x-csrf-token|_csrf|connect\.sid)('|")(:\s*)('|")([^ "']+)('|")/gi, '$1$2$3$4$5<REDACTED>$7');

    app.dialog.open(`<h2>Unexpected error</h2>
    <p class="spacer-top">
    An unexpected JavaScript error occurred. Try again in a few moments. If the problem
    persists then yell at kwwxis with the technical details below.</p>
    <div class="js-error-details">
      <button ui-trigger="js-error-details" aria-label="Toggle technical details">Technical Details</button>
      <div class="hide" ui-target="js-error-details">
        <button class="primary primary--2 copy-js-error-details spacer5-bottom"
          ui-tippy-hover="{content:'Click to copy technical details', delay:[100,100]}"
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

        app.loadWidgets();
      },
      intervalFunction() {
        document.querySelectorAll('.timestamp.is--formatted.is--unconverted').forEach(el => {
          el.classList.remove('is--unconverted');
          el.classList.add('is--converted');
          el.innerText = timeConvert(parseInt(el.getAttribute('data-timestamp')), el.getAttribute('data-format') || null);
        });

        document.querySelectorAll('.timestamp.is--humanTiming').forEach(el => {
          el.innerText = humanTiming(parseInt(el.getAttribute('data-timestamp')));
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
          document.querySelectorAll('[ui-tooltip],[ui-tippy-hover]').forEach(el => {
            const opts = getTippyOpts(el, 'ui-tooltip', 'ui-tippy-hover');
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

        document.querySelectorAll('img.lazy').forEach(el => {
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
          let csrfElement = document.querySelector('meta[name="csrf-token"]');
          axios.defaults.headers.common['x-csrf-token'] = csrfElement.content;
          csrfElement.remove();
        });
      },
    },
    {
      el: document.body,
      ev: 'keyup',
      fn: function(e) {
        var key = e.which || e.keyCode || 0;
        if (key === 27) { // escape key
          document.querySelectorAll('.ui-dropdown').forEach(dropdownEl => {
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
          uiTrigger = target.closest('[ui-trigger]'),
          uiClear = target.closest('[ui-clear]'),
          uiTriggerTarget = getUITarget(uiTrigger),
          uiClearTarget = getUITarget(uiClear);

        getUITriggerGroup(uiTrigger).forEach(x => x.classList.remove('active'));
        getUITargetGroup(uiTrigger).forEach(x => x.classList.add('hide'));

        if (uiClearTarget && uiClearTarget.value) {
          uiClearTarget.value = '';
        }

        if (target.classList.contains('AppDialog_CloseTrigger')) {
          app.dialog.close();
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

            let focusableEl = uiTriggerTarget.querySelector(app.getFocusableSelector());
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

        document.querySelectorAll('.ui-dropdown').forEach(dropdownEl => {
          // Don't try to hide dropdown if we clicked the trigger for it.
          if (uiTriggerTarget && uiTriggerTarget === dropdownEl) {
            return;
          }

          // Don't hide to try to hide the dropdown if we clicked inside of it
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
    }
  ],
  startListeners(listeners, rel = undefined) {
    if (!rel) rel = document;
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
        // prettier-ignore
        let targets = typeof opts.el === 'string' ? rel.querySelectorAll(opts.el) :
          (Array.isArray(opts.el) ? opts.el : [opts.el]);
        Array.from(targets).forEach(target =>
          target.addEventListener(opts.ev, function(event) {
            opts.fn.call(opts, event, target);
          })
        );
      } else {
        // prettier-ignore
        let target = typeof opts.el === 'string' ? rel.querySelector(opts.el) :
          (Array.isArray(opts.el) ? opts.el[0] : opts.el);
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
        const errorObj = {error: err.toJSON()};

        if (err.response) {
          errorObj.response = {status: err.response.status, headers: err.response.headers, data: err.response.data};
        }

        app.showJavascriptErrorDialog(err.message,
          esc(`HTTP ${err.config.method.toUpperCase()} Request to ${err.config.url}`),
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
    generateOL(text, hideTl) {
      return axios
        .get(`${this.base_uri}/OL/generate`, {
          params: {text: text, hideTl: hideTl ? 'true' : 'false'}
        })
        .then(response => response.data)
        .catch(this.general_error_handler);
    },
    generateSingleDialogueBranch(text, asHTML = false) {
      return axios
        .get(`${this.base_uri}/dialogue/single-branch-generate`, {
          params: {text: text},
          headers: {
            'Accept': asHTML ? 'text/html' : 'application/json',
            'Content-Type': asHTML ? 'text/html' : 'application/json',
          }
        })
        .then(response => response.data)
        .catch(this.general_error_handler);
    },
  },
  widgets: {
    multi_input(element, opts = {}) {
      waitForConstant('MultiInput', MultiInput => {
        new MultiInput(element, Object.assign({
          afterClassNames(classNames, lang) {
            classNames.item_create.push('primary', 'primary--2');
            lang.item_remove_text = '<span class="close small"></span>';
          }
        }, opts || {}));
      });
    },
    tree(element, opts = {}) {
      waitForConstant('Tree', Tree => {
        new Tree(element, opts || {});
      });
    },
    /** @param {Element} selectEl */
    tail_select(selectEl) {
      function updateTailLabel(tail) {
        let option = tail.options.selected[0];
        if (option && option.hasAttribute('style'))
          tail.label.setAttribute('style', option.getAttribute('style'));
        else
          tail.label.removeAttribute('style');
      }

      waitForConstant('tail', tail => {
        tail.select(selectEl, {
          search: true,
          descriptions: true,
          cbLoopItem: function(item, optgroup, search, root){
            let li = document.createElement("LI");
            li.classList.add('dropdown-option');

            if (item.selected) {
              li.classList.add('selected');
            }

            if (item.option.hasAttribute('style')) {
              li.setAttribute('style', item.option.getAttribute('style'));
            }

            let html = `<span>`;

            if (item.option.hasAttribute('data-icon')) {
              html += `<img role="presentation" class="channel-icon" src="${item.option.getAttribute('data-icon')}"/>`;
            }

            if (item.option.innerText === '(none)') {
              html += `(none)</span>`;
            } else {
              let label = esc(item.option.innerText.split('(')[0].trim());
              if (search) {
                label = label.replace(new RegExp('('+search+')', 'gi'), '<mark>$1</mark>');
              }
              html += label + '</span>';
            }

            if (item.description) {
              html += `<span class="option-description">${item.description}</span>`;
            }

            li.innerHTML = html;

            return li;
          },
          cbComplete: function() {
            updateTailLabel(this);
          }
        }).on('change', function(item, state) {
          updateTailLabel(this);
        }).on('open', function(item, state) {
          updateTailLabel(this);
        }).on('close', function(item, state) {
          updateTailLabel(this);
        });
      });
    },
  },
  loadWidgets() {
    document.querySelectorAll('[ui-widget]').forEach(el => {
      let widgetType = el.getAttribute('ui-widget').replace(/-/g, '_');
      el.removeAttribute('ui-widget');

      let widgetOpts = el.getAttribute('ui-widget-opts');

      if (widgetOpts) {
        el.removeAttribute('ui-widget-opts');
        widgetOpts = eval('(() => (' + widgetOpts + '))()');
      }

      if (this.widgets[widgetType]) {
        if (widgetOpts) {
          this.widgets[widgetType](el, widgetOpts);
        } else {
          this.widgets[widgetType](el);
        }
      }
    });
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
            <div class="toast-title">${opts.escapeHTML ? esc(opts.title) : opts.title}</div>
            <div class="toast-desc">${opts.escapeHTML ? esc(opts.content) : opts.content}</div>
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
        const prevToast = toast.previousElementSibling;
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

      var inner, type_name;

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
          <div class="AppDialog" data-type="${type_name}" ${opts.dialog_class ? 'class="'+esc(opts.dialog_class)+'"' : ''} ${opts.dialog_style ? 'style="'+esc(opts.dialog_style)+'"' : ''}>
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
        var selInput = document.querySelector(app.getFocusableSelector(`#${id}`));
        if (selInput) {
          if (selInput.focus)
            selInput.focus();
          if (selInput.select)
            selInput.select();
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
      var tag = e.target.tagName.toUpperCase();

      var key = e.which || e.keyCode || 0;
      if (key === 13 && tag != 'TEXTAREA' && tag != 'INPUT' && tag != 'SELECT') app.dialog.close();
      if (key === 27) app.dialog.close();
    },
    close() {
      document.querySelectorAll('.AppDialogOuter').forEach(el => el.remove());
      document.body.removeEventListener('keyup', app.dialog.active_listener);
    },
  },
};

if (!window.app) {
  window.app = app;
}

if (/comp|inter|loaded/.test(document.readyState)) {
  app.startListeners(app.initial_listeners);
} else {
  document.addEventListener(
    'DOMContentLoaded',
    app.startListeners.bind(null, app.initial_listeners)
  );
}
