// noinspection JSUnusedGlobalSymbols

import { frag } from './domutil.ts';

/**
 * The rendered HTML is formatted as:
 *
 * ```html
 * <ul>
 *   <li>
 *     <p>
 *       <label>
 *         <input type="checkbox />
 *         <span></span>
 *       </label>
 *     </p>
 *     <ul>
 *       ...
 *     </ul>
 *   </li>
 * </ul>
 * ```
 */
export interface CheckboxTreeNode {
  /**
   * The text for the checkbox label. Is automatically HTML-escaped.
   */
  text?: string;

  /**
   * The HTML for the checkbox label.
   *
   * If both `html` and `text`/`label` are specified, then `html` takes precedence.
   */
  html?: string;

  /**
   * Alias for {@link text}.
   *
   * If both are specified, then `text` takes precedence.
   */
  label?: string;

  /**
   * Value of the checkbox input.
   */
  value?: string;

  /**
   * Checked state of the checkbox input.
   */
  checked?: boolean;

  /**
   * Disabled state of the checkbox input.
   */
  disabled?: boolean;

  /**
   * Value for the `name` attribute of the checkbox input.
   */
  name?: string;

  /**
   * Child nodes.
   */
  children?: CheckboxTreeNode[];

  customLiClass?: string;
  customLiAttr?: {[attr: string]: string};

  customParaClass?: string;
  customParaAttr?: {[attr: string]: string};

  customSpanClass?: string;
  customSpanAttr?: {[attr: string]: string};

  customLabelClass?: string;
  customLabelAttr?: {[attr: string]: string};

  customCheckboxClass?: string;
  customCheckboxAttr?: {[attr: string]: string};
}

export interface CheckTreeOpts {
  data?: CheckboxTreeNode[],
  cbBeforeLoad?:      (this: CheckboxTree) => void,
  cbLoaded?:          (this: CheckboxTree) => void,
  cbBeforeWalk?:      (this: CheckboxTree, ul: HTMLUListElement) => void,
  cbBeforeListItem?:  (this: CheckboxTree, li: CheckboxTreeLI, ul: HTMLUListElement) => void,
  cbToggled?:         (this: CheckboxTree, li: CheckboxTreeLI, ul: HTMLUListElement, toggler: HTMLButtonElement) => void,
  cbTogglerVisit?:    (this: CheckboxTree, li: CheckboxTreeLI, ul: HTMLUListElement, toggler: HTMLButtonElement) => void,
  cbChanged?:         (this: CheckboxTree, li: CheckboxTreeLI, ul: HTMLUListElement, checkbox: CheckboxTreeCheckbox) => void,
  cbAfterListItem?:   (this: CheckboxTree, li: CheckboxTreeLI, ul: HTMLUListElement, checkbox: CheckboxTreeCheckbox) => void,
  cbAfterWalk?:       (this: CheckboxTree, ul: HTMLUListElement) => void,
}

export type CheckboxTreeLI = HTMLLIElement & {_checkbox?: CheckboxTreeCheckbox, _tree: CheckboxTree, _ul: HTMLUListElement};

export type CheckboxTreeCheckbox = HTMLInputElement & {_li: CheckboxTreeLI, _tree: CheckboxTree};

// noinspection CssUnusedSymbol
export class CheckboxTree {
  private readonly el: HTMLUListElement;
  private readonly opts: any;
  private readonly isLoading: boolean = true;
  private debounceCbChanged: any;

