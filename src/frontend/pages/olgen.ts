import { startListeners } from '../util/eventLoader';
import Cookies from 'js-cookie';
import { flashTippy } from '../util/tooltips';
import { copyToClipboard } from '../util/domutil';
import { endpoints } from '../endpoints';
import { pageMatch } from '../pageMatch';

pageMatch('pages/olgen', () => {
  const listeners = [
    {
      el: '.ol-input',
      ev: 'enter',
      fn: function(event, target) {
        document.querySelector<HTMLButtonElement>('.ol-submit').click();
      }
    },
    {
      el: 'input[type="radio"][name="tl_options"],input[type="radio"][name="rm_options"]',
      ev: 'input',
      multiple: true,
      fn: function(event, target) {
        let name = target.name;
        let value = target.value;
        Cookies.set('OL.'+name, value, { expires: 365 });
      }
    },
    {
      el: '.ol-submit',
      ev: 'click',
      fn: function(event, target) {
        let inputEl: HTMLInputElement = document.querySelector('.ol-input');
        let loadingEl = document.querySelector('.ol-submit-pending');
        let tlOptionValue = document.querySelector<HTMLInputElement>('input[type="radio"][name="tl_options"]:checked').value;
        let rmOptionValue = document.querySelector<HTMLInputElement>('input[type="radio"][name="rm_options"]:checked').value;
        let text = inputEl.value.trim();

        if (!text) {
          flashTippy(inputEl, {content: 'Enter a name first!', delay:[0,2000]});
          return;
        }

        loadingEl.classList.remove('hide');
        inputEl.disabled = true;
        target.disabled = true;

        endpoints.generateOL(text, tlOptionValue === 'exclude_tl', tlOptionValue === 'exclude_tl', rmOptionValue === 'exclude_rm', true).then(result => {
          if (typeof result === 'string') {
            document.querySelector('#ol-results-list').innerHTML = result;
            if (!result.includes('no-results-found')) {
              inputEl.value = '';
            }
            startListeners([
              {
                el: '.ol-result-copy',
                ev: 'click',
                multiple: true,
                fn: function(event, target) {
                  copyToClipboard(target.closest('.ol-result').querySelector<HTMLInputElement>('.ol-result-textarea').value);
                }
              }
            ], document.querySelector<HTMLElement>('#ol-results-list'));
          } else if (typeof result === 'object' && result.error_description) {
            if (result.error_code === 'NOT_FOUND') {
              document.querySelector('#ol-results-list').innerHTML = 'Not Found: ' + result.error_description;
            } else {
              document.querySelector('#ol-results-list').innerHTML = result.error_code + ': ' + result.error_description;
            }
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