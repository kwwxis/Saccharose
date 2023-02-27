import { Request } from './router';
import { resolveObjectPath } from '../../shared/util/arrayUtil';
import { isLangCode, LangCode } from '../../shared/types/dialogue-types';
import { getTextMapItem } from '../scripts/textmap';
import { isset, toBoolean } from '../../shared/util/genericUtil';
import { mwParse } from '../../shared/mediawiki/mwParse';
import { MwParentNode, MwTemplateNode, MwWhiteSpace } from '../../shared/mediawiki/mwTypes';
import { isNumeric, toNumber } from '../../shared/util/numberUtil';
import { splitArgs } from '../../shared/util/stringUtil';
import JSON5 from 'json5';

export type FileFormatOption = 'default' | 'remove' | 'custom';

export function fileFormatOptionsCheck(templateStr: string) {
  return templateStr.split(/\n/g).map(s => {
    if (/^(\s*)\|(.*?)=(\s*)null(\s*)$/.test(s)) {
      return null;
    } else {
      return s;
    }
  }).filter(s => isset(s)).join('\n').trim();
}

export function evaluateCustomFormat(obj: Object, parentNode: MwParentNode): string {
  let out = '';
  for (let node of parentNode.parts) {
    if (node instanceof MwTemplateNode) {
      if (node.templateName.toLowerCase() === 'if' || node.templateName.toLowerCase() === 'ifcase') {
        const caseSensitive = node.templateName.toLowerCase() === 'ifcase';
        const cond = node.getParam(1) || node.getParam('cond');

        const thenParam = node.getParam(2) || node.getParam('then');
        const elseParam = node.getParam(3) || node.getParam('else');

        if (!cond) {
          out += node.toString();
          continue;
        }

        if (thenParam) {
          thenParam.parts.unshift(thenParam.beforeValueWhitespace);
          const tmp = node.parts[node.parts.indexOf(thenParam) + 1];
          if (tmp instanceof MwWhiteSpace) {
            thenParam.parts.push(tmp);
          }
        }
        if (elseParam) {
          elseParam.parts.unshift(elseParam.beforeValueWhitespace);
          const tmp = node.parts[node.parts.indexOf(elseParam) + 1];
          if (tmp instanceof MwWhiteSpace) {
            elseParam.parts.push(tmp);
          }
        }

        const condOpRegex = /^(:={1,3}|<=?|>=?|!={1,2}|~|\*=|\^=|\$=)$/;

        let condParts = splitArgs(cond.value);
        let condOpIndex: number = condParts.findIndex(part => condOpRegex.test(part));

        if (condParts.length < 3 || condOpIndex <= 0 || condOpIndex >= condParts.length - 1) {
          out += node.toString();
        } else {
          let condOp: string = condParts.find(part => condOpRegex.test(part));
          let leftParam: string|number|boolean = condParts.slice(0, condOpIndex).join(' ').trim();
          let rightParam: string|number|boolean = condParts.slice(condOpIndex + 1).join(' ').trim();

          if (typeof leftParam === 'string' && /^(['"]).*\1$/.test(leftParam)) {
            try {
              leftParam = JSON5.parse(leftParam);
            } catch (ignore) {}
          } else if (typeof leftParam === 'string') {
            let resolveValue = resolveObjectPath(obj, /^\{.*}$/.test(leftParam) ? leftParam.slice(1,-1) : leftParam);
            if (resolveValue) {
              leftParam = resolveValue;
            }
          }
          if (typeof rightParam === 'string' && /^(['"]).*\1$/.test(rightParam)) {
            try {
              rightParam = JSON5.parse(rightParam);
            } catch (ignore) {}
          } else if (typeof rightParam === 'string') {
            let resolveValue = resolveObjectPath(obj, /^\{.*}$/.test(rightParam) ? rightParam.slice(1,-1) : rightParam);
            if (resolveValue) {
              rightParam = resolveValue;
            }
          }

          if (typeof leftParam === 'string' && /^(true|false)$/.test(leftParam))
            leftParam = toBoolean(leftParam)
          if (typeof rightParam === 'string' && /^(true|false)$/.test(rightParam))
            rightParam = toBoolean(rightParam)

          if (typeof leftParam === 'string' && isNumeric(leftParam))
            leftParam = toNumber(leftParam);
          if (typeof rightParam === 'string' && isNumeric(rightParam))
            rightParam = toNumber(rightParam);

          let condResult: boolean = false;

          switch (condOp) {
            case ':=':
              condResult = leftParam === rightParam;
              break;
            case '!=':
            case '!==':
              condResult = leftParam !== rightParam;
              break;
            case '<=':
              condResult = leftParam <= rightParam;
              break;
            case '>=':
              condResult = leftParam >= rightParam;
              break;
            case '<':
              condResult = leftParam < rightParam;
              break;
            case '>':
              condResult = leftParam > rightParam;
              break;
            case '*=':
              if (caseSensitive) {
                condResult = String(leftParam).includes(String(rightParam));
              } else {
                condResult = String(leftParam).toLowerCase().includes(String(rightParam).toLowerCase());
              }
              break;
            case '^=':
              if (caseSensitive) {
                condResult = String(leftParam).startsWith(String(rightParam));
              } else {
                condResult = String(leftParam).toLowerCase().startsWith(String(rightParam).toLowerCase());
              }
              break;
            case '$=':
              if (caseSensitive) {
                condResult = String(leftParam).endsWith(String(rightParam));
              } else {
                condResult = String(leftParam).toLowerCase().endsWith(String(rightParam).toLowerCase());
              }
              break;
            case '~':
              if (caseSensitive) {
                condResult = new RegExp(String(rightParam)).test(String(leftParam));
              } else {
                condResult = new RegExp(String(rightParam), 'i').test(String(leftParam));
              }
              break;
          }
          if (condResult) {
            out += !thenParam ? '' : evaluateCustomFormat(obj, thenParam);
          } else {
            out += !elseParam ? '' : evaluateCustomFormat(obj, elseParam);
          }
        }
      } else {
        out += node.toString();
      }
    } else {
      out += node.toString();
    }
  }
  return out;
}

export function fileFormatOptionsApply(req: Request, obj: Object, cookieName: string, defaultFormat: string): string {
  let pref: FileFormatOption = req.cookies[cookieName] || 'default';
  let customFormat: string;
  if (pref === 'remove') {
    return null;
  } else if (pref === 'custom') {
    customFormat = req.cookies[cookieName + '.CustomFormat'] || '';
  } else {
    customFormat = defaultFormat;
  }

  const parsed = mwParse(customFormat);
  const evaluatedFormat = evaluateCustomFormat(obj, parsed);

  return evaluatedFormat.replaceAll(/\{([^}]*?)}/g, (fm: string, g1: string) => {
    const possibleLangCode: string = g1.includes('.') ? g1.split('.').pop() : null;
    if (isLangCode(possibleLangCode)) {
      const textMapHashParamName = g1.split('.').slice(0, -1).join('.') + 'MapHash';
      const langCode: LangCode = possibleLangCode as LangCode;
      let value = resolveObjectPath(obj, textMapHashParamName);
      if (value) {
        return getTextMapItem(langCode, value)
      } else {
        return fm;
      }
    }

    let value = resolveObjectPath(obj, g1);
    if (value) {
      return value;
    } else {
      return fm;
    }
  });
}