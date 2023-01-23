import { startListeners } from '../../util/eventLoader';
import { endpoints } from '../../endpoints';
import { flashTippy } from '../../util/tooltips';
import { pageMatch } from '../../pageMatch';

pageMatch('pages/item/readables-search', () => {
  function loadResultFromURL() {
    const url = new URL(window.location.href);
    const query = url.searchParams.get('q');
    window.history.replaceState({q: query}, null, window.location.href);
    if (query) {
      document.querySelector<HTMLInputElement>('.search-input').value = query;
      generateResult(true);
    } else {
      document.querySelector<HTMLInputElement>('.search-input').value = '';
    }
  }

  function loadResultFromState(state) {
    if (!state)
      state = {};
    document.querySelector<HTMLInputElement>('.search-input').value = state.q || '';
    if (state.q) {
      generateResult(true);
    } else {
      document.querySelector('#search-result').innerHTML = '';
    }
  }

  function generateResult(isNonUserAction: boolean = false) {
    let buttonEl = document.querySelector<HTMLInputElement>('.search-submit');
    let inputEl = document.querySelector<HTMLInputElement>('.search-input');
    let loadingEl = document.querySelector('.search-submit-pending');
    let text = inputEl.value.trim();

    if (!text) {
      flashTippy(inputEl, {content: 'Enter something in first!', delay:[0,2000]});
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

    endpoints.searchReadables(text, true).then(result => {
      if (typeof result === 'string') {
        document.querySelector('#search-result').innerHTML = result;
      } else if (typeof result === 'object' && result.message) {
        document.querySelector('#search-result').innerHTML = endpoints.errorHtmlWrap(result.message);
      }
    }).finally(() => {
      loadingEl.classList.add('hide');
      inputEl.disabled = false;
      buttonEl.disabled = false;
    });
  }

  const listeners = [
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
      el: '.search-input',
      ev: 'enter',
      fn: function(event, target) {
        generateResult();
      }
    },
    {
      el: '.search-submit',
      ev: 'click',
      fn: function(event, target) {
        generateResult();
      }
    },
  ];

  startListeners(listeners);
});