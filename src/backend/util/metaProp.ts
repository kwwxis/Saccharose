import { isEmpty } from '../../shared/util/genericUtil';

export class MetaPropValue {
  value: string;
  link?: string;
  tooltip?: string;

  constructor(value: string | number, link?: string, tooltip?: string) {
    this.value = typeof value === 'number' ? String(value) : value;
    this.link = link;
    this.tooltip = tooltip;
  }
}

export type MetaPropAcceptValue =
  string | number | MetaPropValue | {value: string|number, tooltip?: string, link?: string} |

  (string | number | MetaPropValue | {value: string|number, tooltip?: string, link?: string})[];

export class MetaProp {
  label: string;
  values: MetaPropValue[] = [];

  constructor(label: string, values?: MetaPropAcceptValue, link?: string) {
    this.label = label;
    if (values) {
      this.addValues(values, link);
    }
  }

  addValues(values: MetaPropAcceptValue, link?: string): this {
    const getLink = (v: string|number, overrideLink?: string) => {
      if (!overrideLink) {
        overrideLink = link;
      }
      return overrideLink ? overrideLink.replace('{}', typeof v === 'number' ? String(v) : v) : overrideLink;
    }

    const single = (v: string | number | MetaPropValue | {value: string|number, tooltip?: string, link?: string}) => {
      if (isEmpty(v)) {
        return;
      }
      if (v instanceof MetaPropValue) {
        this.values.push(v);
      } else if (typeof v === 'string' || typeof v === 'number') {
        this.values.push(new MetaPropValue(v, getLink(v)));
      } else if (typeof v === 'object' && !Array.isArray(v)) {
        this.values.push(new MetaPropValue(v.value, getLink(v.value, v.link), v.tooltip));
      }
    }

    if (Array.isArray(values)) {
      for (let v of values) {
        single(v);
      }
    } else if (typeof values !== 'undefined' && values !== null) {
      single(values);
    }
    return this;
  }
}