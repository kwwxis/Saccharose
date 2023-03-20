import { isset } from '../../../shared/util/genericUtil';
import { ASI } from './asi';

export class AsiTypes {

  constructor(readonly asi: ASI) {}

  get_placeholder(type) {
    if (isset(type) && this.types[type] && this.types[type].placeholder) {
      return this.types[type].placeholder;
    }
    return null;
  }

  get_label(type, original) {
    if (isset(original)) {
      return original;
    }
    if (isset(type) && this.types[type] && this.types[type].label) {
      return this.types[type].label;
    }
    return 'Search for';
  }

  checkch(type: string, ch: string, pos: number, beforetext, flag?: string) {
    type = type.toLowerCase();
    flag = flag || '';
    if (type.includes(':')) {
      let typesplit = type.split(':');
      type = typesplit[0];
      flag = typesplit[1];
    }

    let typeconf = this.types[type];
    if (typeconf && typeconf.checkch) {
      return typeconf.checkch(ch,pos,beforetext,flag.toLowerCase());
    }
    return true;
  }

  validate(type: string, full, flag?: string) {
    type = type.toLowerCase();
    flag = flag || '';
    if (type.includes(':')) {
      let typesplit = type.split(':');
      type = typesplit[0];
      flag = typesplit[1];
    }

    let typeconf = this.types[type];
    if (typeconf && typeconf.validate) {
      return typeconf.validate(full,flag.toLowerCase());
    }
    return true;
  }

  get_error(type, token_id, flag?: string) {
    token_id = token_id || false;
    type = type.toLowerCase();
    // if options has type_error defined use that, otherwise use default
    if (this.asi.tokens.active || token_id) {
      let type_error;
      if (token_id) {
        type_error = this.asi.tokens.get_prop(token_id, 'type_error');
      } else {
        type_error = this.asi.tokens.get_active_prop('type_error');
      }
      if (isset(type_error)) {
        return type_error;
      }
    }

    flag = flag || '';
    if (type.includes(':')) {
      let typesplit = type.split(':');
      type = typesplit[0];
      flag = typesplit[1];
    }

    let typeconf = this.types[type];
    if (typeconf && typeconf.get_error) {
      return typeconf.get_error(flag.toLowerCase());
    }
    return 'invalid';
  }

  types = {
    'datetime': {
      label: 'datetime',
      placeholder: 'MMM dd YYYY hh:mm aa',
      /* matches using the date regex then the time regex below with space(s) between */
      validate(full, _flag?: string) {
        return /^((Sun|Mon|Tue|Wed|Thu|Fri|Sat)\s+)?(Jan(uary)?|Feb(ruary)?|Mar(ch)?|Apr(il)?|May|June?|July?|Aug(ust)?|Sep(tember|t)?|Oct(ober)?|Nov(ember)?|Dec(ember)?)\s+\d{0,2}\s+\d{4}((\s+(0?[1-9]|1[0-9]|2[0-3])):[0-5][0-9](:[0-5][0-9])?(\s+(am|pm))?)?$/i.test(full);
      },
    },
    'date': {
      label: 'date',
      placeholder: 'MMM dd YYYY',
      /* Match dates as "(Sun )Jan 01 (20)17" - parts in parentheses are optional
      Don't allow "00/00/0000" format to prevent confusion between US/Europe */
      validate(full, _flag?: string) {
        return /^((Sun|Mon|Tue|Wed|Thu|Fri|Sat)\s+)?(Jan(uary)?|Feb(ruary)?|Mar(ch)?|Apr(il)?|May|June?|July?|Aug(ust)?|Sep(tember|t)?|Oct(ober)?|Nov(ember)?|Dec(ember)?)\s+\d{0,2}\s+\d{4}$/i.test(full);
      },
    },
    'time': {
      label: 'time',
      placeholder: 'hh:mm aa',
      /* Matches times as "10:10(:10)( [am|pm])"
      Leading zero optional for hour only */
      validate(full, _flag?: string) {
        return /^(0?[1-9]|1[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?(\s+(am|pm))?$/i.test(full)
      },
    },
    'number': {
      label: 'number',
      checkch(c, pos, beforetext, flag) {
        switch (flag) {
          case 'int':
          case 'integer':
            return (c >= '0' && c <= '9') ||
              (c == '-' && pos == 0 && (beforetext.length == 0 || beforetext[0] != '-'));
          case 'natural':
            return (c >= '1' && c <= '9');
          case 'whole':
            return (c >= '0' && c <= '9');
          case 'binary':
            return c == '0' || c == '1';
          case 'posdecimal':
          case 'posreal':
            return (c >= '0' && c <= '9') || (c == '.' && beforetext.includes('.'));
          case 'decimal':
          case 'real':
          default:
            return (c >= '0' && c <= '9') || (c == '.' && beforetext.includes('.')) ||
              (c == '-' && pos == 0 && (beforetext.length == 0 || beforetext[0] != '-'));
        }
      },
      validate(full, flag) {
        switch (flag) {
          case 'int':
          case 'integer':
            return /^-?\d*$/.test(full);
          case 'posint':
          case 'posinteger':
            return /^\d*$/.test(full);
          case 'negint':
          case 'neginteger':
            return /^-\d*$/.test(full);
          case 'natural':
            return !/^0+$/.test(full) && /^\d+$/.test(full);
          case 'whole':
            return /^\d+$/.test(full);
          case 'binary':
            return /^([01])*$/.test(full)
          case 'posdecimal':
          case 'posreal':
            return /^\d*\.?\d*$/.test(full);
          case 'negdecimal':
          case 'negreal':
            return /^-\d*\.?\d*$/.test(full);
          case 'decimal':
          case 'real':
          default:
            return /^-?\d*\.?\d*$/.test(full);
        }
      },
      get_error(flag) {
        switch (flag) {
          case 'int':
          case 'integer':
            return 'must be an integer!';
          case 'posint':
          case 'posinteger':
            return 'must be a positive integer!';
          case 'negint':
          case 'neginteger':
            return 'must be a negative integer!';
          case 'natural':
            return 'must be a natural number!';
          case 'whole':
            return 'must be a whole number!';
          case 'binary':
            return 'must be a binary number!';
          case 'posdecimal':
          case 'posreal':
            return 'must be a positive number!';
          case 'negdecimal':
          case 'negreal':
            return 'must be a negative number!';
          case 'decimal':
          case 'real':
          default:
            return 'must be a number!';
        }
      }
    }
  }
}