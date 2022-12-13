import { flashTippy } from '../../util/tooltips';
import { endpoints } from '../../endpoints';
import { escapeHtml } from '../../../shared/util/stringUtil';
import { startListeners } from '../../util/eventLoader';
import { pageMatch } from '../../pageMatch';

pageMatch('pages/dialogue/branch-dialogue', () => {
  function loadResultFromURL() {
    const url = new URL(window.location.href);
    const query = url.searchParams.get('q');
    const npc = url.searchParams.get('npc');
    window.history.replaceState({q: query, npc: npc}, null, window.location.href);
    if (npc) {
      document.querySelector<HTMLInputElement>('.npc-filter-input').value = npc;
    } else {
      document.querySelector<HTMLInputElement>('.npc-filter-input').value = '';
    }
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
    document.querySelector<HTMLInputElement>('.npc-filter-input').value = state.npc || '';
    if (state.q) {
      generateResult(true);
    } else {
      document.querySelector('#dialogue-generate-result').innerHTML = '';
    }
  }

  function generateResult(isNonUserAction = false) {
    let inputEl = document.querySelector<HTMLInputElement>('.dialogue-generate-input');
    let npcFilterEl = document.querySelector<HTMLInputElement>('.npc-filter-input');
    let loadingEl = document.querySelector<HTMLElement>('.dialogue-generate-submit-pending');
    let buttonEl = document.querySelector<HTMLButtonElement>('.dialogue-generate-submit');
    let text = inputEl.value.trim();
    let npcFilter = npcFilterEl.value.trim();

    if (!text) {
      flashTippy(inputEl, {content: 'Enter something in first!', delay:[0,2000]});
      return;
    }

    if (text.length < 3) {
      flashTippy(inputEl, {content: 'Enter at least 3 characters.', delay:[0,2000]});
      return;
    }

    loadingEl.classList.remove('hide');
    inputEl.disabled = true;
    buttonEl.disabled = true;

    const url = new URL(window.location.href);
    url.searchParams.set('q', text);
    if (!npcFilter) {
      if (url.searchParams.has('npc')) {
        url.searchParams.delete('npc');
      }
    } else {
      url.searchParams.set('npc', npcFilter);
    }
    if (isNonUserAction) {
      window.history.replaceState({q: text, npc: npcFilter}, null, url.href);
    } else {
      window.history.pushState({q: text, npc: npcFilter}, null, url.href);
    }

    endpoints.generateSingleDialogueBranch(text, npcFilter, true).then(result => {
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
      el: '.npc-filter-input',
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