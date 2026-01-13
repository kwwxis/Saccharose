export function expressWildcardPath(value: any): string {
  if (!value) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(x => expressWildcardPath(x)).join('/');
  }
  return String(value);
}
