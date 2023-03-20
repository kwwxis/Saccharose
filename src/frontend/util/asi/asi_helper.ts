import { addClass, forEach, off, on, removeAllChildren, removeClass, removeDom } from './asi_util';
import { createElement, frag, frag1 } from '../domutil';
import { escapeHtml } from '../../../shared/util/stringUtil';
import { isPromise, isset } from '../../../shared/util/genericUtil';
import { isInt } from '../../../shared/util/numberUtil';
import Pikaday from 'pikaday';
import { ASI } from './asi';

interface AsiHelperComponent {
  el: HTMLElement,

  init?: Function;
  cleanup?: Function,
  destroy?: Function,

  set_value?: (value: string) => void,
  get_value?: () => string,
  filter?: (value: string) => void,
}

export class AsiHelper {
  constructor(readonly asi: ASI) {}

  active_item: HTMLLIElement = null;
  item_list: HTMLLIElement[] = [];
  filtered_list: HTMLLIElement[] = [];
  destroy_queue: AsiHelperComponent[] = [];
  filter_queue: AsiHelperComponent[] = [];
  
  set_visible(state): this {
    if (state) {
      addClass(this.asi.o, 'asi--helper-visible');
      removeClass(this.asi.o.querySelector('.asi-helper'), 'asi-hide');
    } else {
      removeClass(this.asi.o, 'asi--helper-visible');
      addClass(this.asi.o.querySelector('.asi-helper'), 'asi-hide');
    }
    return this;
  }

  clear(event?: Event): this {
    if (event) {
      event.stopPropagation();
      this.asi.o.querySelector<HTMLInputElement>('.asi-text').focus();
    }

    this.item_list = [];
    this.filtered_list = [];
    this.active_item = null;

    off(this.asi.o.querySelectorAll('.asi-helper .asi-helpitem'), 'click');

    forEach(this.destroy_queue, (item: AsiHelperComponent) => {
      if (item.cleanup) {
        item.cleanup();
      }
      if (item.destroy) {
        item.destroy();
      }
    });

    this.destroy_queue = [];
    this.filter_queue = [];

    removeAllChildren(this.asi.o.querySelector('.asi-helper'));

    return this;
  }

  set_error(message) {
    let helper_el = this.asi.o.querySelector('.asi-helper');
    let search_for = helper_el.querySelector('.asi--search-for');

    // set_error is called from tokens.validate, which does not consider empty values to be invalid.
    // The "search-for" component exists when the input is not empty, so technically this if statement
    // should never evaluate to be true, unless called externally
    if (!search_for) {
      return;
    }

    if (message === false) {
      removeDom(search_for.querySelector('.asi-search-for--error'));
      search_for.removeAttribute('data-error');
    } else {
      if (message == search_for.getAttribute('data-error')) {
        return;
      } else {
        search_for.setAttribute('data-error', message);
      }

      let error_el = createElement('div', {'class': 'asi-search-for--error', 'text': message});
      search_for.appendChild(error_el);
    }
  }

  fix(event?: Event) {
    let helper_el = this.asi.o.querySelector('.asi-helper');
    event = event || null;

    if (!this.asi.tokens.is_active()) {
      if (!this.search_options_exists()) {
        this.clear(event).add_search_options();
      }
    } else {
      let modifier    = this.asi.tokens.get_modifier(this.asi.tokens.active.id);
      let token_label = this.asi.tokens.active.label;

      let s1 = !this.asi.tokens.active.suggestions || this.token_searcher_exists();
      let s2 = !this.asi.tokens.get_active_prop('desc_html') || this.token_description_exists();
      let s3 = !this.asi.tokens.active.modifiers || this.token_modifiers_exists();

      if (modifier) {
        if (!s1 || !s2 || s3) {
          this.clear(event)
            .add_token_description(token_label, modifier)
            .add_token_searcher(token_label);
        }
      } else {
        if (!s1 || !s2 || !s3 || this.search_options_exists()) {
          this.clear(event)
            .add_token_description(token_label)
            .add_token_modifiers(token_label)
            .add_token_searcher(token_label);
        }
      }
    }

    if (this.asi.tokens.active) {
      let type = this.asi.tokens.active.type || false;
      helper_el.setAttribute('data-token-for--label', this.asi.tokens.active.label);
      helper_el.setAttribute('data-token-for--id', this.asi.tokens.active.id);
      helper_el.setAttribute('data-token-for--type', type);
    } else {
      helper_el.removeAttribute('data-token-for--label');
      helper_el.removeAttribute('data-token-for--id');
      helper_el.removeAttribute('data-token-for--type');
    }
  }

