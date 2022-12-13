import { startListeners } from '../../util/eventLoader';
import { escapeHtml } from '../../../shared/util/stringUtil';
import { endpoints } from '../../endpoints';
import { flashTippy } from '../../util/tooltips';
import { pageMatch } from '../../pageMatch';

pageMatch('pages/dialogue/reminders', () => {
  const listeners = [
    {
      el: '.reminder-generate-input',
      ev: 'enter',
      fn: function(event, target) {
        document.querySelector<HTMLButtonElement>('.reminder-generate-submit').click();
      }
    },
    {
      el: '.reminder-generate-submit',
      ev: 'click',
      fn: function(event, target) {
        let inputEl = document.querySelector<HTMLInputElement>('.reminder-generate-input');
        let subseqEl = document.querySelector<HTMLInputElement>('.reminder-subseq-input');
        let loadingEl = document.querySelector('.reminder-generate-submit-pending');
        let text = inputEl.value.trim();
        let subseq = parseInt(subseqEl.value || '0');

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

        endpoints.generateReminderDialogue(text, subseq, true).then(result => {
          if (typeof result === 'string') {
            document.querySelector('#reminder-generate-result').innerHTML = result;
          } else if (typeof result === 'object' && result.error_description) {
            document.querySelector('#reminder-generate-result').innerHTML = endpoints.errorHtmlWrap(result.error_description);
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