  constructor(element: HTMLUListElement, opts: CheckTreeOpts = {}) {
    if (typeof element === 'string') element = document.querySelector(element);
    if (element.tagName !== 'UL' && element.tagName !== 'OL')
      throw new Error('Tree element must be a UL or OL element.');

    this.el = element;
    this.el.classList.add('checkbox-tree');
    this.el.setAttribute('role', 'tree');
    this.opts = opts || {};

    this._callOpt('cbBeforeLoad');

    if (this.opts.data && Array.isArray(this.opts.data) && this.opts.data.length) {
      this.fromJSON(this.opts.data);
    }

    this._setFromHTML();

    this.isLoading = false;
    this._callOpt('cbLoaded');

    if (!document.querySelector('#checkbox-tree-styles')) {
      const css = document.createElement('style');
      // language=css
      const styles: string = `
          .checkbox-tree li.is--closed > ul { display: none; }

          ul.checkbox-tree, .checkbox-tree ul {
              list-style-type: none;
          }
          ul.checkbox-tree {
              padding: 0 !important;
          }
          .checkbox-tree li.has--children ul {
              padding-left: 3em;
          }
          .checkbox-tree li > p {
              display: flex;
              align-items: center;
          }
          .checkbox-tree .checkbox-tree-toggler {
              width: 16px;
              height: 16px;
              border: 0;
              padding: 0;
              background: 0;
              opacity: 0.5;
              position: relative;
              z-index: 2;
          }
          .checkbox-tree .checkbox-tree-toggler:hover {
              opacity: 1;
          }

          .checkbox-tree .checkbox-tree-toggler .icon {
              width: 100%;
              height: 100%;
              cursor: pointer;
          }

          .checkbox-tree .checkbox-tree-toggler:focus {
              outline: 0 !important;
              box-shadow: 0 0 0 2.5px rgba(0, 140, 221, 0.25);
              opacity: 1;
          }
      `;
      css.appendChild(document.createTextNode(styles));
      document.head.appendChild(css);
    }
  }

  private _opt(path, defaultValue = undefined) {
    return path.split('.').reduce((o,i) => o && o[i], this.opts) || defaultValue;
  }

  private _callOpt(path, args=[]) {
    if (path === 'cbChanged' && this.isLoading) {
      // Don't run cbChanged listeners until done loading.
      return;
    }

    if (path === 'cbChanged') {
      let fn = this._opt(path);
      if (fn) {
        clearTimeout(this.debounceCbChanged);
        this.debounceCbChanged = setTimeout(() => {
          fn.apply(this, args);
        }, 100);
      }
      return;
    }

    let fn = this._opt(path);
    if (fn) fn.apply(this, args);
  }

  private _listItemParent(el: Element): CheckboxTreeLI {
    if (!el) return undefined;
    let li: CheckboxTreeLI = <CheckboxTreeLI> el.closest('li');
    return li && li._tree === this ? li : undefined;
  }

  private _checkIndeterminate(li, recurseUpwards= false, clicked= false) {
    if (!li) return;
    let checkbox = li._checkbox;
    if (!checkbox) return;

    if (li.classList.contains('has--children')) {
      let checked: CheckboxTreeCheckbox[] = li.querySelectorAll(':scope > ul input[type=checkbox]:not(:disabled):checked');
      let unchecked: CheckboxTreeCheckbox[] = li.querySelectorAll(':scope > ul input[type=checkbox]:not(:disabled):not(:checked)');
      let numChecked = checked.length;
      let numUnchecked = unchecked.length;

      if (clicked) {
        if (numUnchecked === 0) {
          checked.forEach(chk => {
            if (chk.disabled) return;
            chk.checked = false;
            chk.indeterminate = false;
            chk.classList.remove('is--indeterminate');
            if (checkbox._li)
              this._callOpt('cbChanged', [chk._li, chk._li._ul, chk]);
            numUnchecked++;
            numChecked--;
          });
        } else {
          unchecked.forEach(chk => {
            if (chk.disabled) return;
            chk.checked = true;
            chk.indeterminate = false;
            chk.classList.remove('is--indeterminate');
            if (checkbox._li)
              this._callOpt('cbChanged', [chk._li, chk._li._ul, chk]);
            numChecked++;
            numUnchecked--;
          });
        }
      }

      if (numUnchecked !== 0 && numChecked !== 0) {
        if (checkbox.checked === true || checkbox.indeterminate === false || !checkbox.classList.contains('is--indeterminate')) {
          checkbox.checked = false;
          checkbox.indeterminate = true;
          checkbox.classList.add('is--indeterminate');
          if (checkbox._li)
            this._callOpt('cbChanged', [checkbox._li, checkbox._li._ul, checkbox]);
        }
      } else if (numUnchecked === 0) {
        if (checkbox.checked === false || checkbox.indeterminate === true || checkbox.classList.contains('is--indeterminate')) {
          checkbox.checked = true;
          checkbox.indeterminate = false;
          checkbox.classList.remove('is--indeterminate');
          if (checkbox._li)
            this._callOpt('cbChanged', [checkbox._li, checkbox._li._ul, checkbox]);
        }
      } else if (numChecked === 0) {
        if (checkbox.checked === true || checkbox.indeterminate === true || checkbox.classList.contains('is--indeterminate')) {
          checkbox.checked = false;
          checkbox.indeterminate = false;
          checkbox.classList.remove('is--indeterminate');
          if (checkbox._li)
            this._callOpt('cbChanged', [checkbox._li, checkbox._li._ul, checkbox]);
        }
      }
    }

    if (recurseUpwards) {
      this._checkIndeterminate(this._listItemParent(li.parentNode), true);
    }
  }

