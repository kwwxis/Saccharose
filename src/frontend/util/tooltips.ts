import { default as tippy, Instance as Tippy, Props as TippyProps } from 'tippy.js';
import JSON5 from 'json5';
import { toBoolean } from '../../shared/util/genericUtil';

export function enableTippy(el: HTMLElement, props: Partial<TippyProps> = {}): Tippy<TippyProps> {
  if (!el || !props.content) {
    return undefined;
  }
  let tip: Tippy<TippyProps> = (<any> el)._tippy;
  if (!tip) {
    tip = tippy(el, props);
  } else {
    tip.setProps(props);
  }
  return tip;
}

export function showTippy(el: HTMLElement, props: Partial<TippyProps> = {}): Tippy<TippyProps> {
  if (!el || !props.content) {
    return undefined;
  }

  if ((<any> el)._tippyTimeout) return undefined;

  let tip: Tippy<TippyProps> = (<any> el)._tippy;

  if (!tip) {
    tip = tippy(el);
  }

  if (!props.trigger) {
    props.trigger = 'manual';
  }

  tip.setProps(props);
  tip.show();
  return tip;
}

export function hideTippy(el: HTMLElement, force: boolean = false): Tippy<TippyProps> {
  if (!el) return undefined;
  if ((<any> el)._tippyTimeout && !force) return undefined;
  if ((<any> el)._tippy) {
    (<Tippy<TippyProps>> (<any> el)._tippy).hide();
    return (<any> el)._tippy;
  }
  return undefined;
}

export function flashTippy(el: HTMLElement, props: Partial<TippyProps> = {}): Tippy<TippyProps> {
  if (!el || !props.content) {
    return undefined;
  }

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

  return tip;
}

export function getTippyOpts(el: HTMLElement, attrName: string): Partial<TippyProps> {
  if (!el) return {};
  const attrVal = el.getAttribute(attrName).trim();
  el.removeAttribute(attrName);

  if (!attrVal) {
    return {};
  }

  let opts;
  if (attrVal.startsWith('{') && attrVal.endsWith('}')) {
    try {
      opts = JSON5.parse(attrVal);
    } catch (e) {
      console.error('Failed to parse tippy opts', attrVal, el);
    }
  } else {
    opts = {content: attrVal};
  }
  if (!opts.delay) {
    opts.delay = [100,100];
  }
  if (el.hasAttribute('ui-tippy-html')) {
    opts.allowHTML = toBoolean(el.getAttribute('ui-tippy-html'));
  }

  return opts;
}