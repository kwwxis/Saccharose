import { flashTippy } from '../../util/tooltips';
import { endpoints } from '../../endpoints';
import { startListeners } from '../../util/eventLoader';
import { escapeHtml } from '../../../shared/util/stringUtil';
import { pageMatch } from '../../pageMatch';

pageMatch('pages/dialogue/npc-dialogue', () => {
  function loadResultFromURL() {
    const url = new URL(window.location.href);
    const query = url.searchParams.get('q');
    window.history.replaceState({q: query}, null, window.location.href);
    if (query) {
      document.querySelector<HTMLInputElement>('.dialogue-generate-input').value = query;
      generateResult(true);
    } else {
      document.querySelector<HTMLInputElement>('.dialogue-generate-input').value = '';
    }
  }

  function loadResultFromState(state) {
    if (!state)
      state = {};
    document.querySelector<HTMLInputElement>('.dialogue-generate-input').value = state.q || '';
    if (state.q) {
      generateResult(true);
    } else {
      document.querySelector('#dialogue-generate-result').innerHTML = '';
    }
  }

  function generateResult(isNonUserAction = false) {
    let inputEl = document.querySelector<HTMLInputElement>('.dialogue-generate-input');
    let loadingEl = document.querySelector('.dialogue-generate-submit-pending');
    let buttonEl = document.querySelector<HTMLButtonElement>('.dialogue-generate-submit');
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

    endpoints.generateNpcDialogue(text, true).then(result => {
      if (typeof result === 'string') {
        document.querySelector('#dialogue-generate-result').innerHTML = result;
      } else if (typeof result === 'object' && result.error_description) {
        document.querySelector('#dialogue-generate-result').innerHTML = endpoints.errorHtmlWrap(result.error_description);
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
        // Replace state on load to populate state to distinguish hashchanges in popstate
        loadResultFromURL();
      }
    },
    {
      el: 'window',
      ev: 'popstate', // user clicks browser back/forward buttons
      fn: function(event) {
        if (!event.state) {
          return;
        }
        console.log('[popstate] URL changed to', window.location.href, ' / state:', event.state);
        loadResultFromState(event.state);
      }
    },
    {
      el: '.dialogue-generate-input',
      ev: 'enter',
      fn: function(event, target) {
        generateResult();
      }
    },
    {
      el: '.dialogue-generate-submit',
      ev: 'click',
      fn: function(event, target) {
        generateResult();
      }
    },
  ];

  startListeners(listeners);
});