  /* ------ KEY NAVIGATION */
  input_filter(text) {
    let helper_el: HTMLElement = this.asi.o.querySelector('.asi-helper');
    let original_text = text;
    text = text.toLowerCase();

    if (this.filter_queue.length) {
      forEach(this.filter_queue, (item: AsiHelperComponent) => {
        if (item.filter) {
          item.filter(original_text);
        }
      });
    }

    if (this.item_list.length != 0) {
      let new_filtered_list: HTMLLIElement[] = [];
      let bucket = {};

      forEach(this.item_list, (item: HTMLLIElement) => {
        let data = item.getAttribute('data-value').toLowerCase();
        let state;

        if (text.length != 0 && (!data || !data.startsWith(text))) {
          addClass(item, 'asi-hide');
          if (item == this.active_item) {
            this.active_item = null;
          }
          state = false;
        } else {
          new_filtered_list.push(item);
          removeClass(item, 'asi-hide');
          state = true;
        }

        let section = item.getAttribute('data-parent');
        if (section) {
          if (!bucket[section]) {
            bucket[section] = 0;
          }
          bucket[section] += (state ? 1 : 0);
        }
      });

      this.filtered_list = new_filtered_list;

      // hide sections with no items in its filtered list
      for (let section in bucket) {
        if (bucket.hasOwnProperty(section)) {
          let section_el = helper_el.querySelector('section[data-section='+section+']');
          if (bucket[section] == 0) {
            addClass(section_el, 'asi-hide');
          } else {
            removeClass(section_el, 'asi-hide');
          }
        }
      }
    }

    // update "search for"
    let search_for = helper_el.querySelector('.asi--search-for');
    let search_for__input = helper_el.querySelector<HTMLInputElement>('.asi-search-for--input');
    let search_for__label = (this.asi.get_property('search_label') || 'Search for')+':';

    if (!search_for__input) {
      let helper_el_html = frag(`
          <section class="asi--search-for valign" data-section="search-for">
            <span class="asi-search-for--label">${escapeHtml(search_for__label)}</span>
            <input class="asi-search-for--input" type="text" disabled="" />
            <kbd>ENTER</kbd>
          </section>
        `)
      helper_el.prepend(helper_el_html);

      search_for = helper_el.querySelector('.asi--search-for');
      search_for__input = helper_el.querySelector('.asi-search-for--input');
    }

    if (original_text.length == 0)  {
      addClass(search_for, 'asi-hide');
      search_for__input.value = original_text;
    } else {
      removeClass(search_for, 'asi-hide');
      search_for__input.value = original_text;
    }

    if (this.asi.tokens.active) {
      addClass(search_for, 'asi-search-for--token-active');
      if (this.asi.get_property('disable_space_completion')) {
        addClass(search_for, 'asi--no-space-completion');
      } else {
        removeClass(search_for, 'asi--no-space-completion');
      }
      this.asi.tokens.validate(this.asi.tokens.active.id, original_text);
    } else {
      removeClass(search_for, 'asi-search-for--token-active');
    }
  }

  input_down(_event) {
    if (this.filtered_list.length == 0) {
      return false;
    }

    if (this.active_item == null) {
      this.active_item = this.filtered_list[0];
    } else {
      removeClass(this.active_item, 'asi-selected');

      let i = this.filtered_list.indexOf(this.active_item);
      if (i == -1) return false;
      if ((++i) > this.filtered_list.length-1) {
        i = 0;
      }

      this.active_item = this.filtered_list[i];
    }

    this.ensure_item_visibility(this.active_item, true);
    addClass(this.active_item, 'asi-selected');
    return true;
  }

