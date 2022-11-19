import { default as tippy, Instance as Tippy, Props as TippyProps } from 'tippy.js';

export function enableTippy(el: HTMLElement, props: Partial<TippyProps> = {}) {
  let tip: Tippy<TippyProps> = (<any> el)._tippy;
  if (!tip) {
    tip = tippy(el, props);
  } else {
    tip.setProps(props);
  }
}

export function showTippy(el: HTMLElement, props: Partial<TippyProps> = {}) {
  if ((<any> el)._tippyTimeout) return;

  let tip: Tippy<TippyProps> = (<any> el)._tippy;

  if (!tip) {
    tip = tippy(el);
  }

  if (!props.trigger) {
    props.trigger = 'manual';
  }

  tip.setProps(props);
  tip.show();
}

export function hideTippy(el: HTMLElement) {
  if ((<any> el)._tippyTimeout) return;
  if ((<any> el)._tippy) {
    (<Tippy<TippyProps>> (<any> el)._tippy).hide();
  }
}

export function flashTippy(el: HTMLElement, props: Partial<TippyProps> = {}) {
  let tip: Tippy<TippyProps> = (<any> el)._tippy;

  if (!tip) {
    tip = tippy(el);
  }

  if (!props.delay) {
    props.delay = [0, 2000];
  }

  if (!props.trigger) {
    props.trigger = 'manual';
  }

  tip.setProps(props);
  tip.show();

  clearTimeout((<any> el)._tippyTimeout);

  (<any> el)._tippyTimeout = setTimeout(() => {
    tip.hide();
    (<any> el)._tippyTimeout = undefined;
  }, tip.props.delay[1] || 0);
}