import { uuidv4 } from '../../shared/util/uuidv4.ts';
import * as Diff2Html from 'diff2html';
import { Diff2HtmlConfig } from 'diff2html';
import { isInt, toInt } from '../../shared/util/numberUtil.ts';
import {
  highlight,
  highlightExistingElementInternal,
  HighlightExistingElementOptions,
} from '../core/ace/aceHighlight.ts';
import * as ace from 'brace';
import { isNightmode, offSiteThemeChange, onSiteThemeChange, SiteTheme } from '../core/userPreferences/siteTheme.ts';
import { createElement } from './domutil.ts';
import { ColorSchemeType } from 'diff2html/lib/types';

export type DiffUIConfig = Omit<Diff2HtmlConfig, 'maxLineLengthHighlight'> & {
  drawFileHeader?: boolean,
  compactHeader?: boolean,
  synchronizedScroll?: boolean,
  wordWrap?: boolean,
  highlightOpts?: HighlightExistingElementOptions,
  postRender?: (instance?: DiffUI) => void,
};

abstract class DiffUIInteractiveModule {
  protected resourceElements: HTMLElement[] = [];
  protected resourceListeners: {element: Element, event: string, listener: Function}[] = [];

  constructor(readonly ui: DiffUI) {}

  abstract create(): void;

  addStyle(style: string) {
    const styleEl = createElement('style', {
      'data-diff-uuid': this.ui.uuid,
      textContent: style,
    });
    this.resourceElements.push(styleEl);
    document.head.append(styleEl);
  }

  destroy() {
    this.resourceElements.forEach(el => el.remove());
    this.resourceListeners.forEach(item => item.element.removeEventListener(item.event, item.listener as any));
    this.resourceElements = [];
    this.resourceListeners = [];
  }
}

class SynchronizedScrollModule extends DiffUIInteractiveModule {
  create(): void {
    this.ui.targetElement.querySelectorAll('.d2h-file-wrapper').forEach(wrapper => {
      const [left, right] = Array<Element>().slice.call(wrapper.querySelectorAll('.d2h-file-side-diff'));

      if (left === undefined || right === undefined) return;

      const onScroll = (event: Event): void => {
        if (event === null || event.target === null) return;

        if (event.target === left) {
          right.scrollTop = left.scrollTop;
          right.scrollLeft = left.scrollLeft;
        } else {
          left.scrollTop = right.scrollTop;
          left.scrollLeft = right.scrollLeft;
        }
      };
      left.addEventListener('scroll', onScroll);
      right.addEventListener('scroll', onScroll);
      this.resourceListeners.push({element: left, event: 'scroll', listener: onScroll});
      this.resourceListeners.push({element: right, event: 'scroll', listener: onScroll});
    });
  }
}

class WordWrapModule extends DiffUIInteractiveModule {
  create(): void {
    this.addStyle(`
      ${this.ui.mySelector} .d2h-code-line-ctn {
        white-space: pre-wrap;
      }
      ${this.ui.mySelector} .d2h-code-line,
      ${this.ui.mySelector} .d2h-code-side-line,
      ${this.ui.mySelector} .d2h-code-line-ctn {
        width: revert;
      }
    `);

    setTimeout(() => {
      for (let fileDiff of Array.from(this.ui.targetElement.querySelectorAll('.d2h-file-diff'))) {
        for (let rowTr of Array.from(fileDiff.querySelectorAll<HTMLElement>('.d2h-diff-tbody > tr'))) {
          rowTr.querySelector<HTMLElement>('td:first-child').style.height = rowTr.offsetHeight + 'px';
        }
      }

      for (let filesDiff of Array.from(this.ui.targetElement.querySelectorAll('.d2h-files-diff'))) {
        const sideDiff1: HTMLElement = filesDiff.querySelector('.d2h-file-side-diff:first-child');
        const sideDiff2: HTMLElement = filesDiff.querySelector('.d2h-file-side-diff:last-child');

        const lineNumToElementMap1: {[lineNum: number]: HTMLTableRowElement} = {};
        const lineNumToElementMap2: {[lineNum: number]: HTMLTableRowElement} = {};

        [
          { sideDiff: sideDiff1, lineNumToElemMap: lineNumToElementMap1 },
          { sideDiff: sideDiff2, lineNumToElemMap: lineNumToElementMap2 }
        ].forEach(({sideDiff, lineNumToElemMap}) => {
          for (let rowTr of Array.from(sideDiff.querySelectorAll('.d2h-diff-tbody > tr'))) {
            const lineNum = rowTr.querySelector<HTMLElement>('.d2h-code-side-linenumber')?.innerText?.trim();
            if (isInt(lineNum)) {
              lineNumToElemMap[lineNum] = rowTr;
            }
          }
        });

        for (let [lineNum, rowTr] of Object.entries(lineNumToElementMap1)) {
          const otherTr = lineNumToElementMap2[lineNum];
          if (!otherTr) {
            continue;
          }
          if (otherTr.offsetHeight > rowTr.offsetHeight) {
            rowTr.style.height = otherTr.offsetHeight + 'px';
            rowTr.style.verticalAlign = 'top';
          }
          if (rowTr.offsetHeight > otherTr.offsetHeight) {
            otherTr.style.height = rowTr.offsetHeight + 'px';
            otherTr.style.verticalAlign = 'top';
          }

          rowTr.querySelector<HTMLElement>('td:first-child').style.height = rowTr.offsetHeight + 'px';
          otherTr.querySelector<HTMLElement>('td:first-child').style.height = otherTr.offsetHeight + 'px';
        }
      }
    })
  }

