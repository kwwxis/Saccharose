
import autosize from 'autosize';
import { highlightReplace, highlightWikitextReplace } from '../ace/aceHighlight.ts';
import { isElementPartiallyInViewport } from '../../util/domutil.ts';
import { toBoolean } from '../../../shared/util/genericUtil.ts';

export function enableAceInterval() {
  document.querySelectorAll<HTMLTextAreaElement>('textarea.wikitext').forEach(el => {
    if (el.closest('.hide'))
      return;
    if (el.hasAttribute('data-lazy-load') && toBoolean(el.getAttribute('data-lazy-load')) && !isElementPartiallyInViewport(el))
      return;
    highlightWikitextReplace(el);
  });

  document.querySelectorAll<HTMLTextAreaElement>('textarea.json').forEach(el => {
    if (el.closest('.hide'))
      return;
    if (el.hasAttribute('data-lazy-load') && toBoolean(el.getAttribute('data-lazy-load')) && !isElementPartiallyInViewport(el))
      return;
    highlightReplace(el, { mode: 'ace/mode/json' });
  });

  document.querySelectorAll<HTMLTextAreaElement>('textarea.autosize').forEach(el => {
    if (el.closest('.hide'))
      return;
    if (el.hasAttribute('data-lazy-load') && toBoolean(el.getAttribute('data-lazy-load')) && !isElementPartiallyInViewport(el))
      return;
    el.classList.remove('autosize');
    autosize(el);
  });
}
