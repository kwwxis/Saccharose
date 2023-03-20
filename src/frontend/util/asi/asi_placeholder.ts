import { ASI } from './asi';
import { isset } from '../../../shared/util/genericUtil';
import { addClass, removeClass } from './asi_util';

export class AsiPlaceholder {
  constructor(readonly asi: ASI) {}

  set(text) {
    let placeholder = this.asi.o.querySelector('.asi-placeholder');
    placeholder.innerHTML = text;
  }

  get_default() {
    let ret: string|boolean = 'Search';
    if (!this.asi.is_token_empty() && this.asi.is_text_empty()) {
      if (this.asi.options && isset(this.asi.options.active_placeholder)) {
        ret = this.asi.options.active_placeholder;
      }
    } else {
      if (this.asi.options && isset(this.asi.options.placeholder)) {
        ret = this.asi.options.placeholder;
      }
    }
    if (ret === false) {
      ret = '';
    } else if (ret === true) {
      ret = 'Search';
    }
    return ret;
  }

  set_initial(state) {
    let placeholder = this.asi.o.querySelector('.asi-placeholder');
    if (state) {
      let tmp = this.asi.tokens.get_active_prop('placeholder');

      if (this.asi.tokens.active && (!isset(tmp) || this.asi.tokens.active.use_type_placeholder) && this.asi.tokens.active.type) {
        tmp = this.asi.types.get_placeholder(this.asi.tokens.active.type);
      }

      if (tmp) {
        placeholder.innerHTML = tmp;
      } else {
        placeholder.innerHTML = this.get_default();
      }
    } else {
      placeholder.innerHTML = '';
    }
  }

  check_icons(text?: string) {
    text = text || this.asi.o.querySelector<HTMLInputElement>('.asi-text').value;
    if (text.length == 0 && this.asi.tokens.is_empty()) {
      removeClass(this.asi.o.querySelector('.asi-icon--empty'), 'asi-hide');
      addClass(this.asi.o.querySelector('.asi-icon--active'), 'asi-hide');
    } else {
      addClass(this.asi.o.querySelector('.asi-icon--empty'), 'asi-hide');
      removeClass(this.asi.o.querySelector('.asi-icon--active'), 'asi-hide');
    }
  }
}