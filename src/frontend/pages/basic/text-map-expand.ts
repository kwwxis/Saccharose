import { startListeners } from '../../util/eventLoader';
import { escapeHtml } from '../../../shared/util/stringUtil';
import { endpoints } from '../../endpoints';
import { flashTippy } from '../../util/tooltips';
import { pageMatch } from '../../pageMatch';

pageMatch('pages/basic/text-map-expand', () => {
  const listeners = [
    {
      el: '.search-input',
      ev: 'enter',
      fn: function(event, target) {
        document.querySelector<HTMLButtonElement>('.search-submit').click();
      }
    },
    {
      el: '.search-submit',
      ev: 'click',
      fn: function(event, target) {
        let inputEl = document.querySelector<HTMLInputElement>('.search-input');
        let loadingEl = document.querySelector('.search-submit-pending');
        let text = inputEl.value.trim();

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
        target.disabled = true;

        endpoints.searchTextMap(text, true).then(result => {
          if (typeof result === 'string') {
            document.querySelector('#search-result').innerHTML = result;
          } else if (typeof result === 'object' && result.error_description) {
            document.querySelector('#search-result').innerHTML = endpoints.errorHtmlWrap(result.error_description);
          }
        }).finally(() => {
          loadingEl.classList.add('hide');
          inputEl.disabled = false;
          target.disabled = false;
        });
      }
    },
  ];

  startListeners(listeners);
});