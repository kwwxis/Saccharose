import { isset } from '../../../shared/util/genericUtil';
import { copyToClipboard, frag } from '../domutil';
import { escapeHtml } from '../../../shared/util/stringUtil';
import './asi.scss';
import { forEach, addClass, removeAllChildren, to_lower, on, copy } from './asi_util';
import { AsiPlaceholder } from './asi_placeholder';
import { AsiTypes } from './asi_types';
import { AsiEvents } from './asi_events';
import { AsiRaw } from './asi_raw';
import { AsiTokens } from './asi_tokens';
import { AsiHelper } from './asi_helper';

const asi_instances = [];

export type AsiTokenType = 'text' | 'datetime' | 'date' | 'time'
  | 'number:int' | 'number:integer' | 'number:natural' | 'number:whole' | 'number:binary' | 'number:posdecimal'
  | 'number:posreal' | 'number:decimal' | 'number:real';

export type AsiTokenConfig = { [tokenName: string]: AsiToken };

export interface AsiModifier extends AsiAbstractToken {
}

export interface AsiToken extends AsiAbstractToken {
  type: AsiTokenType,
}

export interface AsiAbstractToken {
  type?: AsiTokenType,
  placeholder?: string,
  search_label?: string,
  suggestions?: string[],
  suggestions_lower?: string[],
  multiple_values?: boolean,
  use_type_placeholder?: boolean,
  allow_duplicates?: boolean,
  allow_strings?: boolean,
  desc_html?: string|Node,
  disable_space_completion?: boolean,
  
  valuepass?: (value: any) => any,
  
  validate?: {
    limit_to_suggestions?: boolean|string,
    match?: RegExp,
    check?: (value: string) => boolean,
    error?: string,
  },
  
  modifiers?: { [modifierName: string]: AsiModifier }
}

export interface AsiEventConf {
  complete?: (event) => void,
  enter?: (event) => void,
  validate?: (event) => void,
  textchange?: (event) => void,
  tokenchange?: (event) => void,
}

export interface AsiOpts {
  placeholder?: string|boolean,
  active_placeholder?: string|boolean,
  disable_error_completion?: boolean,
  events?: AsiEventConf,
  multiple_values?: boolean,
  tokens?: AsiTokenConfig,
  allow_duplicates?: boolean,
}

export class ASI {
  o: HTMLElement;
  private firstInitComplete: boolean;
  event_reporting: boolean;
  options: AsiOpts = null;
  
  constructor(asiElement: HTMLElement|string) {
    this.o = typeof asiElement === 'string' ? document.querySelector<HTMLElement>(asiElement) : asiElement;
    asi_instances.push(this);
  }

  first_init() {
    if (!this.firstInitComplete) {
      this.firstInitComplete = true;

      // attach click handler to body to close asi helpers upon click-off
      on(document.body, 'click', (event) => {
        let eventTarget: Element = event.target as Element;
        let parent = eventTarget.closest('.asi');
        if (!parent) {
          forEach(asi_instances, (item) => {
            item.helper.set_visible(false);
          });
        }
      });
    }
  }

  get_option(property: keyof AsiOpts, default_value) {
    if (!isset(this.options[property])) {
      return default_value;
    }
    return this.options[property];
  }
  
  // get property from options
  // if token_id is true (default), let tokens with the same property override options
  // if token_id is false, get from options only
  // if token_id is int, let property from the token with that id (if exists) override options
  get_property(property, token_id?: boolean|number) {
    token_id = isset(token_id) ? token_id : true;

    let token_prop;
    if (token_id === false) {
      token_prop = null;
    } else if (token_id === true) {
      token_prop = this.tokens.get_active_prop(property);
    } else {
      token_prop = this.tokens.get_prop(token_id, property);
    }

    if (isset(token_prop)) {
      return token_prop;
    } else {
      return this.options[property];
    }
  }
  
