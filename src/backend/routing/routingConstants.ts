import {  icon, genshinSpriteTagIconize } from './viewUtilities.ts';
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
import { toInt } from '../../shared/util/numberUtil.ts';
import { Marker } from '../../shared/util/highlightMarker.ts';
import { arraySum } from '../../shared/util/arrayUtil.ts';
import { parseCommonLineIds, stringifyCommonLineIds } from '../../shared/types/common-types.ts';
import { uuidv4 } from '../../shared/util/uuidv4.ts';
import { SITE_TITLE, SITE_SHORT_TITLE } from '../loadenv.ts';

// noinspection JSUnusedGlobalSymbols
export const DEFAULT_GLOBAL_LOCALS = {
  // Environment
  // ~~~~~~~~~~~
  env: process.env,
  SITE_TITLE,
  SITE_SHORT_TITLE,

  // Type Converters
  // ~~~~~~~~~~~~~~~
  toBoolean: toBoolean,
  toInt: toInt,
  toParam: toParam,

  // Icons
  // ~~~~~
  icon,

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
  encodeURIComponent
};
