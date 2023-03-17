import { flashTippy } from '../util/tooltips';
import { endpoints } from '../endpoints';
import { startListeners } from '../util/eventLoader';
import { GeneralEventBus } from '../generalEventBus';

export interface GenericSearchPageHandle {
  generateResult(caller: string): void;
  loadResultFromURL();
  loadResultFromState(state: any);
}

export function startGenericSearchPageListeners(opts: {
  endpoint: ((input: string|number, asHTML?: boolean) => Promise<any>)|((input: string|number, input2?: string|number, asHTML?: boolean) => Promise<any>),

  // Primary Input:
  inputTarget?: string,
  inputUrlParam?: string,
  inputGuards?: ((text: string) => string)[],
  inputMapper?: (text: string|number) => string|number,

  // Secondary Input:
  secondaryInputTarget?: string,
  secondaryInputRequired?: boolean,
  secondaryInputUrlParam?: string,
  secondaryInputGuards?: ((text: string|number) => string)[],
  secondaryInputMapper?: (text: string) => string|number,

  // Submit Buttons/Result:
  submitPendingTarget?: string,
  submitButtonTarget?: string,
  resultTarget?: string,

  // Events:
  beforeGenerateResult?: (caller?: string) => void,
  onReceiveResult?: (caller?: string, resultContainer?: HTMLElement, result?: any, preventDefault?: () => void) => void,
  afterProcessResult?: (caller?: string, resultContainer?: HTMLElement, result?: any) => void,
  afterInit?: (handle?: GenericSearchPageHandle) => void,
}) {
  let lastSuccessfulStateData: any = null;

  opts = Object.assign({
    inputTarget: '.search-input',
    submitPendingTarget: '.search-submit-pending',
    submitButtonTarget: '.search-submit',
    resultTarget: '#search-result',

    inputUrlParam: 'q',
    secondaryInputUrlParam: 'q2',
  }, opts);

  function loadResultFromURL() {
    const inputEl = document.querySelector<HTMLInputElement>(opts.inputTarget);
    const secondaryInputEl = opts.secondaryInputTarget ? document.querySelector<HTMLInputElement>(opts.secondaryInputTarget) : null;

    const url = new URL(window.location.href);
    const query = url.searchParams.get(opts.inputUrlParam) || '';
    const query2 = url.searchParams.get(opts.secondaryInputUrlParam) || '';

    let stateData = {[opts.inputUrlParam]: query};
    if (secondaryInputEl) {
      stateData[opts.secondaryInputUrlParam] = query2;
    }

    window.history.replaceState(stateData, null, window.location.href);
    if (query) {
      if (secondaryInputEl && opts.secondaryInputRequired && !query2) {
        inputEl.value = '';
        secondaryInputEl.value = '';
        return;
      }
      inputEl.value = query;
      if (secondaryInputEl) {
        secondaryInputEl.value = query2;
      }
      generateResult('nonUserAction');
    } else {
      inputEl.value = '';
      if (secondaryInputEl) {
        secondaryInputEl.value = '';
      }
    }
  }

  function loadResultFromState(state: any) {
    if (!state)
      state = {};

    document.querySelector<HTMLInputElement>(opts.inputTarget).value = state[opts.inputUrlParam] || '';

    const secondaryInputEl = opts.secondaryInputTarget ? document.querySelector<HTMLInputElement>(opts.secondaryInputTarget) : null;
    if (secondaryInputEl) {
      secondaryInputEl.value = state[opts.secondaryInputUrlParam] || '';
    }

    if (state[opts.inputUrlParam]) {
      generateResult('nonUserAction');
    } else {
      document.querySelector(opts.resultTarget).innerHTML = '';
    }
  }

  function generateResult(caller: string) {
    if (opts.beforeGenerateResult) {
      opts.beforeGenerateResult(caller);
    }

    const inputEl = document.querySelector<HTMLInputElement>(opts.inputTarget);
    let text: string|number = inputEl.value.trim();
    if (inputEl) {
      if (!text) {
        flashTippy(inputEl, {content: 'Enter something in first!', delay:[0,2000]});
        return;
      }
      if (opts.inputMapper) {
        text = opts.inputMapper(text);
      }
      for (let inputGuard of (opts.inputGuards || [])) {
        let result = inputGuard(String(text));
        if (!!result && typeof result === 'string') {
          flashTippy(inputEl, {content: result, delay:[0,2000]});
          return;
        }
      }
    }

    const secondaryInputEl = opts.secondaryInputTarget ? document.querySelector<HTMLInputElement>(opts.secondaryInputTarget) : null;
    let secondaryText: string|number = secondaryInputEl ? secondaryInputEl.value.trim() : null;
    if (secondaryInputEl) {
      if (opts.secondaryInputRequired && !secondaryText) {
        flashTippy(secondaryInputEl, {content: 'Enter something in first!', delay:[0,2000]});
        return;
      }
      if (opts.secondaryInputMapper) {
        secondaryText = opts.secondaryInputMapper(String(secondaryText));
      }
      for (let inputGuard of (opts.secondaryInputGuards || [])) {
        let result = inputGuard(text);
        if (!!result && typeof result === 'string') {
          flashTippy(inputEl, {content: result, delay:[0,2000]});
          return;
        }
      }
    }

    const buttonEl = document.querySelector<HTMLInputElement>(opts.submitButtonTarget);
    const loadingEl = document.querySelector(opts.submitPendingTarget);
    loadingEl.classList.remove('hide');
    buttonEl.disabled = true;
    inputEl.disabled = true;
    if (secondaryInputEl) {
      secondaryInputEl.disabled = true;
    }

    const url = new URL(window.location.href);
    url.searchParams.set(opts.inputUrlParam, String(text));
    let stateData = {[opts.inputUrlParam]: text};
    if (secondaryInputEl) {
      if (secondaryText) {
        url.searchParams.set(opts.secondaryInputUrlParam, String(secondaryText));
        stateData[opts.secondaryInputUrlParam] = secondaryText;
      } else if (url.searchParams.has(opts.secondaryInputUrlParam)) {
        url.searchParams.delete(opts.secondaryInputUrlParam);
      }
    }
    if (caller === 'nonUserAction') {
      window.history.replaceState(stateData, null, url.href);
    } else {
      window.history.pushState(stateData, null, url.href);
    }

    opts.endpoint.apply(endpoints, secondaryInputEl ? [text, secondaryText, true] :  [text, true]).then(result => {
      lastSuccessfulStateData = stateData;

      const resultTargetEl: HTMLElement = document.querySelector(opts.resultTarget);
      let preventDefaultRes = false;

      if (opts.onReceiveResult) {
        let preventDefaultFn = () => preventDefaultRes = true;
        opts.onReceiveResult(caller, resultTargetEl, result, preventDefaultFn);
      }

      if (!preventDefaultRes) {
        if (typeof result === 'string') {
          resultTargetEl.innerHTML = result;
        } else if (typeof result === 'object' && result.message) {
          resultTargetEl.innerHTML = endpoints.errorHtmlWrap(result.message);
        }
      }

      if (opts.afterProcessResult) {
        opts.afterProcessResult(caller, resultTargetEl, result)
      }
    }).finally(() => {
      loadingEl.classList.add('hide');
      inputEl.disabled = false;
      buttonEl.disabled = false;
      if (secondaryInputEl) {
        secondaryInputEl.disabled = false;
      }
    });
  }

  GeneralEventBus.on('outputLangCodeChanged', () => {
    if (lastSuccessfulStateData) {
      loadResultFromState(lastSuccessfulStateData);
    }
  });

  const listeners = [
    {
      ev: 'ready',
      fn: function() {
        loadResultFromURL();
        if (opts.afterInit) {
          opts.afterInit({
            generateResult(caller: string) {
              generateResult(caller);
            },
            loadResultFromURL() {
              loadResultFromURL();
            },
            loadResultFromState(state: any) {
              loadResultFromState(state);
            }
          })
        }
      }
    },
    {
      el: 'window',
      ev: 'popstate', // user clicks browser back/forward buttons
      fn: function(event: PopStateEvent) {
        if (!event.state) {
          return;
        }
        console.log('[popstate] URL changed to', window.location.href, ' / state:', event.state);
        loadResultFromState(event.state);
      }
    },
    {
      el: opts.inputTarget,
      ev: 'enter',
      fn: function(event, target) {
        generateResult('inputEnter');
      }
    },
    {
      el: opts.submitButtonTarget,
      ev: 'click',
      fn: function(event, target) {
        generateResult('submitButtonClick');
      }
    },
  ];

  if (opts.secondaryInputTarget) {
    listeners.push({
      el: opts.secondaryInputTarget,
      ev: 'enter',
      fn: function(event, target) {
        generateResult('inputEnter');
      }
    })
  }

  startListeners(listeners);
}