  override destroy() {
    super.destroy();

    this.ui.targetElement.querySelectorAll<HTMLElement>('.d2h-diff-tbody > tr').forEach(tr => {
      tr.style.removeProperty('height');
      tr.style.removeProperty('vertical-align');
    });
  }
}

class ThemeModule extends DiffUIInteractiveModule {
  private myListener: (theme: SiteTheme) => void;

  create(): void {
    setTimeout(() => {
      this.myListener = theme => {
        if (theme === 'daymode') {
          this.ui.targetElement.querySelector('.d2h-wrapper').classList.remove('d2h-dark-color-scheme');
          this.ui.targetElement.querySelector('.d2h-wrapper').classList.add('d2h-light-color-scheme');
          this.ui.applyConfig({
            colorScheme: ColorSchemeType.LIGHT
          }, true);
        } else {
          this.ui.targetElement.querySelector('.d2h-wrapper').classList.remove('d2h-light-color-scheme');
          this.ui.targetElement.querySelector('.d2h-wrapper').classList.add('d2h-dark-color-scheme');
          this.ui.applyConfig({
            colorScheme: ColorSchemeType.DARK
          }, true);
        }
      };
      onSiteThemeChange(this.myListener);
    });
  }

  override destroy() {
    super.destroy();
    if (this.myListener) {
      offSiteThemeChange(this.myListener);
      this.myListener = null;
    }
  }
}

export type DiffUIFullDiff = {
  prevContent: string,
  currContent: string,
  unifiedDiff: string,
};

export class DiffUI {
  readonly targetElement: HTMLElement;
  readonly uuid: string;
  readonly syncScrollModule: SynchronizedScrollModule;
  readonly wordWrapModule: WordWrapModule;
  readonly themeModule: ThemeModule;
  private _config: DiffUIConfig = {};

  constructor(target: HTMLElement|string,
              readonly fullDiff: DiffUIFullDiff,
              readonly initialConfig: DiffUIConfig) {
    this.targetElement = typeof target === 'string' ? document.querySelector(target) : target;
    this.uuid = uuidv4();
    this.targetElement.setAttribute('data-diff-uuid', this.uuid);
    this.syncScrollModule = new SynchronizedScrollModule(this);
    this.wordWrapModule = new WordWrapModule(this);
    this.themeModule = new ThemeModule(this);
    this.themeModule.create();
    this.setConfig(initialConfig);
  }

  // General Methods
  // --------------------------------------------------------------------------------------------------------------
  get mySelector(): string {
    return `[data-diff-uuid="${this.uuid}"]`;
  }

  destroy() {
    this.themeModule.destroy();
    this.syncScrollModule.destroy();
    this.wordWrapModule.destroy();
    this.targetElement.innerHTML = '';
  }

  // Config Methods
  // --------------------------------------------------------------------------------------------------------------

