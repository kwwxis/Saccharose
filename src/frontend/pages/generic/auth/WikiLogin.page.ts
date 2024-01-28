import { pageMatch } from '../../../core/pageMatch.ts';
import { listen } from '../../../util/eventListen.ts';
import { genericEndpoints } from '../../../core/endpoints.ts';

pageMatch('vue/WikiLoginPage', () => {
  const wikiNameEl: HTMLInputElement = document.querySelector('#wiki-username');
  const wikiLangEl: HTMLInputElement = document.querySelector('#wiki-lang');
  const wikiCheckEl: HTMLButtonElement = document.querySelector('#wiki-check');
  const wikiCheckErrorEl: HTMLButtonElement = document.querySelector('#wiki-check-error');
  const wikiCheckCompleteEl: HTMLButtonElement = document.querySelector('#wiki-check-complete');
  const wikiCheckPendingEl: HTMLSpanElement = document.querySelector('#wiki-check-pending');

  listen({
    selector: wikiCheckEl,
    event: 'click',
    handle(event) {
      wikiCheckEl.disabled = true;
      wikiCheckPendingEl.classList.remove('hide');
      wikiCheckErrorEl.classList.add('hide');

      genericEndpoints.authCheck.post({
        wikiUsername: wikiNameEl.value || '',
        wikiLang: wikiLangEl.value || '',
      }).then(data => {

        if (data.result === 'denied') {
          wikiCheckEl.disabled = false;
          wikiCheckPendingEl.classList.add('hide');
          wikiCheckErrorEl.classList.remove('hide');
          wikiCheckErrorEl.innerText = 'Denied: ' + data.reason;
        } else if (data.result === 'approved') {
          wikiCheckEl.disabled = true; // leave check button disabled
          wikiCheckPendingEl.classList.add('hide');
          wikiCheckCompleteEl.classList.remove('hide');
          wikiCheckCompleteEl.innerText = 'Access granted: you can now refresh the page to enter the website.';
        } else {
          wikiCheckEl.disabled = false;
          wikiCheckPendingEl.classList.add('hide');
          wikiCheckErrorEl.classList.remove('hide');
          wikiCheckErrorEl.innerText = 'Unknown error occurred';
        }
      }).catch(err => {
        wikiCheckEl.disabled = false;
        wikiCheckPendingEl.classList.add('hide');
        wikiCheckErrorEl.classList.remove('hide');
        wikiCheckErrorEl.innerText = 'Unknown error occurred';
      });
    }
  })
});