  input_up(_event) {
    if (this.filtered_list.length == 0) {
      return false;
    }

    if (this.active_item == null) {
      this.active_item = this.filtered_list[this.filtered_list.length-1];
    } else {
      removeClass(this.active_item, 'asi-selected');

      let i = this.filtered_list.indexOf(this.active_item);
      if (i == -1) return false;
      if ((--i) < 0) {
        i = this.filtered_list.length-1;
      }

      this.active_item = this.filtered_list[i];
    }

    this.ensure_item_visibility(this.active_item, false);
    addClass(this.active_item, 'asi-selected');
    return true;
  }

  // finds the current active helper item and simulates a click if it exists
  input_enter(event,add_another) {
    add_another = add_another || false;
    if (this.active_item !== null) {
      let input = this.asi.o.querySelector<HTMLInputElement>('.asi-text');
      let data = this.active_item.getAttribute('data-value');

      if (input.value.length && data.toLowerCase().startsWith(input.value.toLowerCase())) {
        this.asi.set_text('');
      }

      let active_item = this.active_item;
      active_item.setAttribute('data-add-another', add_another);
      active_item.click();
      return true;
    }
    return false;
  }

  ensure_item_visibility(active_item, direction_down) {
    if (!active_item) return;

    let container   = active_item.closest('.asi-helplisting');
    let itemIndex   = Array.prototype.indexOf.call(container.childNodes, active_item);

    let relPos      = container.scrollTop;
    let relHeight   = container.getBoundingClientRect().height;
    let itemHeight  = active_item.getBoundingClientRect().height;
    let itemPos     = itemIndex * itemHeight;

    if (relPos < itemPos && (itemPos+itemHeight) <= (relPos + relHeight)) {
    } else {
      if (direction_down) {
        container.scrollTop = itemPos-relHeight+itemHeight;
      } else {
        container.scrollTop = itemPos;
      }
    }
  }

  create_component(section_id: string, section_title: string, itemlist: {el: string, click: (event: MouseEvent) => void, value: string}[]|false) {
    let enter = this.asi.o.querySelector('.asi-helper');

    if (itemlist === false) {
      let enterHtml = frag(`
          <section class="asi--${section_id} asi--sectionLoading" data-section="${section_id}">
            <span class="asi-helptitle">${escapeHtml(section_title)}</span>
            <div class="halign spacer10-bottom">
              <div class="loading smaller"></div>
            </div>
          </section>
        `);
      enter.appendChild(enterHtml);
      return this;
    }

    if (itemlist.length === 0) {
      let enterHtml = frag(`
          <section class="asi--${section_id} asi--sectionLoading" data-section="${section_id}">
            <span class="asi-helptitle">${escapeHtml(section_title)}</span>
            <p>No suggestions available.</p>
          </section>
        `)
      enter.appendChild(enterHtml);
      return this;
    }

    let section = frag1(`
        <section class="asi--${section_id}" data-section="${section_id}">
          <span class="asi-helptitle">${escapeHtml(section_title)}</span>
          <ul class="asi-helplisting"></ul>
        </section>
      `);

    let ul = section.querySelector('ul');
    for (let item of itemlist) {
      let el: HTMLLIElement = createElement('li', {class: 'asi-helpitem'});

      let item_html = item.el,
        item_click = item.click,
        item_text  = item.value;

      // stop click event to prevent unfocusing the text element
      // and causing the helper visibility to go away
      on(el,'click', (event: MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        item_click(event);
        return false;
      });

      el.innerHTML = item_html;
      el.setAttribute('data-value', item_text);
      el.setAttribute('data-parent', section_id);

      this.item_list.push(el);
      this.filtered_list.push(el);
      ul.append(el);
    }

    enter.appendChild(section);
    return this;
  }

  component_exists(id) {
    return this.asi.o.querySelector('.asi-helper section.asi--'+id) !== null;
  }

