
import autosize from 'autosize';
import { highlightReplace, highlightWikitextReplace } from '../ace/aceHighlight.ts';

export function enableAceInterval() {
  document.querySelectorAll<HTMLTextAreaElement>('textarea.wikitext').forEach(el => {
    if (el.closest('.hide'))
      return;
    highlightWikitextReplace(el);
  });

  document.querySelectorAll<HTMLTextAreaElement>('textarea.json').forEach(el => {
    if (el.closest('.hide'))
      return;
    highlightReplace(el, { mode: 'ace/mode/json' });
  });

  document.querySelectorAll<HTMLTextAreaElement>('textarea.autosize').forEach(el => {
    if (el.closest('.hide')) {
      return;
    }
    el.classList.remove('autosize');
    autosize(el);
  });
}
