import { MwTemplateNode, MwParamNode, MwNode, MwComment, MwTextNode } from '../mwTypes';
import { MwParseModule } from '../mwParseModule';
import { MW_VARIABLES } from '../mwContants';
import { escapeRegExp } from '../../util/stringUtil';
import { mwSimpleTextParse } from '../mwParse';

export function MW_VARIABLES_REGEX(prepend: string = '', append: string = ''): string {
  return Array.from(MW_VARIABLES).map(scheme => prepend + escapeRegExp(scheme) + append).join('|');
}

/**
 * Parser module that handles:
 *   - Templates (e.g. `{{MyTemplate}}` or `{{MyTemplate|myParam}}`)
 *   - Variables (e.g. `{{CURRENTYEAR}}`, `{{PAGENAME}}`, `{{DISPLAYTITLE:My Title}}`)
 *   - Parser functions (e.g. `{{localurl:page name}}` or `{{#if:condition|then|else}}`)
 *   - Template parameters (e.g. `{{{myParam}}}` or `{{{myParam|value if empty}}}`)
 */
export class MwParseTemplateModule extends MwParseModule {
  templateNode: MwTemplateNode = null;

  // Template start regex - does not determine when template ends
  // First group - either "{{" or "{{{"
  // Second group - template/variable name
  // Third group - name end, either "|" (param start), ":" (parser function),"}}" (template end), or "<" (html comment)
  private templateStartRegex = /^({{{?)(.*?)(\||:|}}}?|<)/s;

  offer(ch: string): boolean {
    const ctx = this.ctx;

    if (!this.templateNode && this.templateStartRegex.test(ctx.iter.peek())) {
      const regexRes = this.templateStartRegex.exec(ctx.iter.peek());
      const fullMatch = regexRes[0];
      const isParam = regexRes[1].length === 3;
      const name = regexRes[2];
      const nameEnd = regexRes[3];

      const templateNode = new MwTemplateNode(name);
      if (nameEnd === ':' || name.includes('#')) {
        templateNode.type = 'ParserFunction';
      } else if (MW_VARIABLES.has(name)) {
        templateNode.type = 'Variable';
      } else if (isParam) {
        templateNode.type = 'TemplateParam';
      } else {
        templateNode.type = 'Template';
      }

      if (nameEnd.includes('}')) {
        ctx.addNode(templateNode);
        ctx.iter.skip(fullMatch.length);
      } else {
        this.templateNode = templateNode;
        ctx.enter(templateNode, this);
        ctx.iter.skip(fullMatch.length - nameEnd.length);
      }
      return true;
    }

    // Detect ending: if not template param then two closing curly braces '}}'
    if (this.templateNode && this.templateNode.type !== 'TemplateParam' && this.ctx.iter.peek(2) === '}}') {
      postProcessTemplateNode(this.templateNode);
      this.exit();
      ctx.iter.skip('}}');
      this.templateNode = null;
      return true;
    }

    // Detect ending: if template param then three closing curly braces '}}}'
    if (this.templateNode && this.templateNode.type === 'TemplateParam' && this.ctx.iter.peek(3) === '}}}') {
      postProcessTemplateNode(this.templateNode);
      this.exit();
      ctx.iter.skip('}}}');
      this.templateNode = null;
      return true;
    }

    return false;
  }

}

export function postProcessTemplateNode(parent: MwTemplateNode) {
  let newParts: MwNode[] = [];
  for (let param of parent.parts) {
    if (param instanceof MwParamNode) {
      newParts.push(param);

      const tmp: MwNode[] = [];
      while (param.parts.length && param.parts[param.parts.length - 1] instanceof MwComment) {
        const comment: MwComment = <MwComment> param.parts.pop();
        if (param.afterValueWhitespace.content.length) {
          tmp.unshift(... mwSimpleTextParse(param.afterValueWhitespace.content));
          param.afterValueWhitespace = new MwTextNode('');
        }
        tmp.unshift(comment);
        param._evaluateAfterValueWhitespace();
      }
      newParts.push(... tmp);
    } else {
      newParts.push(param);
    }
  }
  parent.parts = newParts;
}
