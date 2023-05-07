import { flashTippy } from '../util/tooltips';
import { errorHtmlWrap, genshinEndpoints, SaccharoseApiEndpoint } from '../endpoints';
import { Listener, startListeners } from '../util/eventLoader';
import { GeneralEventBus } from '../generalEventBus';
import { HttpError } from '../../shared/util/httpError';

export interface GenericSearchPageHandle {
  generateResult(caller: string): void;
  loadResultFromURL();
  loadResultFromState(state: any);
  clearResult();
}

export type GenericSearchPageParamOpt<T> = {
  selector: string,
  apiParam: keyof T,
  queryParam?: string,
  clearButton?: string,
  guards?: ((text: string|number) => string)[],
  mapper?: (text: string) => string|number,
  required?: boolean
}

export type GenericSearchPageOpts<T> =  {
  endpoint: SaccharoseApiEndpoint<T>,

  inputs: [GenericSearchPageParamOpt<T>, ... GenericSearchPageParamOpt<T>[]],

  // Submit Buttons/Result:
  submitPendingTarget: string,
  submitButtonTarget: string,
  resultTarget: string,

  // Events:
  beforeGenerateResult?: (caller?: string) => void,
  onReceiveResult?: (caller?: string, resultContainer?: HTMLElement, html?: string, preventDefault?: () => void) => void,
  onReceiveError?: (caller?: string, resultContainer?: HTMLElement, err?: HttpError, preventDefault?: () => void) => void,
  afterProcessResult?: (caller?: string, resultContainer?: HTMLElement, result?: any) => void,
  afterInit?: (handle?: GenericSearchPageHandle) => void,
};

export function startGenericSearchPageListeners<T>(opts: GenericSearchPageOpts<T>) {
  let lastSuccessfulStateData: any = null;

  opts.inputs[0].required = true; // first input always required

  function loadResultFromURL() {
    const stateData = {};
    const url = new URL(window.location.href);

    let doGenerate: boolean = true;

    for (let opt of opts.inputs) {
      if (!opt.queryParam) {
        continue;
      }

      const val = url.searchParams.get(opt.queryParam) || '';
      stateData[opt.queryParam] = val;

      const el = document.querySelector<HTMLInputElement>(opt.selector);
      if (val) {
        el.value = val;
      } else {
        el.value = '';
        if (opt.required) {
          doGenerate = false;
        }
      }
    }

    window.history.replaceState(stateData, null, window.location.href);

    if (doGenerate) {
      generateResult('nonUserAction');
    } else {
      clearResult();
    }
  }

  function loadResultFromState(state: any) {
    if (!state)
      state = {};

    let doGenerate: boolean = true;

    for (let opt of opts.inputs) {
      if (!opt.queryParam) {
        continue;
      }

      const val = state[opt.queryParam];
      const el = document.querySelector<HTMLInputElement>(opt.selector);

      el.value = val || '';

      if (!val && opt.required) {
        doGenerate = false;
      }
    }

    if (doGenerate) {
      generateResult('nonUserAction');
    } else {
      clearResult();
    }
  }

  function clearResult() {
    document.querySelector(opts.resultTarget).innerHTML = '';
  }

  function generateResult(caller: string) {
    if (opts.beforeGenerateResult) {
      opts.beforeGenerateResult(caller);
    }

    const apiPayload: {[apiParam: string]: string|number} = {};
    const stateData: {[queryParam: string]: string} = {};
    const inputEls: HTMLInputElement[] = [];

    for (let opt of opts.inputs) {
      const el = document.querySelector<HTMLInputElement>(opt.selector);
      let val: string|number = el.value.trim();

      inputEls.push(el);

      if (opt.mapper) {
        val = opt.mapper(val);
      }

      if (opt.required && !val) {
        flashTippy(el, {content: 'Enter something in first!', delay:[0,2000]});
        return;
      }

      for (let guard of (opt.guards || [])) {
        let result = guard(val);
        if (typeof result === 'string') {
          flashTippy(el, {content: result, delay:[0,2000]});
          return;
        }
      }

      apiPayload[opt.apiParam as string] = val;

      if (opt.queryParam) {
        stateData[opt.queryParam] = String(val);
      }
    }

    const buttonEl = document.querySelector<HTMLInputElement>(opts.submitButtonTarget);
    const loadingEl = document.querySelector(opts.submitPendingTarget);
    const resultTargetEl: HTMLElement = document.querySelector(opts.resultTarget);

    loadingEl.classList.remove('hide');
    buttonEl.disabled = true;
    inputEls.forEach(el => el.disabled = true);

    const url = new URL(window.location.href);
    for (let opt of opts.inputs) {
      if (stateData[opt.queryParam]) {
        url.searchParams.set(opt.queryParam, stateData[opt.queryParam]);
      } else {
        url.searchParams.delete(opt.queryParam);
      }
    }

    if (caller === 'nonUserAction') {
      window.history.replaceState(stateData, null, url.href);
    } else {
      window.history.pushState(stateData, null, url.href);
    }

    opts.endpoint.get(apiPayload as any, true).then(result => {
      lastSuccessfulStateData = stateData;

      let preventDefault = false;

      if (opts.onReceiveResult) {
        let preventDefaultFn = () => preventDefault = true;
        opts.onReceiveResult(caller, resultTargetEl, result, preventDefaultFn);
      }

      if (!preventDefault) {
        if (typeof result === 'string') {
          resultTargetEl.innerHTML = result;
        }
      }

      if (opts.afterProcessResult) {
        opts.afterProcessResult(caller, resultTargetEl, result)
      }
    }).catch((err: HttpError) => {
      let preventDefault = false;

      if (opts.onReceiveError) {
        let preventDefaultFn = () => preventDefault = true;
        opts.onReceiveError(caller, resultTargetEl, err, preventDefaultFn);
      }

      if (!preventDefault) {
        resultTargetEl.innerHTML = errorHtmlWrap(err.message);
      }
    }).finally(() => {
      loadingEl.classList.add('hide');
      buttonEl.disabled = false;
      inputEls.forEach(el => el.disabled = false);
    });
  }

  GeneralEventBus.on('outputLangCodeChanged', () => {
    if (lastSuccessfulStateData) {
      loadResultFromState(lastSuccessfulStateData);
    }
  });

  const listeners: Listener[] = [
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
            },
            clearResult() {
              clearResult();
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
    ... opts.inputs.map(optInput => ({
      el: optInput.selector,
      ev: 'enter',
      fn: function(_event, _target) {
        generateResult('inputEnter');
      }
    })),
    ... opts.inputs.filter(x => x.clearButton).flatMap((optInput) => ([
      {
        el: optInput.clearButton,
        ev: 'click',
        fn: function(_event, _target) {
          let inputEl = document.querySelector<HTMLInputElement>(optInput.selector);
          inputEl.value = '';
          inputEl.focus();
          document.querySelector(optInput.clearButton).classList.add('hide');
        }
      },
      {
        el: optInput.selector,
        ev: 'input',
        fn: function(_event, target) {
          if (target.value.trim().length) {
            document.querySelector(optInput.clearButton).classList.remove('hide');
          } else {
            document.querySelector(optInput.clearButton).classList.add('hide');
          }
        }
      }
    ])),
    {
      el: opts.submitButtonTarget,
      ev: 'click',
      fn: function(_event, _target) {
        generateResult('submitButtonClick');
      }
    },
  ];

  startListeners(listeners);
}