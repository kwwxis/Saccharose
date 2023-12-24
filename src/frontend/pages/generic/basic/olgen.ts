import { Listener, startListeners } from '../../../util/eventLoader.ts';
import Cookies from 'js-cookie';
import { flashTippy } from '../../../util/tooltips.ts';
import {
  errorHtmlWrap,
  getOLEndpoint,
} from '../../../endpoints.ts';
import { pageMatch } from '../../../pageMatch.ts';
import { HttpError } from '../../../../shared/util/httpError.ts';
import { pasteFromClipboard } from '../../../util/domutil.ts';

pageMatch('pages/generic/basic/olgen', () => {
  const {endpoint, tlRmDisabled, neverDefaultHidden} = getOLEndpoint();

  function loadResultFromURL() {
    const url = new URL(window.location.href);
    const query = url.searchParams.get('q');
    window.history.replaceState({q: query}, null, window.location.href);
    if (query) {
      document.querySelector<HTMLInputElement>('.ol-input').value = query;
      generateResult(true);
    } else {
      document.querySelector<HTMLInputElement>('.ol-input').value = '';
    }
  }

  function loadResultFromState(state) {
    if (!state)
      state = {};
    document.querySelector<HTMLInputElement>('.ol-input').value = state.q || '';
    if (state.q) {
      generateResult(true);
    } else {
      document.querySelector('#ol-results-list').innerHTML = '';
    }
  }

  function generateResult(isNonUserAction: boolean = false) {
    let inputEl = document.querySelector<HTMLInputElement>('.ol-input');
    let buttonEl  = document.querySelector<HTMLButtonElement>('.ol-submit');
    let loadingEl = document.querySelector<HTMLElement>('.ol-submit-pending');
    let tlOptionValue = document.querySelector<HTMLInputElement>('input[type="radio"][name="tl_options"]:checked').value;
    let rmOptionValue = document.querySelector<HTMLInputElement>('input[type="radio"][name="rm_options"]:checked').value;
    let includeHeader = document.querySelector<HTMLInputElement>('input[type="checkbox"][name="ol_header"]').checked;
    let text = inputEl.value.trim();

    if (!text) {
      flashTippy(inputEl, {content: 'Enter a name first!', delay:[0,2000]});
      return;
    }

    loadingEl.classList.remove('hide');
    inputEl.disabled = true;
    buttonEl.disabled = true;

    const url = new URL(window.location.href);
    url.searchParams.set('q', text);
    if (isNonUserAction) {
      window.history.replaceState({q: text}, null, url.href);
    } else {
      window.history.pushState({q: text}, null, url.href);
    }

    endpoint.get({
      text,
      hideTl: tlRmDisabled || tlOptionValue === 'exclude_tl',
      addDefaultHidden: !neverDefaultHidden && tlOptionValue === 'exclude_tl',
      hideRm: tlRmDisabled || rmOptionValue === 'exclude_rm',
      includeHeader: includeHeader ? '1' : undefined,
    }, true).then(result => {
      document.querySelector('#ol-results-list').innerHTML = result;
    }).catch((err: HttpError) => {
      if (err.type === 'NotFound') {
        document.querySelector('#ol-results-list').innerHTML = errorHtmlWrap('Not Found: ' + err.message);
      } else {
        document.querySelector('#ol-results-list').innerHTML = errorHtmlWrap(err.message);
      }
    }).finally(() => {
      loadingEl.classList.add('hide');
      inputEl.disabled = false;
      buttonEl.disabled = false;

      if (inputEl.value.trim().length) {
        document.querySelector('.ol-input-clear').classList.remove('hide');
      } else {
        document.querySelector('.ol-input-clear').classList.add('hide');
      }
    });
  }

  if (/firefox/i.test(navigator.userAgent)) {
    document.querySelector('.ol-input-paste').remove();
  } else {
    document.querySelector('.ol-input-clear').classList.add('with-paste-button');
  }

  const listeners: Listener[] = [
    {
      ev: 'ready',
      fn: function() {
        loadResultFromURL();
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
      el: '.ol-input',
      ev: 'enter',
      fn: function(_event, _target) {
        generateResult();
      }
    },
    {
      el: '.ol-input',
      ev: 'input',
      fn: function(_event, target: HTMLInputElement) {
        if (target.value.trim().length) {
          document.querySelector('.ol-input-clear').classList.remove('hide');
        } else {
          document.querySelector('.ol-input-clear').classList.add('hide');
        }
      }
    },
    {
      el: '.ol-input-clear',
      ev: 'click',
      fn: function(_event) {
        let inputEl = document.querySelector<HTMLInputElement>('.ol-input');
        inputEl.value = '';
        inputEl.focus();
        document.querySelector('.ol-input-clear').classList.add('hide');
      }
    },
    {
      el: '.ol-input-paste',
      ev: 'click',
      fn: async function(_event) {
        let inputEl = document.querySelector<HTMLInputElement>('.ol-input');
        inputEl.value = '';
        inputEl.focus();
        await pasteFromClipboard(inputEl);
        if (inputEl.value.length) {
          document.querySelector('.ol-input-clear').classList.remove('hide');
        } else {
          document.querySelector('.ol-input-clear').classList.add('hide');
        }
      }
    },
    {
      el: 'input[type="radio"][name="tl_options"],input[type="radio"][name="rm_options"]',
      ev: 'input',
      multiple: true,
      fn: function(event, target: HTMLInputElement) {
        let name = target.name;
        let value = target.value;
        Cookies.set('OL.'+name, value, { expires: 365 });
      }
    },
    {
      el: 'input[type="checkbox"][name="ol_header"]',
      ev: 'input',
      multiple: true,
      fn: function(event, target: HTMLInputElement) {
        if (target.checked) {
          Cookies.set('OL.includeHeader', '1', { expires: 365 });
        } else {
          Cookies.remove('OL.includeHeader');
        }
      }
    },
    {
      el: '.ol-submit',
      ev: 'click',
      fn: function(_event, _target) {
        generateResult();
      }
    },
  ];

  startListeners(listeners);
});