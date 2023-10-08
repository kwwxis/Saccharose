import { dragHandle, icon, printHumanTiming, printTimestamp, genshinSpriteTagIconize, toParam } from './viewUtilities';
import { safeStringify, ternary, toBoolean } from '../../shared/util/genericUtil';
import {
  camelCaseToTitleCase,
  escapeHtml,
  escapeHtmlAllowEntities,
  removePrefix,
  removeSuffix,
  replacePrefix,
  replaceSuffix,
  sentenceJoin,
  snakeToTitleCase,
  snakeToUpperCamelCase,
  splitCamelcase,
  titleCase,
  toLower,
  toUpper,
  ucFirst,
} from '../../shared/util/stringUtil';
import pluralize from 'pluralize';
import { toInt } from '../../shared/util/numberUtil';
import { Marker } from '../../shared/util/highlightMarker';

// noinspection JSUnusedGlobalSymbols
export const DEFAULT_GLOBAL_LOCALS = {
  // Environment
  // ~~~~~~~~~~~
  env: process.env,

  // Type Converters
  // ~~~~~~~~~~~~~~~
  toBoolean: toBoolean,
  toInt: toInt,
  toParam: toParam,

  // Icons
  // ~~~~~
  icon,
  dragHandle,

  // Date/Time
  // ~~~~~~~~~
  printTimestamp,
  printHumanTiming,

  // General Utilities
  // ~~~~~~~~~~~~~~~~~
  ternary,
  escapeHtml,
  escapeHtmlAllowEntities,
  Marker: Marker,

  genshinSpriteTagIconize,

  // String Utilities
  // ~~~~~~~~~~~~~~~~
  ucFirst,
  toLower,
  toUpper,
  removePrefix,
  removeSuffix,
  replacePrefix,
  replaceSuffix,
  sentenceJoin,
  titleCase,
  camelCaseToTitleCase,
  snakeToTitleCase,
  snakeToUpperCamelCase,
  splitCamelcase,
  safeStringify,
  pluralize: (s: string) => {
    if (typeof s === 'string') {
      if (s.endsWith(')')) {
        return s.replace(/^(.*?)( \(.*?\))$/, (_fm: string, g1: string, g2: string) => {
          return pluralize(g1) + g2;
        })
      } else {
        return pluralize(s);
      }
    } else {
      return s;
    }
  },
};