import { addClass, copy, Counter, forEach, removeAllChildren, removeClass, removeDom } from './asi_util';
import { isset } from '../../../shared/util/genericUtil';
import { isInt } from '../../../shared/util/numberUtil';
import { createElement, frag } from '../domutil';
import { escapeHtml } from '../../../shared/util/stringUtil';
import { ASI } from './asi';

export class AsiTokens {
  // list of currently tokens in order
  list = [];
  // map of all tokens (including deleted) by id
  by_id = {};
  // number of not-deleted tokens for each label
  label_count = Counter();
  // the in-progress token, null if it does not exist
  active = null;
  // to prevent overwriting deleted tokens in 'by_id' this should never be reset to 0
  token_next_id = 0;

  constructor(readonly asi: ASI) {}

  // returns true if there are no tokens
  is_empty() {
    return this.list.length == 0;
  }

  // is there a token in progress?
  is_active() {
    return this.active !== null;
  }

  // get the last token if exists
  peek() {
    if (this.list.length == 0) {
      return null;
    }
    return this.list[this.list.length - 1];
  }

  // removes the last token if exists
  pop() {
    if (this.list.length == 0) {
      return;
    }

    let last_token = this.list.pop();
    this.delete_token(last_token.id);
  }

  // get values by label
  get(label) {
    if (!isset(label)) {
      return this.list;
    }

    let values = [];

    forEach(this.list, (token) => {
      if (token.label === label) {
        values = values.concat(token.values);
      }
    });

    return values;
  }

  // remove all tokens
  clear() {
    this.list = [];
    this.active = null;
    this.label_count = Counter();

    removeAllChildren(this.asi.o.querySelector('.asi-group'));

    // have to clear the helper here to reset the helper filter
    // if search_options exists, but is filtered, nothing will happen
    // because input_emptied doesn't reset the search_options if it
    // already exists regardless of its filtered state
    this.asi.helper.clear();
    this.asi.call_user_event('tokenchange', { type: 'clear' });
  }

  get_active_prop(property) {
    if (!this.is_active()) {
      return null;
    }
    return this.get_prop(this.active.id, property);
  }

  get_prop(token_id, property) {
    let mod_prop = this.get_mod_prop(token_id, property);
    if (mod_prop !== null) {
      return mod_prop;
    }
    return this.by_id[token_id][property];
  }

  get_mod_prop(...args: any[]) {
    let a = arguments,
      l = a.length,
      token_id = a[0],
      modifier, property;

    if (l == 2) {
      modifier = this.get_modifier(token_id);
      property = a[1];
    } else if (l == 3) {
      modifier = a[1];
      property = a[2];
    }

    if (!modifier) {
      return null;
    }

    let token_data = this.by_id[token_id];

    if (!isset(token_data.modifiers)) {
      return null;
    }

    if (Array.isArray(token_data.modifiers)) {
      return null;
    }

    if (!isset(token_data.modifiers[modifier])) {
      return null;
    }

    if (!isset(token_data.modifiers[modifier][property])) {
      return null;
    }

    return token_data.modifiers[modifier][property];
  }

  process_label(token_label: string, event?: Event) {
    event = event || null;

    if (this.is_active() || !this.asi.options.tokens[token_label]) {
      return false;
    }

    let do_merge_prev = false;

    let prev_token = this.peek();
    if (prev_token && prev_token.error === false && prev_token.label === token_label) {
      let multivals = this.asi.get_property('multiple_values', prev_token.id);
      if (multivals === true || (isInt(multivals) && prev_token.values.length + 1 <= multivals)) {
        do_merge_prev = true;
      }
    }

    if (do_merge_prev) {
      this.active = prev_token;
      this.set_closed(prev_token.id, false);
    } else {
      let token_data = this.create_token(token_label, true);
      if (token_data === false) {
        return false;
      }
    }

    this.asi.placeholder.check_icons();
    this.asi.helper.fix(event);
    this.asi.placeholder.set_initial(true);

    return true;
  }

  process_modifier(token_label, modifier, event?: Event) {
    event = event || null;

    if (!this.is_active()) {
      return false;
    }

    if (!Object.keys(this.active.modifiers).includes(modifier)) {
      return false;
    }

    this.set_modifier(this.active.id, modifier);
    this.asi.helper.fix(event);
    this.asi.placeholder.set_initial(true);

    return true;
  }

