import JSONBigImport, { JSONBigInt } from './json-bigint';

export const JSONbig: JSONBigInt = JSONBigImport({ useNativeBigInt: true, objectProto: true });

export function parseJsonConvertingBigIntsToStrings(rawJsonString: string) {
  let json = JSONbig.parse(rawJsonString);

  // Stringify and parse again to convert bigints to string via replacer
  return JSON.parse(JSON.stringify(
    json,
    (_, v) => typeof v === 'bigint' ? v.toString() : v
  ));
}
