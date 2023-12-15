import { splitLimit } from '../../shared/util/stringUtil';
import { CSSProperties } from 'react';

export function styles(
  styles: string
): CSSProperties {
  return styles.split(';').map(s => s.trim()).filter(x => !!x).reduce((obj: CSSProperties, rule) => {
    let [prop, value] = splitLimit(rule, ':', 2);

    prop = prop.trim().replace(/-./g, x => x.toUpperCase()[1]);
    value = value.trim();

    obj[prop] = value;

    return obj;
  }, {});
}