import { flashTippy } from '../util/tooltipUtil.ts';
import { errorHtmlWrap, SaccharoseApiEndpoint } from '../core/endpoints.ts';
import { listen } from '../util/eventListen.ts';
import { HttpError } from '../../shared/util/httpError.ts';
import { pasteFromClipboard } from '../util/domutil.ts';
import { toBoolean } from '../../shared/util/genericUtil.ts';
import { onOutputLanguageChanged } from '../core/userPreferences/siteLanguage.ts';

export interface GenericSearchPageHandle {
  generateResult(caller: string): void;
  loadResultFromURL(): void;
  loadResultFromState(state: any): void;
  clearResult(): void;
}

export type GenericSearchPageParamOpt<T> = {
  selector: string,
  apiParam: keyof T,
  queryParam?: string,
  clearButton?: string,
  pasteButton?: string,
  guards?: ((text: string|number) => string)[],
  mapper?: (text: string) => string|number,
  required?: boolean
  disableEnterKeySubmit?: boolean,
}

export type GenericSearchPageOpts<T,R> =  {
  endpoint: SaccharoseApiEndpoint<T,R>,
  doPost?: boolean,

  inputs: [GenericSearchPageParamOpt<T>, ... GenericSearchPageParamOpt<T>[]],

  // Submit Buttons/Result:
  submitPendingTarget?: string,
  submitButtonTarget: string,
  resultTarget: string,

  // Events:
  beforeGenerateResult?: (caller?: string) => void,
  beforeSendRequest?: (caller?: string, apiPayload?: Record<string, string|number>) => void,
  onReceiveError?: (caller?: string, resultContainer?: HTMLElement, err?: HttpError, preventDefault?: () => void) => void,
  afterInit?: (handle?: GenericSearchPageHandle) => void,
} & ({
  asHtml: true,
  onReceiveResult?: (caller?: string, apiPayload?: Record<string, string|number>, resultContainer?: HTMLElement, htmlResult?: string, preventDefault?: () => void) => void,
  afterProcessResult?: (caller?: string, apiPayload?: Record<string, string|number>, resultContainer?: HTMLElement, htmlResult?: string) => void,
} | {
  asHtml: false,
  onReceiveResult?: (caller?: string, apiPayload?: Record<string, string|number>, resultContainer?: HTMLElement, result?: R, preventDefault?: () => void) => void,
  afterProcessResult?: (caller?: string, apiPayload?: Record<string, string|number>, resultContainer?: HTMLElement, result?: R) => void,
});

