import { listen } from '../../../util/eventListen.ts';
import { flashTippy } from '../../../util/tooltipUtil.ts';
import {
  errorHtmlWrap,
  getOLEndpoint,
} from '../../../core/endpoints.ts';
import { pageMatch } from '../../../core/pageMatch.ts';
import { HttpError } from '../../../../shared/util/httpError.ts';
import { pasteFromClipboard } from '../../../util/domutil.ts';
import { toBoolean } from '../../../../shared/util/genericUtil.ts';
import { modalService } from '../../../util/modalService.ts';
import { getUserPref, setUserPref } from '../../../core/userPreferences/sitePrefsContainer.ts';

pageMatch('vue/OLGenPage', () => {
  const {endpoint, config} = getOLEndpoint();

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
    let excludeTl = getUserPref('ol_excludeTl', false);
    let excludeRm = getUserPref('ol_excludeRm', false);
    let includeHeader = getUserPref('ol_includeHeader', false);
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

    endpoint.send({
      text,
      hideTl: excludeTl || config.hideTlOption,
      addDefaultHidden: !config.neverDefaultHidden && excludeTl,
      hideRm: excludeRm || config.hideRmOption,
      includeHeader: includeHeader,
    }, null, true).then(result => {
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

  listen([
    {
      selector: 'document',
      event: 'ready',
      handle: function() {
        loadResultFromURL();
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
      selector: '.ol-input',
      event: 'enter',
      handle: function(_event, _target) {
        generateResult();
      }
    },
    {
      selector: '.ol-input',
      event: 'input',
      handle: function(_event, target: HTMLInputElement) {
        if (target.value.trim().length) {
          document.querySelector('.ol-input-clear').classList.remove('hide');
        } else {
          document.querySelector('.ol-input-clear').classList.add('hide');
        }
      }
    },
    {
      selector: '.ol-input-clear',
      event: 'click',
      handle: function(_event) {
        let inputEl = document.querySelector<HTMLInputElement>('.ol-input');
        inputEl.value = '';
        inputEl.focus();
        document.querySelector('.ol-input-clear').classList.add('hide');
      }
    },
    {
      selector: '.ol-input-paste',
      event: 'click',
      handle: async function(_event) {
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
      selector: 'input[type="radio"][name="ol_excludeTl"]',
      event: 'input',
      multiple: true,
      handle: async function(_event, target: HTMLInputElement) {
        target.disabled = true;
        await setUserPref('ol_excludeTl', toBoolean(target.value));
        target.disabled = false;
      }
    },
    {
      selector: 'input[type="radio"][name="ol_excludeRm"]',
      event: 'input',
      multiple: true,
      handle: async function(_event, target: HTMLInputElement) {
        target.disabled = true;
        await setUserPref('ol_excludeRm', toBoolean(target.value));
        target.disabled = false;
      }
    },
    {
      selector: 'input[type="checkbox"][name="ol_includeHeader"]',
      event: 'input',
      handle: async function(_event, target: HTMLInputElement) {
        target.disabled = true;
        await setUserPref('ol_includeHeader', target.checked);
        target.disabled = false;
      }
    },
    {
      selector: '.ol-submit',
      event: 'click',
      handle: function(_event, _target) {
        generateResult();
      }
    },
    {
      selector: '#ol-info-button',
      event: 'click',
      handle(_event) {
        modalService.modal('Info', `
          <p>This utility will only work if there is an exact entire-value match for the name you're looking for in the TextMap. If the only reference to the name you're looking for is in a larger line of text, then it won't be found.</p>
          <p class="spacer10-vert">e.g. it'd only match against <code style="font-size:0.85em">"Iris"</code> and not <code style="font-size:0.85em">"Cyrus' Letter to Iris"</code> if searching for <code>Iris</code></p>
          <p class="spacer10-vert">If there are multiple results, the differences will be highlighted in <span class="highlight">yellow</span>.</p>
          <p>* <code style="font-size:0.8em">[lang]_tl</code> params are automatically excluded if the language text is the same as EN text.</p>
        `);
      }
    }
  ]);
});