  process_value(text, add_another?: boolean) {
    add_another = add_another || false;
    if (!this.is_active()) {
      return;
    }

    let multival = this.asi.get_property('multiple_values');
    if (multival === false || (multival !== true && this.active.values.length + 1 >= multival)) {
      add_another = false;
    }

    if (!this.asi.get_property('disable_space_completion') && this.asi.get_property('allow_strings')) {
      if ((text.startsWith('"') && !text.endsWith('"')) ||
        (text.startsWith('\'') && !text.endsWith('\''))) {
        return;
      }

      if (text.startsWith('"') || text.startsWith('\'')) {
        text = text.slice(1, -1);
      }
    }

    let active_id = this.active.id;

    if (this.asi.get_property('disable_error_completion', active_id) === true) {
      // if disable_error_completion is enabled, and token value has an error
      // don't allow the value-add to go through
      if (this.validate(active_id, text) === false) {
        this.add_value(active_id, text, !add_another);
      } else {
        return false;
      }
    } else {
      this.add_value(active_id, text, !add_another);
      this.validate(active_id);
    }

    return true;
  }

  create_token(label, set_as_active?: boolean) {
    set_as_active = set_as_active || false;

    let allow_duplicates = isset(this.asi.options.tokens[label].allow_duplicates) ?
      this.asi.options.tokens[label].allow_duplicates :
      this.asi.options.allow_duplicates;
    if (this.label_count.get(label) >= 1 &&
      isset(allow_duplicates) && allow_duplicates === false) {
      return false;
    }

    let id = this.token_next_id;

    this.asi.o.querySelector('.asi-group').appendChild(frag(
      `<span class="asi-token" data-token-id="${id}"><span class="asi-token--label">${escapeHtml(label)}</span></span>`,
    ));

    let token_data = copy(this.asi.options.tokens[label]);
    token_data['element'] = this.asi.o.querySelector('.asi-group .asi-token[data-token-id="' + id + '"]');
    token_data['modifier'] = null;
    token_data['values'] = [];
    token_data['closed'] = false;
    token_data['error'] = false;
    token_data['label'] = label;
    token_data['id'] = id;

    if (token_data.type && token_data.type == 'date' || token_data.type == 'time' || token_data.type == 'datetime') {
      token_data.disable_space_completion = true;
    }

    token_data.search_label = this.asi.types.get_label(token_data['type'], token_data['search_label']);

    this.list.push(token_data);
    this.by_id[id] = token_data;
    this.label_count.add(label);

    if (set_as_active) {
      this.active = token_data;
    }

    this.asi.call_user_event('tokenchange', { type: 'create_token', subject: token_data });

    this.token_next_id += 1;
    return token_data;
  }

  get_label(token_id) {
    return this.by_id[token_id].label;
  }

  set_modifier(token_id, modifier) {
    let data = this.by_id[token_id];
    let element: Element = data.element;

    data.modifier = modifier;

    element.querySelector('.asi-token--label').insertAdjacentElement('afterend', createElement('span', {
      'class': 'asi-token--modifier',
      'text': modifier,
    }));

    this.asi.call_user_event('tokenchange', { type: 'set_modifier', subject: data });

    return true;
  }

  remove_modifier(token_id) {
    let token_data = this.by_id[token_id];
    token_data.modifier = null;

    let el: HTMLElement = token_data.element.querySelector('.asi-token--modifier');
    if (el) {
      el.remove();
      if (this.active && this.active.id == token_id) {
        let token_label = this.active.label;
        this.asi.helper.fix();
      }
      this.asi.call_user_event('tokenchange', { type: 'remove_modifier', subject: token_data });
    }
  }

  get_modifier(token_id) {
    return this.by_id[token_id].modifier;
  }

  has_modifier(token_id) {
    return this.by_id[token_id].modifier !== null;
  }

  set_closed(token_id, state) {
    let token_data = this.by_id[token_id];
    if (state == true) {
      token_data.closed = true;
      addClass(token_data.element, 'asi-token--closed');
      if (this.active && this.active.id == token_id) {
        this.active = null;

        this.asi.helper.fix();
        this.asi.placeholder.set_initial(true);
      }
    } else {
      token_data.closed = false;
      removeClass(token_data.element, 'asi-token--closed');
      if (!this.active && this.peek() && this.peek().id == token_id) {
        this.active = token_data;
        this.asi.placeholder.set_initial(true);
        this.asi.helper.fix();

        if (token_data.values.length) {
          let list = token_data.element.querySelectorAll('.asi-token--value'),
            value_el = list[list.length - 1],
            value_text = value_el.innerHTML;

          removeDom(value_el);
          token_data.values.splice(token_data.values.length - 1, 1);

          this.asi.set_text(value_text);
          this.asi.o.querySelector<HTMLInputElement>('.asi-text').setSelectionRange(value_text.length, value_text.length);
        }
      }
    }
  }

