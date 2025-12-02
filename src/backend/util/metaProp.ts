import { isEmpty, isNotEmpty } from '../../shared/util/genericUtil.ts';

export class MetaPropValue {
  value: string;
  link?: string;
  tooltip?: string;
  bold?: boolean;

  constructor(value: string | number, link?: string, tooltip?: string, bold?: boolean) {
    this.value = typeof value === 'number' ? String(value) : value;
    this.link = link;
    this.tooltip = tooltip;
    this.bold = bold;
  }
}

export type IMetaPropValue = {value: string|number, tooltip?: string, link?: string, bold?: boolean};

export type MetaPropAcceptValue =
  string | number | MetaPropValue | IMetaPropValue |
  (string | number | MetaPropValue | IMetaPropValue)[];

export class MetaProp {
  label: string;
  values: MetaPropValue[] = [];

  constructor(label: string, values?: MetaPropAcceptValue, link?: string) {
    this.label = label;
    if (values) {
      this.addValues(values, link);
    }
  }

  getValue(idx: number) {
    return this.values[idx];
  }

  addValues(values: MetaPropAcceptValue, link?: string): this {
    const getLink = (v: string|number, overrideLink?: string) => {
      if (!overrideLink) {
        overrideLink = link;
      }
      return overrideLink ? overrideLink.replace('{}', typeof v === 'number' ? String(v) : v) : overrideLink;
    }

    const single = (v: string | number | MetaPropValue | {value: string|number, tooltip?: string, link?: string, bold?: boolean}) => {
      if (isEmpty(v)) {
        return;
      }
      if (v instanceof MetaPropValue) {
        this.values.push(v);
      } else if (typeof v === 'string' || typeof v === 'number') {
        this.values.push(new MetaPropValue(v, getLink(v)));
      } else if (typeof v === 'object' && !Array.isArray(v)) {
        if (isNotEmpty(v.value)) {
          this.values.push(new MetaPropValue(v.value, getLink(v.value, v.link), v.tooltip, v.bold));
        }
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

export class MetaPropsHelper {

  constructor(readonly props: MetaProp[]) {}

  addEmptyProp(label: string) {
    this.props.push(new MetaProp(label, null));
  }

  getProp(label: string): MetaProp {
    return this.props.find(item => item.label === label);
  }

  getOrCreateProp(label: string): MetaProp {
    let existingProp = this.props.find(item => item.label === label);
    if (existingProp) {
      return existingProp;
    } else {
      let newProp = new MetaProp(label);
      this.props.push(newProp);
      return newProp;
    }
  }

  addProp(label: string, values: MetaPropAcceptValue, link?: string) {
    if (!values || (Array.isArray(values) && !values.length)) {
      return;
    }
    let newProp = new MetaProp(label, values, link);
    this.props.push(newProp);
    return newProp;
  }

  hasProp(label: string) {
    return this.props.some(x => x.label === label);
  }

  static of(props: MetaProp[]): MetaPropsHelper {
    return new MetaPropsHelper(props);
  }

}
