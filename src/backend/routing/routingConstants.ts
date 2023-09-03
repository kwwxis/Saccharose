import { dragHandle, icon, printHumanTiming, printTimestamp, genshinSpriteTagIconize, toParam } from './viewUtilities';
import { ternary, toBoolean } from '../../shared/util/genericUtil';
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
  pluralize: (s: string) => typeof s === 'string' ? pluralize(s) : s,
};