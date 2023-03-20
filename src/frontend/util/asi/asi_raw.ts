import { forEach } from './asi_util';
import { ASI } from './asi';

export class AsiRaw {

  constructor(readonly asi: ASI) {}

  unstringify(stringified, keep_existing_tokens) {
    keep_existing_tokens = keep_existing_tokens || false;
    this.set_from_parse(this.parse(stringified), keep_existing_tokens);
  }

  stringify() {
    let text = '';
    forEach(Array.from(this.asi.o.querySelectorAll('.asi-group .asi-token')), (token_el) => {
      let label = token_el.querySelector('.asi-token--label');
      let modifier = token_el.querySelector('.asi-token--modifier');
      let values = token_el.querySelectorAll('.asi-token--value');

      text += label.innerHTML;
      if (text.endsWith(':')) {
        text = text.slice(0,-1);
      }

      if (modifier) {
        text += '(' + modifier.innerHTML + ')';
      }

      text += ':';

      forEach(Array.from(values), (value_el, i, len) => {
        let value = value_el.innerHTML;
        if (value.includes(' ')) {
          text += '"'+value+'"';
        } else {
          text += value;
        }

        if (i != len-1) {
          text += '+';
        }
      });
      text += ' ';
    });

    text += this.asi.o.querySelector<HTMLInputElement>('.asi-text').value;
    return text;
  }
  set_from_parse(parse_data, keep_existing_tokens) {
    this.asi.event_reporting = false;
    keep_existing_tokens = keep_existing_tokens || false;

    if (keep_existing_tokens) {
      this.asi.clear_text();
    } else {
      this.asi.clear();
    }

    forEach(parse_data.tokens, (token: any, idx, len) => {
      if (token.values.length == 0 && idx == len-1 && parse_data.text.length == 0) {
        this.asi.tokens.process_label(token.label);
        if (token.modifier) {
          this.asi.tokens.process_modifier(token.label, token.modifier);
        }
        this.asi.event_reporting = true;
        return;
      }

      let token_data = this.asi.tokens.create_token(token.label);
      if (token_data !== false) {
        if (token.modifier) {
          this.asi.tokens.set_modifier(token_data.id, token.modifier);
        }

        forEach(token.values, (item) => {
          this.asi.tokens.add_value(token_data.id, item);
        });
      }
    });

    if (parse_data.text.length) {
      this.asi.set_text(parse_data.text);
      this.asi.placeholder.set_initial(false);
    } else if (!this.asi.tokens.active) {
      this.asi.placeholder.set_initial(true);
    }

    this.asi.placeholder.check_icons();
    this.asi.event_reporting = true;

    this.asi.call_user_event('tokenchange', {type: 'set_from_parse'});
  }
  parse(raw: string) {
    let result = {
      tokens: [],
      text: '',
    };

    const check_for_modifier = (label: string) => {
      let modifier: string = null;
      if (label.indexOf('(') != -1) {
        let index = label.indexOf('(');

        modifier = label.slice(index+1,label.length);
        label = label.slice(0,index);

        if (modifier.endsWith(')')) {
          modifier = modifier.slice(0,-1);
        }
      }
      return {label: label, modifier: modifier};
    }

    let data: string|string[] = raw.trim();
    while ((data = data.split(/:(.+)/, 2)).length == 2) {
      let token_label = data[0];

      let mod_check = check_for_modifier(token_label);
      let modifier = mod_check.modifier;
      token_label = mod_check.label;

      if (!this.asi.options.tokens || !this.asi.options.tokens[token_label]) {
        break;
      }

      let values = [];
      let token_data = data[1];
      while (true) {
        let quote1 = token_data.startsWith("'");
        let quote2 = token_data.startsWith('"');

        if (quote1 || quote2) {
          let quote = quote1 ? "'" : '"';
          token_data = token_data.slice(1);

          let quote_index = token_data.indexOf(quote);
          if (quote_index != -1) {
            values.push(token_data.slice(0,quote_index));
            data[1] = token_data.slice(quote_index+1,token_data.length);
          } else {
            values.push(token_data.slice(0,token_data.length));
            data[1] = '';
          }

          if (data[1].startsWith('+')) {
            token_data = data[1].slice(1);
          } else {
            break;
          }
        } else {
          let index = Math.min(token_data.indexOf(' '), token_data.indexOf('+'));
          if (index == -1) {
            index = Math.max(token_data.indexOf(' '), token_data.indexOf('+'));
          }
          if (index == -1) {
            values.push(token_data);
            data[1] = '';
            break;
          }

          values.push(token_data.slice(0, index));

          data[1] = token_data.slice(index, token_data.length);
          if (data[1].startsWith(' ')) {
            data[1] = data[1].slice(1);
            break;
          } else {
            token_data = data[1].slice(1);
          }
        }
      }

      data = data[1].trim();

      result.tokens.push({
        label: token_label,
        modifier: modifier,
        values: values,
      });
    }

    if (!(typeof data === 'string')) {
      data = data.join(':');
    }

    // check if ends with incomplete token (i.e. no values)
    if (!data.includes(' ') && data.endsWith(':')) {
      let mod_check = check_for_modifier(data.slice(0,-1));
      let modifier = mod_check.modifier;
      let token_label = mod_check.label;

      if (this.asi.options.tokens && this.asi.options.tokens[token_label]) {
        result.tokens.push({
          lable: token_label,
          modifier: modifier,
          values: [],
        });
        data = '';
      }
    }

    result.text = data;

    return result;
  }
}