export function startGenericSearchPageListeners<T,R>(opts: GenericSearchPageOpts<T,R>) {
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

      if (el.type.toLowerCase() === 'checkbox' || el.type.toLowerCase() === 'radio') {
        if (toBoolean(val)) {
          el.checked = true;
        } else {
          el.checked = false;
          if (opt.required) {
            doGenerate = false;
          }
        }
      } else {
        if (val) {
          el.value = val;
        } else {
          el.value = '';
          if (opt.required) {
            doGenerate = false;
          }
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

      if (el.type.toLowerCase() === 'checkbox' || el.type.toLowerCase() === 'radio') {
        el.checked = toBoolean(val);
      } else {
        el.value = val || '';
      }

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

      if (el.type.toLowerCase() === 'checkbox' || el.type.toLowerCase() === 'radio') {
        if (!el.checked) {
          val = '';
        }
      }

      inputEls.push(el);

      if (opt.mapper) {
        val = opt.mapper(val);
      }

      if (opt.required && !val) {
        if (caller !== 'nonUserAction') {
          flashTippy(el, {content: 'Enter something in first!', delay:[0,2000]});
        }
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
        if (el.type.toLowerCase() === 'checkbox' || el.type.toLowerCase() === 'radio') {
          if (el.checked) {
            stateData[opt.queryParam] = String(val);
          }
        } else {
          stateData[opt.queryParam] = String(val);
        }
      }
    }

    const buttonEl = document.querySelector<HTMLInputElement>(opts.submitButtonTarget);
    const loadingEl = opts.submitPendingTarget && document.querySelector(opts.submitPendingTarget);
    const loadingUseVisHide = loadingEl && loadingEl.classList.contains('visHide');
    const resultTargetEl: HTMLElement = document.querySelector(opts.resultTarget);

    if (loadingEl) {
      loadingEl.classList.remove(loadingUseVisHide ? 'visHide' : 'hide');
    }
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

    if (opts.beforeSendRequest) {
      opts.beforeSendRequest(caller, apiPayload);
    }

    let endpointRes: Promise<string | R>;

    if (opts.doPost) {
      endpointRes = opts.endpoint.send(null, apiPayload as any, opts.asHtml);
    } else {
      endpointRes = opts.endpoint.send(apiPayload as any, null, opts.asHtml);
    }

    endpointRes.then(result => {
      lastSuccessfulStateData = stateData;

      let preventDefault = false;

      if (opts.onReceiveResult) {
        let preventDefaultFn = () => preventDefault = true;
        opts.onReceiveResult(caller, apiPayload, resultTargetEl, result as any, preventDefaultFn);
      }

      if (!preventDefault) {
        if (typeof result === 'string') {
          resultTargetEl.innerHTML = result;
          resultTargetEl.classList.remove('hide');
        }
      }

      if (opts.afterProcessResult) {
        opts.afterProcessResult(caller, apiPayload, resultTargetEl, result as any)
      }
    }).catch((err: HttpError) => {
      let preventDefault = false;

      console.error('Error in generic search handler', err);

      if (opts.onReceiveError) {
        let preventDefaultFn = () => preventDefault = true;
        opts.onReceiveError(caller, resultTargetEl, err, preventDefaultFn);
      }

      if (!preventDefault) {
        resultTargetEl.innerHTML = errorHtmlWrap(err.message);
        resultTargetEl.classList.remove('hide');
      }
    }).finally(() => {
      if (loadingEl)
        loadingEl.classList.add(loadingUseVisHide ? 'visHide' : 'hide');
      buttonEl.disabled = false;
      inputEls.forEach(el => el.disabled = false);
    });
  }

  onOutputLanguageChanged(() => {
    if (lastSuccessfulStateData) {
      loadResultFromState(lastSuccessfulStateData);
    }
  });

  const isFirefox: boolean = /firefox/i.test(navigator.userAgent);

  listen([
    {
      selector: 'document',
      event: 'ready',
      handle: function() {
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
      selector: 'window',
      event: 'popstate', // user clicks browser back/forward buttons
      handle: function(event: PopStateEvent) {
        if (!event.state) {
          return;
        }
        console.log('[popstate] URL changed to', window.location.href, ' / state:', event.state);
        loadResultFromState(event.state);
      }
    },
    {
      selector: opts.submitButtonTarget,
      event: 'click',
      handle: function(_event, _target) {
        generateResult('submitButtonClick');
      }
    },
  ]);

  listen(
    opts.inputs
      .filter(optInput => !optInput.disableEnterKeySubmit)
      .map(optInput => ({
        selector: optInput.selector,
        event: 'enter',
        handle: function(_event: Event, _target) {
          generateResult('inputEnter');
        }
      }))
  );

  listen(
    opts.inputs.filter(x => x.clearButton).map(optInput => {
      if (optInput.pasteButton && !isFirefox) {
        document.querySelector(optInput.clearButton).classList.add('with-paste-button');
      }
      document.querySelector(optInput.clearButton).setAttribute('ui-tippy', 'Clear');
      return optInput;
    }).flatMap((optInput) => ([
      {
        selector: optInput.clearButton,
        event: 'click',
        handle: function(_event, _target) {
          let inputEl = document.querySelector<HTMLInputElement>(optInput.selector);
          inputEl.value = '';
          inputEl.focus();
          document.querySelector(optInput.clearButton).classList.add('hide');
        }
      },
      {
        selector: optInput.selector,
        event: 'input',
        handle: function(_event, target: HTMLInputElement) {
          if (target.value.trim().length) {
            document.querySelector(optInput.clearButton).classList.remove('hide');
          } else {
            document.querySelector(optInput.clearButton).classList.add('hide');
          }
        }
      }
    ]))
  );

  listen(
    opts.inputs.filter(x => x.pasteButton).map(optInput => {
      if (isFirefox) {
        document.querySelector(optInput.pasteButton).remove();
        return null;
      } else {
        document.querySelector(optInput.pasteButton).setAttribute('ui-tippy', 'Paste');
        return optInput;
      }
    }).filter(x => !!x).flatMap((optInput) => ([
      {
        selector: optInput.pasteButton,
        event: 'click',
        handle: async function(_event, _target) {
          let inputEl = document.querySelector<HTMLInputElement>(optInput.selector);
          inputEl.value = '';
          inputEl.focus();
          await pasteFromClipboard(inputEl);
          if (optInput.clearButton) {
            if (inputEl.value.length) {
              document.querySelector(optInput.clearButton).classList.remove('hide');
            } else {
              document.querySelector(optInput.clearButton).classList.add('hide');
            }
          }
        }
      },
      {
        selector: optInput.selector,
        event: 'input',
        handle: function(_event, target: HTMLInputElement) {
          if (target.value.trim().length) {
            document.querySelector(optInput.pasteButton).setAttribute('ui-tippy', 'Clear and Paste');
          } else {
            document.querySelector(optInput.pasteButton).setAttribute('ui-tippy', 'Paste');
          }
        }
      }
    ]))
  );
}
