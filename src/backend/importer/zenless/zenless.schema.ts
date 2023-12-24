import { plainLineMapSchema, textMapSchema } from '../import_db.ts';
const hashType = 'text';

export const zenlessSchema = {

  TextMapCHS: textMapSchema('CHS', hashType),
  TextMapCHT: textMapSchema('CHT', hashType),
  TextMapDE: textMapSchema('DE', hashType),
  TextMapEN: textMapSchema('EN', hashType),
  TextMapES: textMapSchema('ES', hashType),
  TextMapFR: textMapSchema('FR', hashType),
  TextMapID: textMapSchema('ID', hashType),
  TextMapJP: textMapSchema('JP', hashType),
  TextMapKR: textMapSchema('KR', hashType),
  TextMapPT: textMapSchema('PT', hashType),
  TextMapRU: textMapSchema('RU', hashType),
  TextMapTH: textMapSchema('TH', hashType),
  TextMapVI: textMapSchema('VI', hashType),

  PlainLineMapCHS: plainLineMapSchema('CHS', hashType),
  PlainLineMapCHT: plainLineMapSchema('CHT', hashType),
  PlainLineMapDE: plainLineMapSchema('DE', hashType),
  PlainLineMapEN: plainLineMapSchema('EN', hashType),
  PlainLineMapES: plainLineMapSchema('ES', hashType),
  PlainLineMapFR: plainLineMapSchema('FR', hashType),
  PlainLineMapID: plainLineMapSchema('ID', hashType),
  PlainLineMapJP: plainLineMapSchema('JP', hashType),
  PlainLineMapKR: plainLineMapSchema('KR', hashType),
  PlainLineMapPT: plainLineMapSchema('PT', hashType),
  PlainLineMapRU: plainLineMapSchema('RU', hashType),
  PlainLineMapTH: plainLineMapSchema('TH', hashType),
  PlainLineMapVI: plainLineMapSchema('VI', hashType),
}