import { highlightReplace, highlightWikitextReplace } from '../ace/wikitextEditor.ts';
import autosize from 'autosize';

export function enableAceInterval() {
  document.querySelectorAll<HTMLTextAreaElement>('textarea.wikitext').forEach(el => {
    if (el.closest('.hide'))
      return;
    highlightWikitextReplace(el);
  });

  document.querySelectorAll<HTMLTextAreaElement>('textarea.json').forEach(el => {
    if (el.closest('.hide'))
      return;
    highlightReplace(el, 'ace/mode/json');
  });

  document.querySelectorAll<HTMLTextAreaElement>('textarea.autosize').forEach(el => {
    if (el.closest('.hide')) {
      return;
    }
    el.classList.remove('autosize');
    autosize(el);
  });
}
