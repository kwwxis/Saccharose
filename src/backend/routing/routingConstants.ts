import { dragHandle, icon, printHumanTiming, printTimestamp, genshinSpriteTagIconize } from './viewUtilities.ts';
import { safeStringify, ternary, toBoolean } from '../../shared/util/genericUtil.ts';
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
  toLower, toParam,
  toUpper,
  ucFirst,
} from '../../shared/util/stringUtil.ts';
import pluralize from 'pluralize';
import { toInt } from '../../shared/util/numberUtil.ts';
import { Marker } from '../../shared/util/highlightMarker.ts';
import { arraySum } from '../../shared/util/arrayUtil.ts';
import { parseCommonLineIds, stringifyCommonLineIds } from '../../shared/types/common-types.ts';
import { uuidv4 } from '../../shared/util/uuidv4.ts';

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

  // Genshin-Specific Utilities
  // ~~~~~~~~~~~~~~~~~~~~~~~~~~
  genshinSpriteTagIconize,
  stringifyCommonLineIds,
  parseCommonLineIds,

  // Array Utilities
  // ~~~~~~~~~~~~~~~
  arraySum,

  // String Utilities
  // ~~~~~~~~~~~~~~~~
  uuidv4,
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