  /* ------ TOKEN SEARCHER */
  add_token_searcher(token_label) {
    if (!this.asi.options || !this.asi.options.tokens) {
      return this;
    }

    let token_data = this.asi.options.tokens[token_label];
    if (!token_data) return this;

    if (token_data.suggestions) {
      let loadingSection =
        this.asi.o.querySelector('.asi-helper .asi--token-searcher.asi--sectionLoading');

      let title = token_data['placeholder'] ? token_data['placeholder'] : 'Suggestions',
        items = [];

      if (isPromise(token_data.suggestions)) {
        setTimeout(() => {
          this.add_token_searcher(token_label);
        }, 50);

        if (loadingSection) {
          return this;
        }

        return this.create_component('token-searcher', title, false);
      } else {
        removeDom(loadingSection);
      }

      forEach(token_data.suggestions, (suggestion_text) => {
        let html = '<span class="asi-helpitem--label">' + token_label + ':</span> ' +
          '<span class="asi-helpitem--placeholder">' + suggestion_text + '</span>';
        items.push({el: html, process_value: suggestion_text, click: (event: MouseEvent) => {
            let eventTarget: Element = event.currentTarget as Element;
            let add_another = eventTarget.getAttribute('data-add-another') == 'true';
            eventTarget.removeAttribute('data-add-another');

            this.asi.tokens.process_value(suggestion_text, add_another);
            this.asi.clear_text();
            setTimeout(() => {
              this.asi.events.input_emptied(event);
              this.asi.focus();
            });
          }})
      });

      return this.create_component('token-searcher', title, items);
    } else if (token_data.type) {
      let enter = this.asi.o.querySelector('.asi-helper'), html;
      let typedata = token_data.type.toLowerCase().split(':');
      let type = typedata[0];
      let flag = typedata.length == 2 ? typedata[1] : null;

      let do_date = type == 'datetime' || type == 'date';
      let do_time = type == 'datetime' || type == 'time';

      if (do_date || do_time) {
        html = this._token_searcher__datetime(type, flag, do_date, do_time);
      }

      if (html) {
        enter.appendChild(html);
      }
    } else {
      return this;
    }
  }

  _token_searcher__datetime(type: string, flag: string, do_date: boolean, do_time: boolean) {
    const instance = this;
    let component = {
      el: frag1(`
          <section class="asi--type-${type}" data-section="type-${type}">
            <span class="asi-helptitle">
              <span>Choose ${type}</span>
              <span class="grow"></span>
              <button class="asi-helpbtn asi-helpbtn--cancel">Cancel</button>
              <button class="asi-helpbtn asi-helpbtn--done">Done</button>
            </span>
            <div class="asi-helpbody asi-component--datetime" data-date="${do_date}" data-time="${do_time}"></div>
          </section>
        `),
      date_picker: null,
      time_picker: null,
      set_value(value: string) {
        let parts = value.split(' ');

        let day_name = null;
        let month = null;
        let day = null;
        let year = null;

        let hour = null;
        let minute = null;
        let second = null;
        let period = null;

        let offset = 0;

        if (do_date) {
          if (/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat)$/i.test(parts[0])) {
            day_name = parts[0];
            offset = 1;
          }

          if (parts.length >= 3) {
            if (parts[offset].length >= 3) {
              month = parts[offset];
            }
            offset++;
            if (isInt(parts[offset])) {
              day = parseInt(parts[offset]);
            }
            offset++;
            if (isInt(parts[offset]) && parts[offset].length == 4) {
              year = parseInt(parts[offset]);
            }
            offset++;
          }
        }

        if (do_time) {
          if (parts[offset] && parts[offset].includes(':')) {
            let time_parts = parts[offset].split(':');
            if (time_parts.length >= 2) {
              hour = parseInt(time_parts[0]);
              minute = parseInt(time_parts[1]);
              if (time_parts.length == 3) {
                second = parseInt(time_parts[2]);
              }
            }
            offset++;
            if (parts[offset]) {
              period = parts[offset];
            }
          }
        }

        if (do_date && isset(month) && isset(day) && isset(year) && !isNaN(day) && !isNaN(year)) {
          component.set_date_value(month, day, year);
        }

        if (do_time && isset(hour) && isset(minute) && !isNaN(hour) && !isNaN(minute)) {
          if (!isset(period)) {
            period = 'pm';
          }
          component.set_time_value(hour, minute, period);
        }
      },
      set_date_value(month, day, year) {
        // will also trigger onSelect and thus update the 'data-date-val' attribute
        const datePicker: Pikaday = component.date_picker;
        datePicker.setDate(month+' '+day+' '+year,true);
        component.el.setAttribute('data-date-val', datePicker.toString('MMM DD YYYY'));
      },
      set_time_value(hour, minute, period) {
        component.time_picker.setTime(hour,minute,period,true);
      },
      get_value() {
        let value = '';
        if (do_date) {
          let val = component.el.getAttribute('data-date-val');
          if (val !== 'false') {
            value += val;
          }
        }
        if (do_time) {
          let val = component.el.getAttribute('data-time-val');
          if (val !== 'false') {
            if (value.length) {
              value += ' ';
            }
            value += val;
          }
        }
        return value;
      },
      cleanup() {
        if (do_time) {
          component.time_picker.destroy();
        }
        if (do_date) {
          component.date_picker.destroy();
        }

        off(component.el.querySelector('.asi-helpbtn--cancel'));
        off(component.el.querySelector('.asi-helpbtn--done'));
      },
      cancel(event) {
        event.preventDefault();
        event.stopPropagation();

        component.cleanup();
        instance.asi.tokens.pop();
        instance.asi.set_text('');

        instance.asi.focus();
        return false;
      },
      update() {
        instance.asi.set_text(component.get_value());
        instance.asi.focus();

        let input = instance.asi.o.querySelector<HTMLInputElement>('.asi-text');
        input.setSelectionRange(input.value.length, input.value.length);
      },
      finish(event) {
        event.preventDefault();
        event.stopPropagation();

        let value = component.get_value();
        if (value.trim().length == 0) {
          return false;
        }

        if (instance.asi.tokens.process_value(value, false) !== false) {
          component.cleanup();
          instance.asi.set_text('');

          setTimeout(() => {
            instance.asi.events.input_emptied(event);
          });
        }

        return false;
      },
      filter(value: string) {
        let current = component.get_value().toLowerCase();
        if (value.toLowerCase() !== current) {
          component.set_value(value);
        }
      },
      init() {
        on(component.el.querySelector('.asi-helpbtn--cancel'), 'click', component.cancel.bind(component));
        on(component.el.querySelector('.asi-helpbtn--done'), 'click', component.finish.bind(component));

        if (do_date) {
          component.date_picker = new Pikaday({
            defaultDate: new Date(),
            maxDate: new Date(),
            onSelect(_date) {
              const datePicker: Pikaday = component.date_picker;
              component.el.setAttribute('data-date-val', datePicker.toString('MMM DD YYYY'));
              component.update();
            }
          });
          const datePicker: Pikaday = component.date_picker;
          component.el.setAttribute('data-date-val', datePicker.toString('MMM DD YYYY'));
          component.el.querySelector('.asi-helpbody').appendChild(datePicker.el);
        }

        if (do_time) {
          component.el.setAttribute('data-time-val', 'false');

          component.time_picker = instance._create_time_chooser(component.el, this.update);
          component.el.querySelector('.asi-helpbody').appendChild(component.time_picker.el);
        }
        return this;
      },
    };