  init(options: AsiOpts) {
    this.first_init();
    this.options = options || {};
    this.options['tokens'] = this.options['tokens'] || {};

    if (this.options.tokens) {
      for (let key in this.options.tokens) {
        if (this.options.tokens.hasOwnProperty(key)) {
          if (this.options.tokens[key].suggestions) {
            this.options.tokens[key].suggestions_lower =
              to_lower(this.options.tokens[key].suggestions);
          }
        }
      }
    }

    // create elements
    // ~~~~~~~~~~~~~~~
    addClass(this.o, 'asi');
    let nGenHtml = `
    <div class="asi-input">
      <span class="asi-group"></span>
      <input type="text" class="asi-text" style="width:1px" autocomplete="off" autocapitalize="off" />
      <span class="asi-placeholder">${escapeHtml(this.placeholder.get_default())}</span>
      <i class="asi-icon asi-icon--empty zmdi zmdi-search"></i>
      <i class="asi-icon asi-icon--active asi-hide zmdi zmdi-close-circle"><span class="asi-tooltip">clear</span></i>
      <i class="asi-icon asi-icon--copy zmdi zmdi-copy"><span class="asi-tooltip">copy</span></i>
      <span class="asi-resizing-span"></span>
      <span class="asi-resizing-span2"></span>
      <div class="asi-helper asi-hide"></div>
    </div>
    `;
    this.o.append(frag(nGenHtml));

    // attach event handlers
    // ~~~~~~~~~~~~~~~~~~~~~
    let wrap = this.o.querySelector('.asi-input');
    let input = this.o.querySelector('.asi-text');
    let clear_button = this.o.querySelector('.asi-icon--active');
    let copy_button = this.o.querySelector('.asi-icon--copy');

    on(wrap, 'click', this.events.click.bind(this.events));
    on(input, 'keypress', this.events.keypress.bind(this.events));
    on(input, 'keyup', this.events.keyup.bind(this.events));
    on(input, 'keydown', this.events.keydown.bind(this.events));
    on(input, 'focus', this.events.focus.bind(this.events));
    on(input, 'cut', this.events.cut.bind(this.events));
    on(input, 'paste', this.events.paste.bind(this.events));
    on(input, 'copy', this.events.copy.bind(this.events));

    // clear icon button handler
    on(clear_button, 'click', this.clear.bind(this));

    // copy icon button handler
    on(copy_button, 'click', (event) => {
      let tooltip = copy_button.querySelector('.asi-tooltip');
      copyToClipboard(this.raw.stringify()).then(() => {
        tooltip.innerHTML = 'copied!';
        setTimeout(() => {
          tooltip.innerHTML = 'copy';
        }, 1500);
      })
    });

    return this;
  }

  destroy() {
    // clear modules
    // ~~~~~~~~~~~~~
    this.helper.clear();
    this.tokens.clear();

    // remove nodes from DOM
    // ~~~~~~~~~~~~~~~~~~~~~
    removeAllChildren(this.o);
  }

  get_state() {
    return {
      'text': this.o.querySelector<HTMLInputElement>('.asi-text').value,
      'tokens': this.tokens.list,
    };
  }

  focus() {
    this.o.querySelector<HTMLInputElement>('.asi-text').focus();
  }

  blur() {
    this.o.querySelector<HTMLInputElement>('.asi-text').blur();
  }

  call_user_event(name, params?: any) {
    let event = params || {};
    event.name = name;
    event.cancelled = false;
    event.set_cancelled = (state: boolean) => {
      event.cancelled = state;
    };
    event.is_cancelled = () => {
      return event.cancelled;
    };

    if (this.event_reporting === false) {
      return event;
    }

    if (this.options.events && this.options.events[name]) {
      this.options.events[name].call(this, event);
    }

    return event;
  }

  types = new AsiTypes(this);

  events = new AsiEvents(this);

  placeholder = new AsiPlaceholder(this);

  clear() {
    this.tokens.clear();
    this.clear_text();
  }
  is_empty() {
    return this.tokens.is_empty() && this.is_text_empty();
  }
  clear_text() {
    this.set_text('');
  }
  is_token_empty() {
    return this.tokens.is_empty();
  }
  is_text_empty() {
    let input = this.o.querySelector<HTMLInputElement>('.asi-text');
    return input.value.length == 0;
  }
  get_text(): string {
    return this.o.querySelector<HTMLInputElement>('.asi-text').value;
  }
  set_text(text: string): void {
    let input = this.o.querySelector<HTMLInputElement>('.asi-text'),
      prev = input.value;

    input.value = text;

    this.events.input_changed(input.value, prev);
  }

  raw = new AsiRaw(this);

  adjustTooltips() {
    forEach(Array.from(this.o.querySelectorAll('.asi-tooltip')), (el: HTMLElement) => {
      // 12 -> tooltip side padding
      el.style.width = (this.getInputWidth2(el.innerText)+12)+'px';
    });
  }
  adjustWidth(text) {
    let input = this.o.querySelector('.asi-text');
    input.setAttribute('style', 'width:'+this.getInputWidth(text)+'px');
  }
  _getInputWidth(text, resizing_span) {
    let tmp = this.o.querySelector(resizing_span);
    tmp.innerHTML = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/ /g,'&nbsp;');

    let width = tmp.getBoundingClientRect().width;
    if (width == 0) {
      width = 1;
    } else {
      width += 1;
    }
    return width;
  }
  getInputWidth(text) {
    return this._getInputWidth(text, '.asi-resizing-span');
  }
  getResizingValue() {
    return this.o.querySelector('.asi-resizing-span').innerHTML
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
  }
  getInputWidth2(text) {
    return this._getInputWidth(text, '.asi-resizing-span2');
  }
  getResizingValue2() {
    return this.o.querySelector('.asi-resizing-span2').innerHTML
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
  }

  tokens = new AsiTokens(this);

  helper = new AsiHelper(this);
}

function asi_get_query(asi: any) {
  let state = asi.get_state(),
    query = {text: state.text, tokens: []},
    has_error = false;

  forEach(state.tokens, (token: any) => {
    query.tokens.push({
      label: token.label,
      modifier: token.modifier,
      type: token.type,
      error: token.error,
      values: token.values,
    });
    if (token.error !== false) {
      has_error = true;
      return false; // break
    }
  });

  return { query, has_error };
}