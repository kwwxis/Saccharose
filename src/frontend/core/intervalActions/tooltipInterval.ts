import { enableTippy, flashTippy, getTippyOpts, hideTippy, showTippy } from '../../util/tooltipUtil.ts';

export function tooltipInterval() {
  document.querySelectorAll<HTMLElement>('[ui-tippy]').forEach(el => {
    enableTippy(el, getTippyOpts(el, 'ui-tippy'));
  });

  document.querySelectorAll<HTMLElement>('[ui-tippy-hover]').forEach(el => {
    const opts = getTippyOpts(el, 'ui-tippy-hover');
    el.addEventListener('mouseenter', _event => {
      showTippy(el, opts);
    });
    el.addEventListener('mouseleave', _event => {
      hideTippy(el);
    });
  });

  document.querySelectorAll<HTMLElement>('[ui-tippy-flash]').forEach(el => {
    const opts = getTippyOpts(el, 'ui-tippy-flash');
    el.addEventListener('click', _event => {
      flashTippy(el, opts);
    });
  });
}