    component.init();
    this.destroy_queue.push(component);
    this.filter_queue.push(component);

    return component.el;
  }

  _create_time_chooser(parent: HTMLElement, update_function): AsiHelperComponent {
    let html = frag1(`
        <div class="asi-timechooser">
          <div class="asi-clock" data-hour="false" data-minute="false" data-period="pm">
            <div class="asi-clock--hourhand"></div>
            <div class="asi-clock--minutehand"></div>
            <div class="asi-innerclock asi-innerclock--hour">
              <div class="asi-clockopt" data-value="12">12</div>
              <div class="asi-clockopt" data-value="1">1</div>
              <div class="asi-clockopt" data-value="2">2</div>
              <div class="asi-clockopt" data-value="3">3</div>
              <div class="asi-clockopt" data-value="4">4</div>
              <div class="asi-clockopt" data-value="5">5</div>
              <div class="asi-clockopt" data-value="6">6</div>
              <div class="asi-clockopt" data-value="7">7</div>
              <div class="asi-clockopt" data-value="8">8</div>
              <div class="asi-clockopt" data-value="9">9</div>
              <div class="asi-clockopt" data-value="10">10</div>
              <div class="asi-clockopt" data-value="11">11</div>
            </div>
            <div class="asi-innerclock asi-innerclock--minute">
              <div class="asi-clockopt" data-value="00">0</div>
              <div class="asi-clockopt" data-value="05">5</div>
              <div class="asi-clockopt" data-value="10">10</div>
              <div class="asi-clockopt" data-value="15">15</div>
              <div class="asi-clockopt" data-value="20">20</div>
              <div class="asi-clockopt" data-value="25">25</div>
              <div class="asi-clockopt" data-value="30">30</div>
              <div class="asi-clockopt" data-value="35">35</div>
              <div class="asi-clockopt" data-value="40">40</div>
              <div class="asi-clockopt" data-value="45">45</div>
              <div class="asi-clockopt" data-value="50">50</div>
              <div class="asi-clockopt" data-value="55">55</div>
            </div>
          </div>
          <div></div>
          <div class="asi-timeperiod">
            <div class="asi-timeperiodopt asi-timeperiodopt--am" data-value="am">am</div>
            <div class="asi-timeperiodopt asi-timeperiodopt--pm asi-timeperiodopt--selected" data-value="pm">pm</div>
          </div>
        </div>
      `);

    let clock_el    = html.querySelector('.asi-clock');

    let hour_hand   = html.querySelector('.asi-clock--hourhand');
    let hour_opts   = html.querySelectorAll('.asi-innerclock--hour .asi-clockopt');

    let minute_hand = html.querySelector('.asi-clock--minutehand');
    let minute_opts = html.querySelectorAll('.asi-innerclock--minute .asi-clockopt');

    let period_opts = html.querySelectorAll('.asi-timeperiodopt');

    let no_update_function = false;

    const update_parent = () => {
      if (!parent) return;

      let value = clock_el.getAttribute('data-hour') + ':' +
        clock_el.getAttribute('data-minute') + ' ' +
        clock_el.getAttribute('data-period');

      // "false" is the unassigned value (see gen above)
      // if contains not yet assigned value, don't update parent
      if (!value.includes('false')) {
        parent.setAttribute('data-time-val', value);
        if (!no_update_function) {
          update_function(value);
        }
      }
    }

    on(hour_opts, 'click', (event) => {
      const el: Element = event.currentTarget;

      addClass(clock_el, 'asi-clock--hourselected');
      clock_el.setAttribute('data-hour', el.getAttribute('data-value'));

      removeClass(hour_opts, 'asi-clockopt--selected');
      addClass(el, 'asi-clockopt--selected');

      let itemIndex   = Array.prototype.indexOf.call(hour_opts, el);
      hour_hand.setAttribute('style', 'transform: translate(-50%) rotate('+(30.0*itemIndex)+'deg)');

      update_parent();
      return false;
    });

    on(minute_opts, 'click', (event) => {
      const el: Element = event.currentTarget;

      addClass(clock_el, 'asi-clock--minuteselected');
      clock_el.setAttribute('data-minute', el.getAttribute('data-value'));

      removeClass(minute_opts, 'asi-clockopt--selected');
      addClass(el, 'asi-clockopt--selected');

      let itemIndex   = Array.prototype.indexOf.call(minute_opts, el);
      minute_hand.setAttribute('style', 'transform: translate(-50%) rotate('+(30.0*itemIndex)+'deg)');

      update_parent();
      return false;
    });

    on(period_opts, 'click', (event) => {
      const el: Element = event.currentTarget;

      clock_el.setAttribute('data-period', el.getAttribute('data-value'));

      removeClass(period_opts, 'asi-timeperiodopt--selected');
      addClass(el, 'asi-timeperiodopt--selected');

      update_parent();
      return false;
    });

    return <AsiHelperComponent> {
      el: html,
      destroy() {
        off(hour_opts);
        off(minute_opts);
        off(period_opts);
        if (html.parentElement) {
          removeDom(html);
        }
      },
      setTime(hour, minute, period, no_update) {
        hour   = '' + hour;
        minute = '' + minute;
        period = period.toLowerCase();

        if (minute.length == 1) {
          minute = '0'+minute;
        }

        if (period.length == 1) {
          period = period+'m';
        }

        if (period != 'am' && period != 'pm') {
          period = 'pm';
        }

        if (no_update) {
          no_update_function = true;
        }

        let hour_opt   = html.querySelector<HTMLElement>('.asi-innerclock--hour [data-value="'+hour+'"]');
        let minute_opt = html.querySelector<HTMLElement>('.asi-innerclock--minute [data-value="'+minute+'"]');
        let period_opt = html.querySelector<HTMLElement>('.asi-timeperiodopt[data-value="'+period+'"]');

        if (hour_opt) hour_opt.click();
        if (minute_opt) minute_opt.click();
        if (period_opt) period_opt.click();

        no_update_function = false;
      },
      getTime() {
        return {
          hour: parseInt(clock_el.getAttribute('data-hour')),
          minute: parseInt(clock_el.getAttribute('data-minute')),
          period: clock_el.getAttribute('data-period'),
        };
      },
    };
  }

  token_searcher_exists() {
    return this.component_exists('token-searcher');
  }

  /* ------ TOKEN MODIFIERS */
  add_token_modifiers(token_label) {
    let enter = this.asi.o.querySelector('.asi-helper');

    if (!this.asi.options || !this.asi.options.tokens) {
      return this;
    }

    let token_data = this.asi.options.tokens[token_label];
    if (!token_data || !token_data.modifiers) {
      return this;
    }

    let modifiers_list = Array.isArray(token_data.modifiers) ? token_data.modifiers :
        Object.keys(token_data.modifiers),
      items = [];

    forEach(modifiers_list, (modifier) => {
      items.push({
        el: '<span class="asi-helpitem--label">mod:</span> ' +
          '<span class="asi-helpitem--placeholder">'+modifier+'</span>',
        value: modifier,
        click: (event) => {
          this.asi.tokens.process_modifier(token_label, modifier, event);
          this.asi.clear_text();
          this.asi.focus();
        }
      });
    });

    return this.create_component('token-modifiers', 'Modifiers (optional)', items);
  }

  token_modifiers_exists() {
    return this.component_exists('token-modifiers');
  }

  /* ------ TOKEN DESCRIPTION */
  add_token_description(token_label, modifier?: string) {
    let enter = this.asi.o.querySelector('.asi-helper');

    if (!this.asi.options || !this.asi.options.tokens) {
      return this;
    }

    let token_data = this.asi.options.tokens[token_label];
    let desc_html = token_data.desc_html;

    if (modifier && token_data.modifiers && token_data.modifiers[modifier]
      && token_data.modifiers[modifier].desc_html){
      desc_html = token_data.modifiers[modifier].desc_html;
    }

    if (!token_data || !desc_html) {
      return this;
    }

    let section = createElement('section', {'class': 'asi--token-description', 'data-section': 'token-description'});
    if (typeof desc_html === 'string') {
      let desc_el = document.createElement('div');
      desc_el.setAttribute('class', 'asi-desc');
      desc_el.innerHTML = desc_html;
      section.appendChild(desc_el);
    } else {
      section.appendChild(desc_html.cloneNode(true));
    }

    enter.appendChild(section);

    return this;
  }

  token_description_exists() {
    return this.component_exists('token-description');
  }

  /* ------ TOKEN DESCRIPTION */
  add_text(desc_html) {
    let enter = this.asi.o.querySelector('.asi-helper');

    if (!desc_html) {
      return this;
    }

    let section = createElement('section', {'class': 'asi--text', 'data-section': 'text'});
    if (typeof desc_html === 'string') {
      let desc_el = document.createElement('div');
      desc_el.setAttribute('class', 'asi-desc');
      desc_el.innerHTML = desc_html;
      section.appendChild(desc_el);
    } else {
      section.appendChild(desc_html.cloneNode(true));
    }

    enter.appendChild(section);

    return this;
  }

  text_exists() {
    return this.component_exists('text');
  }

  /* ------ MAIN SEARCH OPTIONS */
  add_search_options() {
    let enter = this.asi.o.querySelector('.asi-helper');

    if (!this.asi.options || !this.asi.options.tokens) {
      return this;
    }

    let tokens = this.asi.options.tokens,
      items = [];

    for (let token_label of Object.keys(tokens)) {
      let html = '<span class="asi-helpitem--label">' + token_label + ':</span> ';

      if (this.asi.options.tokens[token_label]['placeholder']) {
        html += '<span class="asi-helpitem--placeholder">'+
          this.asi.options.tokens[token_label]['placeholder']+'</span>';
      }

      items.push({el:html, value: token_label, click: (event) => {
          this.asi.tokens.process_label(token_label, event);
          this.asi.clear_text();
          this.asi.focus();
        }});
    }

    return this.create_component('search-options', 'Search Options', items);
  }

  search_options_exists() {
    return this.component_exists('search-options');
  }
}