  getConfig(): DiffUIConfig {
    return this._config;
  }

  setConfig(config: DiffUIConfig, noRender: boolean = false) {
    this._config = config;
    if (!noRender)
      this.render();
  }

  applyConfig(config: Partial<DiffUIConfig>, noRender: boolean = false) {
    Object.assign(this._config, config);
    if (!noRender)
      this.render();
  }

  // Render Methods
  // --------------------------------------------------------------------------------------------------------------
  render() {
    this.destroy();

    this.targetElement.innerHTML = Diff2Html.html(this.fullDiff.unifiedDiff, this._config);

    if (this._config.compactHeader) {
      this.targetElement.querySelector('.d2h-file-header').classList.add('is-compact');
    }

    if (this._config.drawFileHeader == false) {
      this.targetElement.querySelector('.d2h-file-header').remove();
    }

    if (this._config.highlightOpts) {
      this.renderHighlight();
    }

    if (this._config.synchronizedScroll) {
      this.syncScrollModule.create();
    } else {
      this.syncScrollModule.destroy();
    }

    if (this._config.wordWrap) {
      this.wordWrapModule.create();
    } else {
      this.wordWrapModule.destroy();
    }

    if (this._config.postRender) {
      this._config.postRender(this);
    }
  }

  private renderHighlight(): void {
    const hl1 = highlight({ text: this.fullDiff.prevContent, ... this._config.highlightOpts });
    const hl2 = highlight({ text: this.fullDiff.currContent, ... this._config.highlightOpts });

    const files = this.targetElement.querySelectorAll('.d2h-file-wrapper');
    let TomorrowNightTheme = ace.acequire('ace/theme/tomorrow_night');
    let TextmateTheme = ace.acequire('ace/theme/textmate');

    files.forEach(file => {
      if (isNightmode()) {
        file.classList.add(TomorrowNightTheme.cssClass);
      } else {
        file.classList.add(TextmateTheme.cssClass);
      }

      const sideFile1 = file.querySelector('.d2h-file-side-diff:first-child');
      const sideFile2 = file.querySelector('.d2h-file-side-diff:last-child');

      if (sideFile1 && sideFile2) {
        const trList1 = sideFile1.querySelectorAll<HTMLElement>('.d2h-diff-tbody > tr');
        const trList2 = sideFile2.querySelectorAll<HTMLElement>('.d2h-diff-tbody > tr');

        trList1.forEach(rowTr => {
          const lineNum: string = rowTr.querySelector<HTMLElement>('.d2h-code-side-linenumber')?.innerText?.trim();
          const line: HTMLElement = rowTr.querySelector('.d2h-code-line-ctn');

          if (isInt(lineNum)) {
            highlightExistingElementInternal(line, hl1, toInt(lineNum));
          }
        });

        trList2.forEach(rowTr => {
          const lineNum: string = rowTr.querySelector<HTMLElement>('.d2h-code-side-linenumber')?.innerText?.trim();
          const line: HTMLElement = rowTr.querySelector('.d2h-code-line-ctn');

          if (isInt(lineNum)) {
            highlightExistingElementInternal(line, hl2, toInt(lineNum));
          }
        });
      } else {
        const trList = file.querySelectorAll<HTMLElement>('.d2h-diff-tbody > tr');
        trList.forEach(rowTr => {
          const lineNum1: string = rowTr.querySelector<HTMLElement>('.d2h-code-linenumber .line-num1')?.innerText?.trim();
          const lineNum2: string = rowTr.querySelector<HTMLElement>('.d2h-code-linenumber .line-num2')?.innerText?.trim();
          const line: HTMLElement = rowTr.querySelector('.d2h-code-line-ctn');

          if (isInt(lineNum1) && isInt(lineNum2)) {
            // Lines are identical, no changes, doesn't matter which highlight element is used
            highlightExistingElementInternal(line, hl1, toInt(lineNum1));
          } else if (isInt(lineNum1)) {
            // Old line, use highlight 1
            highlightExistingElementInternal(line, hl1, toInt(lineNum1));
          } else if (isInt(lineNum2)) {
            // New line, use highlight 2
            highlightExistingElementInternal(line, hl2, toInt(lineNum2));
          } else {
            // Not a code line
          }
        });
      }
    });
  }
}