  add_value(token_id, value, set_closed?: boolean) {
    set_closed = isset(set_closed) ? set_closed : true;
    let token_data = this.by_id[token_id];
    let token_el = token_data.element;

    if (token_data.valuepass) {
      value = token_data.valuepass(value);
    }

    token_data.values.push(value);
    token_el.appendChild(createElement('span', {
      'class': 'asi-token--value',
      'text': value,
    }));

    this.set_closed(token_id, set_closed);

    this.asi.call_user_event('tokenchange', { type: 'add_value', subject: token_data });

    return true;
  }

  remove_value(token_id, index) {
    let token_data = this.by_id[token_id];
    let token_el = token_data.element;
    if (index >= 0 && index <= token_data.values.length - 1) {
      token_data.values.splice(index, 1);

      let list = token_el.querySelectorAll('.asi-token--value');
      removeDom(list[index]);
    } else {
      return false;
    }

    this.asi.call_user_event('tokenchange', { type: 'remove_value', subject: token_data });
    return true;
  }

  clear_values(token_id) {
    let token_data = this.by_id[token_id];
    token_data.values = [];

    removeDom(this.asi.o.querySelectorAll('.asi-group .asi-token[data-token-id="' + token_id + '"] .asi-token--value'));
    this.asi.call_user_event('tokenchange', { type: 'clear_values', subject: token_data });
  }

  get_values(token_id) {
    return this.by_id[token_id].values;
  }

  delete_token(token_id) {
    let token_data = this.by_id[token_id],
      token_el = this.by_id[token_id].element,
      input = this.asi.o.querySelector('.asi-text');
    let new_list = [];

    forEach(this.list, (item) => {
      if (item['id'] !== token_id) {
        new_list.push(item);
      }
    });

    this.list = new_list;
    this.label_count.subtract(token_data.label);

    if (this.active && this.active.id == token_id) {
      this.active = null;
      this.asi.helper.fix();
    }

    token_el.remove();
    this.asi.placeholder.check_icons();
    this.asi.call_user_event('tokenchange', { type: 'delete_token', subject: token_data });

    return true;
  }

  validate(token_id, value_optional?: any) {
    let token_el: HTMLElement = this.by_id[token_id].element,
      token_data = this.by_id[token_id],
      token_label = this.get_label(token_id),
      token_values = value_optional || this.get_values(token_id),
      token_type = this.get_prop(token_id, 'type') || 'text';

    const validator = (conf) => {
      conf = conf || {};
      let state: boolean | string = false;

      let match = conf['match'] || /(.*?)/;
      let check = conf['check'] || (() => {
        return true;
      });
      let error = conf['error'] || 'invalid input';
      let slimit = conf['limit_to_suggestions'] || false;

      const value_validate = (token_value) => {
        if (state !== false) {
          return false;
        }
        if (token_value.length == 0) {
          state = false;
        } else {
          if (this.asi.types.validate(token_type, token_value) === false) {
            state = this.asi.types.get_error(token_type, token_id);
          } else {
            if (match.test(token_value) && check(token_value)) {
              state = false;
            } else {
              state = error;
            }
          }
        }

        if (token_value.length != 0 && slimit && token_data.suggestions) {
          if (!token_data.suggestions_lower.includes(token_value.toLowerCase())) {
            if (typeof slimit === 'string') {
              state = slimit;
            } else {
              state = 'Not a valid choice! Choose from dropdown.';
            }
          }
        }
      }

      if (typeof token_values === 'string') {
        value_validate(token_values);
      } else {
        forEach(token_values, value_validate);
      }

      return state;
    }

    const check = () => {
      let validate_conf = this.get_prop(token_id, 'validate'), state;

      if (validate_conf || token_type != 'text') {
        state = validator(validate_conf);
      } else {
        state = false;
      }

      let event = this.asi.call_user_event('validate', {
        token: token_data,
        conf: validate_conf,
        error: state,
      });

      if (event.cancelled) {
        event.error = false;
      }

      return event.error;
    }

    const process = (error_state) => {
      if (this.active && this.active.element == token_el) {
        this.asi.helper.set_error(error_state);
        if (error_state === false) {
          removeClass(token_el, 'asi-token--error');
          token_data.error = false;
        } else {
          addClass(token_el, 'asi-token--error');
          token_data.error = error_state;
        }
      } else {
        if (error_state === false) {
          removeDom(token_el.querySelector('.asi-tooltip'));
          removeClass(token_el, 'asi-token--error');
          token_data.error = false;
          return;
        } else {
          let tooltip = createElement('span', { 'class': 'asi-tooltip', 'text': error_state });
          token_el.prepend(tooltip);
          addClass(token_el, 'asi-token--error');
          this.asi.adjustTooltips();
          token_data.error = error_state;
        }
      }
      return error_state;
    }

    return process(check());
  }
}