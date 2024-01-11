import { defaultMap } from '../../../shared/util/genericUtil.ts';
import { getSiblingsOfSameClass, isElement } from '../../util/domutil.ts';

export function determineTooltipPlacement(hoveredToken: Element, tokenCls: string): {tooltipTop: number, tooltipLeft: number} {
  const elRectTopToWidthMap: {[top: number]: number} = defaultMap('Zero');
  const elRectTopToLeftMap: {[top: number]: number} = defaultMap('Infinity');

  const involvedTokens: Element[] = getSiblingsOfSameClass(hoveredToken, tokenCls);
  console.log(involvedTokens);
  for (let token of involvedTokens) {
    const tokenRect: DOMRect = token.getBoundingClientRect();
    elRectTopToWidthMap[tokenRect.top] += tokenRect.width;
    if (tokenRect.left < elRectTopToLeftMap[tokenRect.top]) {
      elRectTopToLeftMap[tokenRect.top] = tokenRect.left;
    }
  }

  const elRect: DOMRect = hoveredToken.getBoundingClientRect();
  const elRectTop: number = elRect.top;
  const elRectWidth: number = elRectTopToWidthMap[elRect.top];
  const elRectHeight: number = elRect.height;
  const elRectLeft: number = elRectTopToLeftMap[elRect.top];

  const tooltipTop: number = elRectTop + document.body.scrollTop + elRectHeight + 5;
  const tooltipLeft: number = elRectLeft + (elRectWidth / 2);
  return {tooltipTop, tooltipLeft};
}

export type AceTooltipOpts = {
  tooltipType: string,
  tooltipHtml: string,
  showImmediately?: boolean,
}

export class AceTooltip {
  readonly tooltipEl: HTMLSpanElement;
  private hideTimeout: any;

  constructor(readonly initialOpts: AceTooltipOpts) {
    this.tooltipEl = document.createElement('span');
    this.tooltipEl.classList.add('ace_token-tooltip');
    this.tooltipEl.setAttribute('data-type', initialOpts.tooltipType);
    this.tooltipEl.innerHTML = initialOpts.tooltipHtml;
  }

  show(top: number, left: number): this {
    AceTooltip.hideAll();
    clearTimeout(this.hideTimeout);
    if (top)
      this.tooltipEl.style.top = top + 'px';
    if (left)
      this.tooltipEl.style.left = left + 'px';
    if (this.initialOpts.showImmediately) {
      this.tooltipEl.classList.add('active');
      document.body.append(this.tooltipEl);
    } else {
      document.body.append(this.tooltipEl);
      setTimeout(() => this.tooltipEl.classList.add('active'));
    }
    return this;
  }

  showAt(token: Element, tokenCls: string): this {
    const { tooltipTop, tooltipLeft } = determineTooltipPlacement(token, tokenCls);
    this.show(tooltipTop, tooltipLeft);
    return this;
  }

  hide(): this {
    this.tooltipEl.classList.remove('active');
    this.tooltipEl.remove();
    return this;
  }

  hideAfter(timeout: number): this {
    clearTimeout(this.hideTimeout);
    this.hideTimeout = setTimeout(() => {
      this.hide();
    }, timeout);
    return this;
  }

  static hideAll() {
    document.querySelectorAll('.ace_token-tooltip').forEach(el => {
      el.classList.remove('active');
      el.remove();
    });
  }
}

export function createAceTooltip(opts: AceTooltipOpts): AceTooltip {
  return new AceTooltip(opts);
}

export function showAceTooltipNow(opts: {
  target: Element,
  tooltipType: string,
  tooltipHtml: string,
  timeout: number,
}): AceTooltip;

export function showAceTooltipNow(target: Element, tooltipType?: string, tooltipHtml?: string, timeout?: number): AceTooltip;

export function showAceTooltipNow(opts: {
  target: Element,
  tooltipType: string,
  tooltipHtml: string,
  timeout: number,
}|Element, tooltipType?: string, tooltipHtml?: string, timeout?: number): AceTooltip {
  if (isElement(opts)) {
    return createAceTooltip({
      tooltipType,
      tooltipHtml,
      showImmediately: true
    }).showAt(opts, null).hideAfter(timeout);
  } else {
    return createAceTooltip({
      ... opts,
      showImmediately: true,
    }).showAt(opts.target, null).hideAfter(opts.timeout);
  }
}
