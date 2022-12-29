export class MetaPropValue {
  value: string;
  link?: string;

  constructor(value: string, link?: string) {
    this.value = value;
    this.link = link;
  }
}

export class MetaProp {
  label: string;
  values: MetaPropValue[] = [];

  constructor(label: string, values: string | number | string[] | (string|number)[] | number[] | MetaPropValue[], link?: string) {
    this.label = label;

    if (typeof values === 'string' || typeof values === 'number') {
      this.values.push(new MetaPropValue(String(values), link ? link.replace('{}', String(values)) : link));
    } else if (Array.isArray(values) && values.length > 0) {
      if (typeof values[0] === 'string' || typeof values[0] === 'number') {
        for (let value of values) {
          this.values.push(new MetaPropValue(String(value), link ? link.replace('{}', String(value)) : link));
        }
      } else if (values[0] instanceof MetaPropValue) {
        this.values.push(...(values as MetaPropValue[]));
      }
    }
  }
}