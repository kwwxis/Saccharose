import { json_stringify } from './stringify.js';
import { json_parse } from './parse.js';

export interface JSONBigIntOptions {
  /**
   * @default false
   */
  strict?: boolean | undefined;
  /**
   * @default false
   */
  storeAsString?: boolean | undefined;
  /**
   * @default false
   */
  objectProto?: boolean | undefined;
  /**
   * @default false
   */
  alwaysParseAsBig?: boolean | undefined;
  /**
   * @default false
   */
  useNativeBigInt?: boolean | undefined;
  /**
   * @default 'error'
   */
  protoAction?: "error" | "ignore" | "preserve" | undefined;
  /**
   * @default 'error'
   */
  constructorAction?: "error" | "ignore" | "preserve" | undefined;
}

export type JSONBigInt = {
  parse: typeof JSON.parse,
  stringify: typeof JSON.stringify
};

export default function(options: JSONBigIntOptions): JSONBigInt {
  return {
    parse: json_parse(options),
    stringify: json_stringify,
  };
};
export const parse = json_parse();
export const stringify = json_stringify;