  /** @param {Element} ul */
  private _setFromHTML(ul?: HTMLUListElement) {
    if (!ul) ul = this.el;

    if (ul.tagName !== 'UL' && ul.tagName !== 'OL') {
      return;
    }

    if (ul.classList.contains('checkbox-tree-did-init')) return;

    const cls_closed = 'is--closed';
    const cls_open = 'is--open';

    const icon_open = document.querySelector('#template-chevron-down').innerHTML;
    const icon_closed = document.querySelector('#template-chevron-right').innerHTML;

    ul.classList.add('checkbox-tree-did-init');

    this._callOpt('cbBeforeWalk', [ul]);

    ul.querySelectorAll(':scope > li').forEach((li: CheckboxTreeLI) => {
      li._tree = this;
      li._ul = ul;
      this._callOpt('cbBeforeListItem', [li, ul]);

      li.setAttribute('role', 'treeitem');
      const childrenContainer: HTMLUListElement = li.querySelector(':scope > ul');
      const isLeafNode: boolean = !childrenContainer;
      const checkbox: CheckboxTreeCheckbox = li.querySelector(':scope > input[type=checkbox], :scope > :not(ul) input[type=checkbox]');

      if (!isLeafNode) {
        li.classList.add('has--children');
        const isClosed = li.classList.contains(cls_closed);
        if (!isClosed) li.classList.add(cls_open);

        const toggler = document.createElement('button');
        toggler.innerHTML = isClosed ? icon_closed : icon_open;
        toggler.classList.add('checkbox-tree-toggler', isClosed ? cls_closed : cls_open);
        toggler.setAttribute('aria-label', isClosed ? 'Uncollapse tree items' : 'Collapse tree items');
        toggler.addEventListener('click', event => {
          const altDown = event.altKey;
          if (toggler.classList.contains(cls_closed)) {
            li.classList.remove(cls_closed);
            toggler.classList.remove(cls_closed);
            li.classList.add(cls_open);
            toggler.classList.add(cls_open);

            toggler.innerHTML = icon_open;
            toggler.setAttribute('aria-label', 'Collapse tree items');

            if (altDown) li.querySelectorAll('.'+cls_closed).forEach(ul => {
              ul.classList.remove(cls_closed);
              ul.classList.add(cls_open);
            });
          } else {
            li.classList.remove(cls_open);
            toggler.classList.remove(cls_open);
            li.classList.add(cls_closed);
            toggler.classList.add(cls_closed);

            toggler.innerHTML = icon_closed;
            toggler.setAttribute('aria-label', 'Uncollapse tree items');

            if (altDown) li.querySelectorAll('.'+cls_open).forEach(ul => {
              ul.classList.remove(cls_open);
              ul.classList.add(cls_closed);
            });
          }

          this._callOpt('cbToggled', [li, ul, toggler]);
          this._callOpt('cbTogglerVisit', [li, ul, toggler]);
        });

        this._callOpt('cbTogglerVisit', [li, ul, toggler]);

        let p = li.querySelector(':scope > p');
        if (p)
          p.prepend(toggler);
        else
          li.prepend(toggler);
        this._setFromHTML(childrenContainer);
      } else {
        li.classList.add('is--leaf');
      }

      if (checkbox) {
        li._checkbox = checkbox;
        checkbox._li = li;
        checkbox._tree = this;
        li.classList.add('has--checkbox');
        if (isLeafNode) checkbox.classList.add('is--leaf');
        checkbox.addEventListener('change', _event => {
          this._checkIndeterminate(li, true, true);
          this._callOpt('cbChanged', [li, ul, checkbox]);
        });
        this._checkIndeterminate(li);
      }

      this._callOpt('cbAfterListItem', [li, ul, checkbox]);
    });

    this._callOpt('cbAfterWalk', [ul]);
  }

