import objectPath from 'object-path';
export type SchemaTable = {name: string, columns: SchemaColumn[], skip: boolean, useKeys: boolean, noIncludeJson: boolean, jsonFile: string};
export type SchemaColumnType = 'string'|'integer'|'bigInteger'|'boolean'|'text'|'float'|'double'|'decimal'|'json'|'jsonb'|'uuid';
export type SchemaColumn = {name: string, type: SchemaColumnType, resolve?: objectPath.Path|Function, isIndex?: boolean, isPrimary?: boolean};
export const SEP = '------------------------------------------------------------------------------------------';