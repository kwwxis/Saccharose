// noinspection JSDeprecatedSymbols

import { isTextSelected } from './asi_util';
import { isset } from '../../../shared/util/genericUtil';
import { ASI } from './asi';

export class AsiEvents {

  constructor(readonly asi: ASI) {}

  // cut event - handles width adjustment upon clipboard cut
  cut(event) {
    let input = event.currentTarget as HTMLInputElement;
    let prev = input.value;

    setTimeout(() => {
      this.asi.events.input_changed(input.value, prev, event);
    }, 0);
  }

// cut event - handles width adjustment upon clipboard paste
  paste(event) {
    let input = event.currentTarget as HTMLInputElement;
    let prev = input.value;

    // if input is empty, or everything in the input is selected
    if ((prev.length == 0 || isTextSelected(input)) && event.clipboardData) {
      event.preventDefault();
      this.asi.raw.unstringify(event.clipboardData.getData('text'), true);
      return false;
    }

    setTimeout(() => {
      this.asi.events.input_changed(input.value, prev, event);
    }, 0);
  }

  // copy event - nothing to do here
  copy(_event) {
    return;
  }

  // click event - handles focusing the input
  click_count: number = 0;
  last_click: number = new Date().getTime();

  click(event: MouseEvent) {
    let last_click = this.last_click;
    this.last_click = new Date().getTime();

    if (this.last_click - last_click < 300) {
      this.click_count += 1;
    } else {
      this.click_count = 1;
    }

    let click_count = this.click_count;

    let eventTarget: HTMLElement = event.currentTarget as HTMLElement;

    if (eventTarget.closest('.asi-helper') ||
      eventTarget.closest('.asi-icon--copy') ||
      eventTarget.closest('.asi-group')) {
      return;
    }

    let input: HTMLInputElement = eventTarget.querySelector('.asi-text');
    input.focus();

    // x/y coordinates relative to input element
    let x = event.clientX - eventTarget.getBoundingClientRect().left;
    let y = event.clientY - eventTarget.getBoundingClientRect().top;

    let word_split = /([!@#$%^&*()\-+= ])/;

    let cursor_to_end = () => {
      if (click_count == 1) {
        input.setSelectionRange(input.value.length, input.value.length);
      } else if (click_count == 2) {
        let split = input.value.split(word_split);
        let last_word = split[split.length - 1];

        input.setSelectionRange(input.value.length - last_word.length, input.value.length);
      } else if (click_count >= 3) {
        input.setSelectionRange(0, input.value.length);
      }
    };

    let cursor_to_start = () => {
      if (click_count == 1) {
        input.setSelectionRange(0, 0);
      } else if (click_count == 2) {
        let first_word = input.value.split(word_split)[0];
        input.setSelectionRange(0, first_word.length);
      } else if (click_count >= 3) {
        input.setSelectionRange(0, input.value.length);
      }
    };

    // if click on the container element, set cursor position to end
    if (eventTarget.classList.contains('asi-input')) {
      if (x <= 10) { // 10px -> left padding of asi-input
        cursor_to_start();
      } else {
        cursor_to_end();
      }
    }
  }

  focus(event: Event) {
    this.asi.helper.set_visible(true);
    if (this.asi.o.querySelector<HTMLInputElement>('.asi-text').value.length == 0) {
      this.input_emptied(event);
    }
  }

  blur(_event: Event) {
    /* nothing to do here, helper hide occurs on user click-off */
  }

  keypress(event: MouseEvent) {
    let input = event.currentTarget as HTMLInputElement,
      code = (<any> event).keyCode || event.which,
      c = String.fromCharCode(code),
      prev = input.value,
      handled = false;

    let next = prev.substr(0, input.selectionStart) + c + prev.substr(input.selectionEnd);

    // this prevent_default function also clears 'c' to prevent width change
    const prevent_default = () => {
      event.preventDefault();
      c = '';
    }

    const clear = () => {
      prevent_default();
      input.value = '';
      next = '';
    }

    if (code == 10 || code == 13) {
      // Enter
      handled = true;
      prevent_default();

      if (this.asi.call_user_event('enter').cancelled) {
        return false;
      }

      if (!this.asi.helper.input_enter(event, false)) {
        // If token is active, and current input value is not empty, then process the value
        if (this.asi.tokens.is_active() && input.value.length !== 0) {
          let result = this.asi.tokens.process_value(input.value, false);
          if (result === true) {
            clear();
          } else if (result === false) {
            return false;
          }
          // If token is not active, then enter was pressed at top-level, so complete
        } else if (!this.asi.tokens.is_active()) {
          if (!this.asi.call_user_event('complete').cancelled) {
            this.asi.helper.set_visible(false);
            this.asi.o.querySelector<HTMLInputElement>('.asi-text').blur();
          }
          return false;
          // If active, and token has values and current input value is empty
          // Then set to closed (in other words, user changed mind about adding another value)
        } else {
          if (this.asi.tokens.active.values.length >= 1) {
            this.asi.tokens.set_closed(this.asi.tokens.active.id, true);
          }
          return false;
        }
      } else {
        return false;
      }
    } else switch (c) {
      case ':':
      case '(':
      case ')':
        if ((c == ':' || c == '(') && this.asi.tokens.process_label(input.value, event)) {
          handled = true;
          clear();
        }

        if ((c == ':' || c == ')') && this.asi.tokens.active) {
          if (this.asi.tokens.process_modifier(this.asi.tokens.active.label, input.value, event)) {
            handled = true;
            clear();
          }
        }
        break;
      case ' ':
        if (this.asi.tokens.is_active() && input.value.length == 0) {
          if (this.asi.tokens.active.values.length >= 1) {
            this.asi.tokens.set_closed(this.asi.tokens.active.id, true);
          }
          handled = true;
          prevent_default();
          return false;
        } else if (this.asi.tokens.active && !this.asi.get_property('disable_space_completion')) {
          let result = this.asi.tokens.process_value(input.value, false);
          if (result === true) {
            handled = true;
            clear();
          } else if (result === false) {
            handled = true;
            prevent_default();
            return false;
          }
        }
        break;
      case '+':
        if (this.asi.tokens.active && !this.asi.get_property('disable_plus_completion')) {
          let pass = false;
          if (this.asi.get_property('allow_strings')) {
            let q1 = input.value.startsWith('\''),
              q2 = input.value.startsWith('"');
            if (q1 || q2) {
              if (q1 && input.value.endsWith('\'')) {
              } else if (q2 && input.value.endsWith('"')) {
              } else {
                pass = true;
              }
            }
          }

          if (input.value.length == 0) {
            handled = true;
            prevent_default();
            return false;
          }

          if (!pass) {
            let result = this.asi.tokens.process_value(input.value, true);
            if (result === true) {
              handled = true;
              clear();
            } else if (result === false) {
              handled = true;
              prevent_default();
              return false;
            }
          }
        }
    }

    let curr_type = this.asi.tokens.get_active_prop('type');
    if (!handled && curr_type && this.asi.types.checkch(curr_type, c, input.selectionStart, prev) === false) {
      event.preventDefault();
      return false;
    } else {
      this.asi.placeholder.set_initial(false);
    }

    this.asi.events.input_changed(next, prev, event);
  }

  keyup(event: MouseEvent) {
    let input = event.currentTarget as HTMLInputElement
    let code = (<any> event).keyCode || event.which;
    switch (code) {
      case 8:
      case 46:
        let prev = this.asi.getResizingValue();
        this.input_changed(input.value, prev, event);
        break;
    }
  }

  keydown(event: MouseEvent) {
    let code = (<any> event).keyCode || event.which,
      input = event.currentTarget as HTMLInputElement;

    const clear = () => {
      event.preventDefault();
      return (input.value = '');
    }

    switch (code) {
      // Left
      case 37:
        break;
      // Up
      case 38:
        if (this.asi.helper.input_up(event)) {
          event.preventDefault();
        }
        break;
      // Right
      case 39:
        break;
      // Down
      case 40:
        if (this.asi.helper.input_down(event)) {
          event.preventDefault();
        }
        break;
      // tab
      case 9:
        if (this.asi.call_user_event('tab').cancelled) {
          return false;
        }

        if (this.asi.helper.input_enter(event, false)) {
          event.preventDefault();
        } else if (this.asi.tokens.process_value(input.value, false)) {
          let prev = input.value;
          this.input_changed(clear(), prev, event);
        } else {
          event.preventDefault();
        }
        break;
      // backspace
      case 8:
        // if both equals 0 or both are identical, then that means
        // the backspace occurred at the beginning of the input
        if (input.value.length == 0 || (input.selectionStart == 0 && input.selectionEnd == 0)) {
          event.preventDefault();
          // if token is active and has a modifier, remove the modifier
          // otherwise pop the last token
          if (this.asi.tokens.is_active()) {
            if (this.asi.tokens.has_modifier(this.asi.tokens.active.id)) {
              this.asi.tokens.remove_modifier(this.asi.tokens.active.id);
            } else {
              let active_token = this.asi.tokens.active;
              if (active_token.values.length) {
                let value = active_token.values[active_token.values.length - 1];
                this.asi.tokens.remove_value(active_token.id, active_token.values.length - 1);

                this.asi.set_text(value + this.asi.get_text());
                input.setSelectionRange(value.length, value.length);
              } else {
                this.asi.tokens.pop();
              }
            }
          } else {
            let last_token = this.asi.tokens.peek();
            if (last_token) {
              this.asi.tokens.set_closed(last_token.id, false);
            }
          }
          return false;
        }
        break;
      // delete
      case 46:
        break;
    }
  }

  input_emptied(event) {
    if (!this.asi.tokens.is_active()) {
      if (!this.asi.helper.search_options_exists()) {
        this.asi.helper.clear(event).add_search_options();
      }
    }
    this.asi.placeholder.set_initial(true);
    this.asi.helper.input_filter('');
  }

  input_changed(text: string, previous_text: string, event?: Event, call_event?: Event | boolean) {
    event = event || null;

    if (!isset(call_event) || call_event !== false) {
      this.asi.call_user_event('textchange', {
        text: text,
        prev: previous_text,
        jsevent: event,
      });
    }

    this.asi.placeholder.check_icons(text);

    if (text.length == 0) {
      this.input_emptied(event);
    } else {
      this.asi.placeholder.set_initial(false);
      this.asi.helper.input_filter(text);
    }

    this.asi.adjustWidth(text);
  }
}