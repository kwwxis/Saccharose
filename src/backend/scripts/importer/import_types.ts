export type SchemaTable = {
  name: string,
  columns: SchemaColumn[],
  jsonFile: string,
  customRowResolve?: (row: any, allRows?: any[]) => any[],
  normalizeFixFields?: {[oldName: string]: string},
  singularize?: string[],
};
export type SchemaColumnType = 'string'|'integer'|'bigInteger'|'boolean'|'text'|'float'|'double'|'decimal'|'json'|'jsonb'|'uuid';
export type SchemaColumn = {
  name: string,
  type: SchemaColumnType,
  resolve?: string|Function,
  isIndex?: boolean,
  isPrimary?: boolean,
  defaultValue?: any,
};
export const SEP = '------------------------------------------------------------------------------------------';