
// :scope selector polyfill
(function(doc, proto) {
  try { // check if browser supports :scope natively
    doc.querySelector(':scope body');
  } catch (err) { // polyfill native methods if it doesn't
    ['querySelector', 'querySelectorAll'].forEach(function(method) {
      var nativ = proto[method];
      proto[method] = function(selectors) {
        if (/(^|,)\s*:scope/.test(selectors)) { // only if selectors contains :scope
          var id = this.id; // remember current element id
          this.id = 'ID_' + Date.now(); // assign new unique id
          selectors = selectors.replace(/((^|,)\s*):scope/g, '$1#' + this.id); // replace :scope with #ID
          var result = doc[method](selectors);
          this.id = id; // restore previous id
          return result;
        } else {
          return nativ.call(this, selectors); // use native code for other selectors
        }
      }
    });
  }
})(window.document, Element.prototype);

(function() {
  const css = document.createElement('style');
  css.type = 'text/css';

  const styles = `.tree li.is--closed > ul { display: none; }`;

  if (css.styleSheet)
    css.styleSheet.cssText = styles;
  else
    css.appendChild(document.createTextNode(styles));

  document.getElementsByTagName("head")[0].appendChild(css);
})();

window.Tree = class Tree {
  constructor(element, opts={}) {
    if (typeof element === 'string') element = document.querySelector(element);
    if (element.tagName !== 'UL' && element.tagName !== 'OL')
      throw new Error('Tree element must be a UL or OL element.');

    this.el = element;
    this.el.classList.add('tree');
    this.el.setAttribute('role', 'tree');
    this.opts = opts || {};
    this.ignoreCbChanged = true;

    this._callOpt('cbBeforeLoad');

    if (this.opts.data && Array.isArray(this.opts.data) && this.opts.data.length) {
      this.fromJSON(this.opts.data);
    }

    this._setFromHTML();

    this.ignoreCbChanged = false;
    this._callOpt('cbLoaded');
  }

  _opt(path, defaultValue=undefined) {
    return path.split('.').reduce((o,i) => o && o[i], this.opts) || defaultValue;
  }

  _callOpt(path, args=[]) {
    if (path === 'cbChanged' && this.ignoreCbChanged) {
      // Don't run cbChanged listeners until done loading.
      return;
    }
    let fn = this._opt(path);
    if (fn) fn.apply(this, args);
  }

  _listItemParent(el) {
    if (!el) return undefined;
    let li = el.closest('li');
    return li && li._tree === this ? li : undefined;
  }

  _checkIndeterminate(li, recurse=false, clicked=false) {
    if (!li) return;
    let checkbox = li._checkbox;
    if (!checkbox) return;

    if (li.classList.contains('has--children')) {
      let checked = li.querySelectorAll(':scope > ul input[type=checkbox]:not(:disabled):checked');
      let unchecked = li.querySelectorAll(':scope > ul input[type=checkbox]:not(:disabled):not(:checked)');
      let numChecked = checked.length;
      let numUnchecked = unchecked.length;

      if (clicked) {
        if (numUnchecked === 0) {
          checked.forEach(chk => {
            if (chk.disabled) return;
            chk.checked = false;
            if (checkbox._li)
              this._callOpt('cbChanged', [chk._li, chk._li._ul, chk]);
            numUnchecked++;
            numChecked--;
          });
        } else {
          unchecked.forEach(chk => {
            if (chk.disabled) return;
            chk.checked = true;
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

    if (recurse) {
      this._checkIndeterminate(this._listItemParent(li.parentNode), true);
    }
  }

  /** @param {Element} ul */
  _setFromHTML(ul=undefined) {
    if (!ul) ul = this.el;

    if (ul.tagName !== 'UL' && ul.tagName !== 'OL') {
      return;
    }

    if (ul.classList.contains('tree-did-init')) return;

    const cls_closed = 'is--closed';
    const cls_open = 'is--open';

    ul.classList.add('tree-did-init');

    this._callOpt('cbBeforeWalk', [ul]);

    ul.querySelectorAll(':scope > li').forEach(li => {
      li._tree = this;
      li._ul = ul;
      this._callOpt('cbBeforeListItem', [li, ul]);

      li.setAttribute('role', 'treeitem');
      const childrenContainer = li.querySelector(':scope > ul');
      const isLeafNode = !childrenContainer;
      const checkbox = li.querySelector(':scope > input[type=checkbox], :scope > :not(ul) input[type=checkbox]');

      if (!isLeafNode) {
        li.classList.add('has--children');
        const isClosed = li.classList.contains(cls_closed);
        if (!isClosed) li.classList.add(cls_open);

        const toggler = document.createElement('button');
        toggler.innerText = 'toggle';
        toggler.classList.add('tree-toggler', isClosed ? cls_closed : cls_open);
        toggler.addEventListener('click', event => {
          const altDown = event.altKey;
          if (toggler.classList.contains(cls_closed)) {
            li.classList.remove(cls_closed);
            toggler.classList.remove(cls_closed);
            li.classList.add(cls_open);
            toggler.classList.add(cls_open);

            if (altDown) li.querySelectorAll('.'+cls_closed).forEach(ul => {
              ul.classList.remove(cls_closed);
              ul.classList.add(cls_open);
            });
          } else {
            li.classList.remove(cls_open);
            toggler.classList.remove(cls_open);
            li.classList.add(cls_closed);
            toggler.classList.add(cls_closed);

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
        checkbox.addEventListener('change', event => {
          this._checkIndeterminate(li, true, true);
          this._callOpt('cbChanged', [li, ul, checkbox]);
        });
        this._checkIndeterminate(li);
      }

      this._callOpt('cbAfterListItem', [li, ul, checkbox]);
    });

    this._callOpt('cbAfterWalk', [ul]);
  }

  get values() {
    let values = [];
    this.el.querySelectorAll('input[type=checkbox].is--leaf:not(:disabled)').forEach(chk => {
      if (chk.checked && chk.value) {
        values.push(chk.value);
      }
    });
    return values;
  }

  get allValues() {
    let values = [];
    this.el.querySelectorAll('input[type=checkbox]:not(:disabled)').forEach(chk => {
      if (chk.checked && chk.value) {
        values.push(chk.value);
      }
    });
    return values;
  }

  toJSON(ul = undefined, cbText = undefined) {
    if (!ul) ul = this.el;
    return Array.from(ul.querySelectorAll(':scope > li')).map(li => {
      let node = {};

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

  fromJSON(nodeList, container=undefined, forceCheckState = undefined) {
    if (!container) container = this.el;
    container.innerHTML = '';
    container.classList.remove('tree-did-init');

    function applyCustom(element, tokens, attributes) {
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
          span.append(node.html);
        else
          span.innerText = node.text || node.label;
        label.append(span);

        p.append(label);
      } else {
        if (node.html)
          p.append(node.html);
        else
          p.innerText = node.text || node.label;
      }

      li.append(p);
      applyCustom(li, node.customLiClass, node.customLiAttr);

      let children = node.children || node.nodes || node.childs || node.childNodes
        || node.nodeList || null;
      if (children) {
        let ul = document.createElement('ul');
        li.append(ul);
        this.fromJSON(children, ul, checkedState);
      }

      container.append(li);
    });
  }
};

window.MultiInput = class MultiInput {
  /**
   * @param {Element} element
   * @param {Object} opts
   * @param {string} opts.widget html tag for input element (e.g. 'input', 'textarea', 'select')
   * @param {string} opts.name input element name attribute value
   * @param {string} opts.type input element type attribute value
   * @param {Object} opts.classNames
   * @param {String[]} opts.classNames.parent
   * @param {String[]} opts.classNames.container
   * @param {String[]} opts.classNames.item
   * @param {String[]} opts.classNames.item_input
   * @param {String[]} opts.classNames.item_remove
   * @param {String[]} opts.classNames.item_create
   * @param {String[]} opts.classNames.item_error_label
   * @param {String[]} opts.classNames.item_has_error
   * @param {Object} opts.appendClassNames
   * @param {String[]} opts.appendClassNames.parent
   * @param {String[]} opts.appendClassNames.container
   * @param {String[]} opts.appendClassNames.item
   * @param {String[]} opts.appendClassNames.item_input
   * @param {String[]} opts.appendClassNames.item_remove
   * @param {String[]} opts.appendClassNames.item_create
   * @param {String[]} opts.appendClassNames.item_error_label
   * @param {String[]} opts.appendClassNames.item_has_error
   * @param {Object} opts.lang
   * @param {string} opts.lang.item_input_placeholder input element placeholder
   * @param {string} opts.lang.item_create_text html content of item create button
   * @param {string} opts.lang.item_remove_text html content of item remove button
   * @param {Object} opts.lang.errors
   * @param {string} opts.lang.errors.regex
   * @param {string} opts.lang.errors.min
   * @param {string} opts.lang.errors.max
   * @param {string} opts.lang.errors.allow_empty_value
   * @param {string} opts.lang.errors.allow_duplicates
   * @param {Array} opts.values initial values
   * @param {Object} opts.validation
   * @param {RegExp} opts.validation.regex
   * @param {number} opts.validation.min
   * @param {number} opts.validation.max
   * @param {boolean} opts.validation.allow_empty_value
   * @param {boolean} opts.validation.allow_duplicates
   * @param {Function} opts.validation.callback
   * @param {Function} opts.afterClassNames
   * @param {Function} opts.beforeInit
   */
  constructor(element, opts={}) {
    if (typeof element === 'string') element = document.querySelector(element);
    this.el = element;
    this.el.multi_input = this;

    this.listeners = {};

    if (!opts) opts = {};

    if (this.el.hasAttribute('data-opts')) {
      Object.assign(opts, JSON.parse(this.el.getAttribute('data-opts')));
      this.el.removeAttribute('data-opts');
    }

    if (this.el.hasAttribute('data-values')) {
      let val = this.el.getAttribute('data-values');
      this.el.removeAttribute('data-values');

      if (val && val != 'null' && val != 'undefined') {
        opts.values = JSON.parse(val);
      }
    }

    this.name = opts.name || undefined;
    this.type = opts.type || 'text';
    this.widget = opts.widget || 'input';

    if (this.name) {
      this.el.setAttribute('data-name', this.name);
    }

    if (!opts.validation) opts.validation = {};
    if (opts.validation.regex && typeof opts.validation.regex === 'string') {
      let match = opts.validation.regex.match(new RegExp('^/(.*?)/([gimy]*)$'));
      opts.validation.regex = new RegExp(match[1], match[2]);
    }
    this.validation = opts.validation;

    this.classNames = Object.assign({
        parent: ['MultiInput'],
        container: ['MultiInput-container'],
        item: ['MultiInput-item'],
        item_input: ['MultiInput-item-input'],
        item_remove: ['MultiInput-item-remove'],
        item_create: ['MultiInput-item-create'],
        item_error_label: ['MultiInput-item-error-label'],
        item_has_error: ['MultiInput-item-has-error']
      }, opts.classNames || {});

    this.lang = Object.assign({
      item_input_placeholder: 'Add new item',
      item_create_text: 'Add another',
      item_remove_text: 'Remove',
    }, opts.lang || {});

    this.lang.errors = Object.assign({
      regex: `value doesn't match required format`,
      min: `value isn't ${this.type === 'text' ? 'long' : 'large'} enough`,
      max: `value is too ${this.type === 'text' ? 'long' : 'large'}`,
      allow_empty_value: 'value cannot be empty',
      allow_duplicates: 'no duplicate values allowed'
    }, this.lang.errors || {});

    Object.keys(this.classNames).forEach(key => {
      if (typeof this.classNames[key] === 'string') {
        this.classNames[key] = this.classNames[key].split(' ');
      }
      if (opts.appendClassNames && opts.appendClassNames.hasOwnProperty(key)) {
        let addClasses = Array.isArray(opts.appendClassNames[key]) ? opts.appendClassNames[key] : [opts.appendClassNames[key]];
        this.classNames[key].push(... addClasses);
      }
      this.classNames[key].asSelector = () => '.'+this.classNames[key].join('.');
      this.classNames[key].asSpaced = () => this.classNames[key].join(' ');
      this.classNames[key].addTo = (el) => this.classNames[key].forEach(cls => el.classList.add(cls));
      this.classNames[key].removeFrom = (el) => this.classNames[key].forEach(cls => el.classList.remove(cls));
      this.classNames[key].check = (el) => this.classNames[key].every(cls => el.classList.contains(cls));
    });

    if (opts.afterClassNames) {
      opts.afterClassNames.apply(this, [this.classNames, this.lang]);
    }

    this.classNames.parent.addTo(this.el);

    this.el.innerHTML = `
      <div class="${this.classNames.container.asSpaced()}"></div>
      <button class="${this.classNames.item_create.asSpaced()}">${this.lang.item_create_text}</button>`;

    if (opts.beforeInit) {
      opts.beforeInit.apply(this, [element, opts]);
    }

    this.el.querySelector(this.classNames.item_create.asSelector()).addEventListener('click', event => {
      this.addValue('');
    });

    if (opts.values && opts.values.length)
      this.values = opts.values;
    else
      this.addItem();
  }

  get container() {
    return this.el.querySelector(this.classNames.container.asSelector());
  }

  get hasErrors() {
    return !!this.el.querySelector(this.classNames.item_has_error.asSelector());
  }

  _escapeHTML(unsafe) {
    if (!unsafe || typeof unsafe !== 'string') return '';
    return unsafe.replace(/[&<>"']/g, function(m) {
      switch (m) {
        case '&':
          return '&amp;';
        case '<':
          return '&lt;';
        case '>':
          return '&gt;';
        case '"':
          return '&quot;';
        default:
          return '&#039;';
      }
    });
  }

  /**
    * @param {Element} item
    * @param {string} errorText
    */
  showItemError(item, errorText) {
    this.classNames.item_has_error.addTo(item);

    const errorLabel = item.querySelector(this.classNames.item_error_label.asSelector());
    errorLabel.innerHTML = errorText;
    errorLabel.style.removeProperty('display');
  }

  /**
    * @param {Element} item
    */
  hideItemError(item) {
    this.classNames.item_has_error.removeFrom(item);

    const errorLabel = item.querySelector(this.classNames.item_error_label.asSelector());
    errorLabel.style.display = 'none';
  }

  _execListeners(evtName, args) {
    let passed = true;

    if (evtName === 'item-value-changed') {
      (() => {
        let [itemEl, inputEl, event] = args;
        let value = inputEl.value;
        let lenCmp = typeof value === 'string' ? value.length : value;

        if (!this.validation.allow_duplicates) {
          let dupes = this.values.filter(v => v === value);
          if (dupes.length > 1) { // there will always be at least one because of itself
            this.showItemError(itemEl, this.lang.errors.allow_duplicates);
            return;
          }
        }

        if (!this.validation.allow_empty_value && !lenCmp) {
          this.showItemError(itemEl, this.lang.errors.allow_empty_value);
          return;
        }

        if (this.validation.regex && !this.validation.regex.test(value)) {
          this.showItemError(itemEl, this.lang.errors.regex);
          return;
        }

        if (this.validation.min && lenCmp < this.validation.min) {
          this.showItemError(itemEl, this.lang.errors.min);
          return;
        }

        if (this.validation.max && lenCmp > this.validation.max) {
          this.showItemError(itemEl, this.lang.errors.max);
          return;
        }

        if (this.validation.callback) {
          let errorText = this.validation.callback.apply(this, args);
          if (typeof errorText === 'string') {
            this.showItemError(itemEl, errorText);
            return;
          }
        }

        this.hideItemError(itemEl);
      })();
    }

    if (this.listeners.hasOwnProperty(evtName)) {
      this.listeners[evtName].forEach(evtCallback => {
        let ret = evtCallback.apply(this, args);

        if (typeof ret === 'boolean') passed = ret;
      });
    }

    return passed;
  }

  /**
    * Remove MultiInput event listener(s).
    *
    *   - no parameters: removes all listeners
    *   - one parameters: removes all listeners for the event name
    *   - two parameters: removes specific event listener for the event name
    *
    * @param {string} [evtName]
    * @param {Function} [evtCallback]
    * @return {this}
    */
  off(evtName=undefined, evtCallback=undefined) {
    if (arguments.length === 0) {
      this.listeners = {};
    } else if (arguments.length === 1) {
      if (this.listeners.hasOwnProperty(evtName)) {
        delete this.listeners[evtName];
      }
    } else {
      if (this.listeners.hasOwnProperty(evtName)) {
        this.listeners[evtName] = this.listeners[evtName].filter(cb => cb !== evtCallback);
      }
    }
    return this;
  }

  /**
    * Add MultiInput event listener.
    *
    * @param {string} evtName
    * @param {Function} evtCallback
    * @return {this}
    */
  on(evtName, evtCallback) {
    if (!this.listeners.hasOwnProperty(evtName)) {
      this.listeners[evtName] = [];
    }
    this.listeners[evtName].push(evtCallback);
    return this;
  }

  get items() {
    return Array.from(this.el.querySelectorAll(this.classNames.item.asSelector()));
  }

  get inputs() {
    return Array.from(this.el.querySelectorAll(this.classNames.item_input.asSelector()));
  }

  get values() {
    return this.inputs.map(el => el.value);
  }

  clear() {
    this.values = [];
  }

  removeItem(item) {
    if (this.classNames.item.check(item)) {
      if (this._execListeners('before-item-removed', [item])) {
        item.remove();
        this._execListeners('item-removed', [item]);
      } else {
        return null;
      }
    }
    return item;
  }

  addItem() {
    return this.addValue('');
  }

  removeValue(value) {
    let inputs = this.inputs;
    for (let i = 0; i < inputs.length; i++) {
      if (inputs[i].value === value) {
        return !!this.removeItem(inputs[i].closest(this.classNames.item.asSelector()));
      }
    }
    return false;
  }

  addValue(value) {
    const item = document.createElement('DIV');
    this.classNames.item.addTo(item);

    item.innerHTML += `
        <${this.widget} type="${this.type}"
          class="${this.classNames.item_input.asSpaced()}"
          value="${value}"
          placeholder="${this._escapeHTML(this.lang.item_input_placeholder)}"
          ${this.name ? 'name="'+this._escapeHTML(this.name)+'"' : ''}>
        <button class="${this.classNames.item_remove.asSpaced()}">${this.lang.item_remove_text}</button>
        <span class="${this.classNames.item_error_label.asSpaced()}" style="display:none"></span>
      `;

    item.querySelector(this.classNames.item_remove.asSelector())
      .addEventListener('click', event => this.removeItem(item));

    const inputEl = item.querySelector(this.classNames.item_input.asSelector());

    inputEl.addEventListener('input', event => {
      this._execListeners('item-value-changed', [item, inputEl, event]);
    });

    if (this._execListeners('before-item-created', [item, inputEl])) {
      this.container.append(item);
      this._execListeners('item-created', [item, inputEl]);
    }

    return item;
  }

  /**
    * @param {Array} values
    */
  set values(newValues) {
    this.container.innerHTML = '';
    newValues.forEach(value => this.addValue(value));
  }
};

// Autosize from https://github.com/jackmoore/autosize
!function(e,t){"object"==typeof exports&&"undefined"!=typeof module?module.exports=t():"function"==typeof define&&define.amd?define(t):(e||self).autosize=t()}(this,function(){var e,t,n="function"==typeof Map?new Map:(e=[],t=[],{has:function(t){return e.indexOf(t)>-1},get:function(n){return t[e.indexOf(n)]},set:function(n,o){-1===e.indexOf(n)&&(e.push(n),t.push(o))},delete:function(n){var o=e.indexOf(n);o>-1&&(e.splice(o,1),t.splice(o,1))}}),o=function(e){return new Event(e,{bubbles:!0})};try{new Event("test")}catch(e){o=function(e){var t=document.createEvent("Event");return t.initEvent(e,!0,!1),t}}function r(e){var t=n.get(e);t&&t.destroy()}function i(e){var t=n.get(e);t&&t.update()}var l=null;return"undefined"==typeof window||"function"!=typeof window.getComputedStyle?((l=function(e){return e}).destroy=function(e){return e},l.update=function(e){return e}):((l=function(e,t){return e&&Array.prototype.forEach.call(e.length?e:[e],function(e){return function(e){if(e&&e.nodeName&&"TEXTAREA"===e.nodeName&&!n.has(e)){var t,r=null,i=null,l=null,d=function(){e.clientWidth!==i&&c()},u=function(t){window.removeEventListener("resize",d,!1),e.removeEventListener("input",c,!1),e.removeEventListener("keyup",c,!1),e.removeEventListener("autosize:destroy",u,!1),e.removeEventListener("autosize:update",c,!1),Object.keys(t).forEach(function(n){e.style[n]=t[n]}),n.delete(e)}.bind(e,{height:e.style.height,resize:e.style.resize,overflowY:e.style.overflowY,overflowX:e.style.overflowX,wordWrap:e.style.wordWrap});e.addEventListener("autosize:destroy",u,!1),"onpropertychange"in e&&"oninput"in e&&e.addEventListener("keyup",c,!1),window.addEventListener("resize",d,!1),e.addEventListener("input",c,!1),e.addEventListener("autosize:update",c,!1),e.style.overflowX="hidden",e.style.wordWrap="break-word",n.set(e,{destroy:u,update:c}),"vertical"===(t=window.getComputedStyle(e,null)).resize?e.style.resize="none":"both"===t.resize&&(e.style.resize="horizontal"),r="content-box"===t.boxSizing?-(parseFloat(t.paddingTop)+parseFloat(t.paddingBottom)):parseFloat(t.borderTopWidth)+parseFloat(t.borderBottomWidth),isNaN(r)&&(r=0),c()}function a(t){var n=e.style.width;e.style.width="0px",e.style.width=n,e.style.overflowY=t}function s(){if(0!==e.scrollHeight){var t=function(e){for(var t=[];e&&e.parentNode&&e.parentNode instanceof Element;)e.parentNode.scrollTop&&t.push({node:e.parentNode,scrollTop:e.parentNode.scrollTop}),e=e.parentNode;return t}(e),n=document.documentElement&&document.documentElement.scrollTop;e.style.height="",e.style.height=e.scrollHeight+r+"px",i=e.clientWidth,t.forEach(function(e){e.node.scrollTop=e.scrollTop}),n&&(document.documentElement.scrollTop=n)}}function c(){s();var t=Math.round(parseFloat(e.style.height)),n=window.getComputedStyle(e,null),r="content-box"===n.boxSizing?Math.round(parseFloat(n.height)):e.offsetHeight;if(r<t?"hidden"===n.overflowY&&(a("scroll"),s(),r="content-box"===n.boxSizing?Math.round(parseFloat(window.getComputedStyle(e,null).height)):e.offsetHeight):"hidden"!==n.overflowY&&(a("hidden"),s(),r="content-box"===n.boxSizing?Math.round(parseFloat(window.getComputedStyle(e,null).height)):e.offsetHeight),l!==r){l=r;var i=o("autosize:resized");try{e.dispatchEvent(i)}catch(e){}}}}(e)}),e}).destroy=function(e){return e&&Array.prototype.forEach.call(e.length?e:[e],r),e},l.update=function(e){return e&&Array.prototype.forEach.call(e.length?e:[e],i),e}),l});