  getValues(onlyLeafs: boolean = false): string[] {
    let values: string[] = [];
    this.el.querySelectorAll<CheckboxTreeCheckbox>('input[type=checkbox]:not(:disabled)').forEach(chk => {
      if (chk.checked && chk.value && (!onlyLeafs || chk.classList.contains('is--leaf'))) {
        values.push(chk.value);
      }
    });
    return values;
  }

  toJSON(ul = undefined, cbText = undefined): CheckboxTreeNode[] {
    if (!ul) ul = this.el;
    return Array.from(ul.querySelectorAll(':scope > li')).map((li: CheckboxTreeLI) => {
      let node: CheckboxTreeNode = {};

      if (cbText) {
        cbText.apply(this, [li, node]);
      } else {
        let texts = [];

        Array.from(li.children).forEach(child => {
          if (child.tagName === 'UL' || child.tagName === 'OL' || child.tagName === 'BUTTON'
            || child.tagName === 'INPUT') {
            return;
          }
          texts.push(child.textContent);
        });

        node.text = texts.join(' ').trim();
      }

      if (li._checkbox) {
        node.value = li._checkbox.value;
        node.checked = !!li._checkbox.checked;
        node.disabled = !!li._checkbox.disabled;
        node.name = li._checkbox.name || null;
      }

      let ul2 = li.querySelector(':scope > ul');
      if (ul2) {
        node.children = this.toJSON(ul2, cbText);
      }

      return node;
    });
  }

  fromJSON(nodeList: CheckboxTreeNode[], container?: HTMLElement, forceCheckState?: boolean, depth: number = 0): void {
    if (!container) container = this.el;
    container.innerHTML = '';
    container.classList.remove('checkbox-tree-did-init');

    function applyCustom(element: HTMLElement, tokens: string|string[], attributes: {[attr: string]: string}) {
      if (tokens && tokens.length) {
        tokens = typeof tokens === 'string' ? tokens.split(' ') : tokens;
        element.classList.add(... tokens);
      }
      if (attributes) {
        Object.keys(attributes).forEach(attrKey => {
          element.setAttribute(attrKey, attributes[attrKey]);
        });
      }
    }

    nodeList.forEach(node => {
      if (typeof node !== 'object' || (!node.html && !node.text && !node.label)) return;
      let li = document.createElement('li');
      let checkedState = undefined;

      let p = document.createElement('p');
      applyCustom(p, node.customParaClass, node.customParaAttr);

      if (typeof node.value !== 'undefined' || node.hasOwnProperty('checked')) {
        let chk = document.createElement('input');
        applyCustom(chk, node.customCheckboxClass, node.customCheckboxAttr);

        chk.type = 'checkbox';
        if (node.value)
          chk.value = node.value;
        if (node.name)
          chk.name = node.name;

        if (typeof forceCheckState === 'boolean') {
          checkedState = chk.checked = forceCheckState;
        } else if (typeof node.checked === 'boolean') {
          checkedState = chk.checked = node.checked;
        }

        chk.disabled = !!node.disabled;

        let label = document.createElement('label');
        applyCustom(label, node.customLabelClass, node.customLabelAttr);
        label.append(chk);

        let span = document.createElement('span');
        applyCustom(span, node.customSpanClass, node.customSpanAttr);
        if (node.html)
          span.append(frag(node.html));
        else
          span.innerText = node.text || node.label;
        label.append(span);

        p.append(label);
      } else {
        if (node.html)
          p.append(frag(node.html));
        else
          p.innerText = node.text || node.label;
      }

      li.setAttribute('data-depth', String(depth));
      li.append(p);
      applyCustom(li, node.customLiClass, node.customLiAttr);

      if (node.children) {
        let ul = document.createElement('ul');
        li.append(ul);
        this.fromJSON(node.children, ul, checkedState, depth + 1);
      }

      container.append(li);
    });
  }
}
