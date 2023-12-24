// noinspection JSUnusedGlobalSymbols,JSUnusedLocalSymbols,TypeScriptValidateJSTypes,JSFunctionExpressionToArrowFunction,ES6ShorthandObjectProperty

import * as ace from 'brace';
import { MW_BEHAVIOR_SWITCHES_REGEX } from '../../../../shared/mediawiki/parseModules/mwParse.specialText.ts';
import { MW_URL_SCHEME_REGEX } from '../../../../shared/mediawiki/parseModules/mwParse.link.ts';
import { getQuotePosMap, getQuoteTypes } from '../../../../shared/mediawiki/mwQuotes.ts';
import { MW_VARIABLES_REGEX } from '../../../../shared/mediawiki/parseModules/mwParse.template.ts';
import { filterInPlace } from '../../../../shared/util/arrayUtil.ts';
import { quotifyWikitextTokens } from './aceWikitextQuotify.ts';
// <any> cast because brace doesn't expose the 'define' method in its types.
// In fact, most of the acequire() internal stuff don't seem to have any available types in brace.
(<any> ace).define('ace/mode/wikitext_highlight_rules', ['require', 'exports', 'module', 'ace/lib/oop', 'ace/lib/lang', 'ace/mode/text_highlight_rules', 'ace/mode/javascript_highlight_rules', 'ace/mode/xml_highlight_rules', 'ace/mode/html_highlight_rules', 'ace/mode/css_highlight_rules'], function(acequire, exports, module) {
  'use strict';

  let oop = acequire('../lib/oop');
  //let lang = acequire('../lib/lang');
  let TextHighlightRules = acequire('./text_highlight_rules').TextHighlightRules;
  //let JavaScriptHighlightRules = acequire('./javascript_highlight_rules').JavaScriptHighlightRules;
  //let XmlHighlightRules = acequire('./xml_highlight_rules').XmlHighlightRules;
  let HtmlHighlightRules = acequire('./html_highlight_rules').HtmlHighlightRules;
  //let CssHighlightRules = acequire('./css_highlight_rules').CssHighlightRules;

  let WikitextHighlightRules: any = function() {
    // regexp must not have capturing parentheses. Use (?:) instead.
    // regexps are ordered -> the first match is used

    HtmlHighlightRules.call(this);

    this.$rules['start'].unshift(
      {
        regex: new RegExp(`(?:${MW_BEHAVIOR_SWITCHES_REGEX()})`),
        token: 'wikitext.behavior-switch'
      },
      {
        token: function(value) {
          return 'wikitext.header.header-open.' + value.length;
        },
        regex: /^(={1,6})(?=.*?\1\s*$)/,
        next: 'wt_header',
        onMatch: function(_val: string, _currentState: string, stack: string[]) {
          stack.unshift('wt_header');
          return 'wikitext.header.header-open';
        }
      },
      {
        token: 'wikitext.magic-variable.magic-variable-open',
        regex: new RegExp(`{{(?=\s*(?:${MW_VARIABLES_REGEX()}))`),
        next: 'wt_magic_variable',
        onMatch: function(_val: string, _currentState: string, stack: string[]) {
          stack.unshift('wt_magic_variable');
          return 'wikitext.magic-variable.magic-variable-open.magic-variable-color';
        }
      },
      {
        token: 'wikitext.variable.variable-open',
        regex: /{{{/,
        next: 'wt_variable',
        onMatch: function(_val: string, _currentState: string, stack: string[]) {
          stack.unshift('wt_variable');
          return 'wikitext.variable.variable-open.variable-color';
        }
      },
      {
        token: 'wikitext.parserFn.parserFn-open',
        regex: /{{(?=\s*#)/,
        next: 'wt_parserFn',
        onMatch: function(_val: string, _currentState: string, stack: string[]) {
          stack.unshift('wt_parserFn');
          return 'wikitext.parserFn.parserFn-open.parserFn-color';
        }
      },
      {
        token: 'wikitext.template.template-open',
        regex: /{{/,
        next: 'wt_template',
        onMatch: function(_val: string, _currentState: string, stack: string[]) {
          stack.unshift('wt_template');
          return 'wikitext.template.template-open.template-color';
        }
      },
      {
        token: 'wikitext.link.link-open',
        regex: new RegExp(`\\[\\[(?!${MW_URL_SCHEME_REGEX()})`),
        next: 'wt_link',
        onMatch: function(_val: string, _currentState: string, stack: string[]) {
          stack.unshift('wt_link');
          return 'wikitext.link.link-open.link-color';
        }
      },
      {
        token: 'wikitext.external-link.external-link-open',
        regex: new RegExp(`\\[(?=(?:${MW_URL_SCHEME_REGEX()})[^ |]*?(?: |]|$))`),
        next: 'wt_external_link',
        onMatch: function(_val: string, _currentState: string, stack: string[]) {
          stack.unshift('wt_external_link');
          return 'wikitext.external-link.external-link-open.external-link-color';
        }
      },
      {
        token: 'wikitext.bare-link.bare-link-color',
        regex: new RegExp(`(?<=\\b)(?:${MW_URL_SCHEME_REGEX()})[^\\s\\b]*`),
      },
      {
        token: 'wikitext.magic-link.magic-link-color',
        regex: new RegExp(`(?<=\\b)(?:ISBN|PMID|RFC)\\s+[\\d-]+(?=\\b)`),
      },
      {
        token: 'wikitext.table.table-open.table-color',
        regex: /(?<=^\s*)\{\|.*$/,
        onMatch: function(_val: string, _currentState: string, stack: string[]) {
          stack.unshift('wt_table');
          return 'wikitext.table.table-open.table-color';
        }
      },
      {
        token: 'wikitext.nowiki.nowiki-open',
        regex: /<nowiki[^>]*>/,
        next: 'wt_nowiki',
        onMatch: function(_val: string, _currentState: string, stack: string[]) {
          stack.unshift('wt_nowiki');
          return 'wikitext.nowiki.nowiki-open';
        }
      },
      {
        token: 'wikitext.pre.pre-open',
        regex: /<pre[^>]*>/,
        next: 'wt_pre',
        onMatch: function(_val: string, _currentState: string, stack: string[]) {
          stack.unshift('wt_pre');
          return 'wikitext.pre.pre-open';
        }
      },
      {
        token: 'comment.start.xml',
        regex: /<!--/,
        next: 'wt_comment',
        onMatch: function(_val: string, _currentState: string, stack: string[]) {
          stack.unshift('wt_comment');
          return 'comment.start.xml';
        }
      },
      {
        token: 'wikitext.hr',
        regex: /^-{4}-*/,
      },
      {
        token: 'wikitext.signature',
        regex: /~{3,5}/,
      },
      {
        token: 'wikitext.item-prefix',
        regex: /^[#*:]+/
      }
    );

    function stack_tokens(initialToken: string, stack: string[], exclude: string[]|string = []) {
      if (typeof exclude === 'string') {
        exclude = exclude.split('.');
      }
      let res = [ ... initialToken.split('.') ];
      for (let s of stack) {
        let include = false;
        if (s.startsWith('wt_')) {
          s = s.slice(3);
          include = true;
        }
        if (include && !res.includes(s) && !exclude.includes(s)) {
          res.push(s);
        }
      }
      if (!res.some(x => x.includes('-color'))) {
        for (let s of stack) {
          if (s === 'wt_variable') {
            res.push('variable-color');
            break;
          } else if (s === 'wt_magic_variable') {
            res.push('magic-variable-color');
            break;
          } else if (s === 'wt_template') {
            res.push('template-color');
            break;
          }
        }
      }
      return res.join('.');
    }

    this.addRules({
      wt_header: [
        {
          token: function(value: string) {
            return 'wikitext.header.header-close.' + value.length;
          },
          regex: /={1,6}\s*$/,
          next: 'start',
          onMatch: function(_value: string, _currentState: string, stack: string[]) {
            stack.shift();
            this.next = stack[0] || 'start';
            return 'wikitext.header.header-close';
          }
        },
        { include: 'start' },
        {
          defaultToken: function(_currentState: string, stack: string[]) {
            return stack_tokens('wikitext.header.header-text', stack);
          }
        }
      ],
      wt_parserFn: [
        {
          token: 'wikitext.parserFn.parserFn-close.parserFn-color',
          regex: /}}/,
          next: 'start',
          onMatch: function(_value: string, _currentState: string, stack: string[]) {
            stack.shift();
            this.next = stack[0] || 'start';
            return 'wikitext.parserFn.parserFn-close.parserFn-color';
          }
        },
        {
          token: 'wikitext.parserFn.parserFn-name.parserFn-color',
          regex: /(?<={{\s*)\S(?:[^:}]*?\S)?(?=\s*(?::|}}|$))/,
        },
        {
          token: 'wikitext.parserFn.parserFn-delimiter.parserFn-color',
          regex: /\|/,
        },
        {
          token: 'wikitext.parserFn.parserFn-named-param.parserFn-color',
          regex: /(?<=\|\s*)\S(?:[^=|}]*?\S)?(?=\s*=)/,
        },
        { include: 'start' },
        {
          defaultToken: function(_currentState: string, stack: string[]) {
            return stack_tokens('wikitext.parserFn.parserFn-text', stack, ['variable-color', 'template-color']);
          }
        }
      ],
      wt_template: [
        {
          token: 'wikitext.template.template-close.template-color',
          regex: /}}/,
          next: 'start',
          onMatch: function(_value: string, _currentState: string, stack: string[]) {
            stack.shift();
            this.next = stack[0] || 'start';
            return 'wikitext.template.template-close.template-color';
          }
        },
        {
          token: 'wikitext.template.template-name.template-color',
          regex: /(?<={{\s*)\S(?:[^:|}]*?\S)?(?=\s*(?:\||:|}}|$))/,
        },
        {
          token: 'wikitext.template.template-delimiter.template-color',
          regex: /\|/,
        },
        {
          token: 'wikitext.template.template-named-param.template-color',
          regex: /(?<=\|\s*)\S(?:[^=|}]*?\S)?(?=\s*=)/,
        },
        { include: 'start' },
        {
          token: 'wikitext.template.template-color.template-customVar',
          regex: /\{\s*[^\s{}]+\s*}/,
        },
        {
          defaultToken: function(_currentState: string, stack: string[]) {
            return stack_tokens('wikitext.template.template-text.template-color', stack, 'variable-color');
          }
        }
      ],
      wt_variable: [
        {
          token: 'wikitext.variable.variable-close.variable-color',
          regex: /}}}/,
          next: 'start',
          onMatch: function(_value: string, _currentState: string, stack: string[]) {
            stack.shift();
            this.next = stack[0] || 'start';
            return 'wikitext.variable.variable-close.variable-color';
          }
        },
        {
          token: 'wikitext.variable.variable-name.variable-color',
          regex: /(?<={{{\s*)\S(?:[^|}]*?\S)?(?=\s*(?:\||}}}|$))/,
        },
        {
          token: 'wikitext.variable.variable-delimiter.variable-color',
          regex: /\|/,
        },
        { include: 'start' },
        {
          defaultToken: function(_currentState: string, stack: string[]) {
            return stack_tokens('wikitext.variable.variable-text.variable-color', stack, 'template-color');
          }
        }
      ],
      wt_magic_variable: [
        {
          token: 'wikitext.magic-variable.magic-variable-close.magic-variable-color',
          regex: /}}/,
          next: 'start',
          onMatch: function(_value: string, _currentState: string, stack: string[]) {
            stack.shift();
            this.next = stack[0] || 'start';
            return 'wikitext.magic-variable.magic-variable-close.magic-variable-color';
          }
        },
        {
          token: 'wikitext.magic-variable.magic-variable-name.magic-variable-color',
          regex: /(?<={{\s*)\S(?:[^:|}]*?\S)?(?=\s*(?:\||:|}}|$))/,
        },
        {
          token: 'wikitext.magic-variable.magic-variable-delimiter.magic-variable-color',
          regex: /\|/,
        },
        { include: 'start' },
        {
          defaultToken: function(_currentState: string, stack: string[]) {
            return stack_tokens('wikitext.variable.variable-text.variable-color', stack, 'template-color');
          }
        }
      ],
      wt_link: [
        {
          token: 'wikitext.link.link-close.link-color',
          regex: /]]/,
          next: 'start',
          onMatch: function(_value: string, _currentState: string, stack: string[]) {
            stack.shift();
            this.next = stack[0] || 'start';
            return 'wikitext.link.link-close.link-color';
          }
        },
        {
          token: 'wikitext.link.link-name.link-text.link-color',
          regex: /(?<=\[\[).*?(?=\||]]|$)/,
        },
        {
          token: 'wikitext.link.link-delimiter.link-color',
          regex: /\|/,
        },
        { include: 'start' },
        {
          defaultToken: function(_currentState: string, stack: string[]) {
            return stack_tokens('wikitext.link.link-text', stack);
          }
        }
      ],
      wt_external_link: [
        {
          token: 'wikitext.external-link.external-link-close.link-external-color',
          regex: /]/,
          next: 'start',
          onMatch: function(_value: string, _currentState: string, stack: string[]) {
            stack.shift();
            this.next = stack[0] || 'start';
            return 'wikitext.external-link.external-link-close.external-link-color';
          }
        },
        {
          token: 'wikitext.external-link.external-link-name.external-link-text.external-link-color',
          regex: new RegExp(`(?:${MW_URL_SCHEME_REGEX()}).*?(?= |]|$)`),
        },
        { include: 'start' },
        {
          defaultToken: function(_currentState: string, stack: string[]) {
            return stack_tokens('wikitext.external-link.external-link-text', stack);
          }
        }
      ],
      wt_nowiki: [
        {
          regex: /<\/nowiki\s*>/,
          next: 'start',
          onMatch: function(_value: string, _currentState: string, stack: string[]) {
            stack.shift();
            this.next = stack[0] || 'start';
            return 'wikitext.nowiki.nowiki-close';
          }
        },
        {
          regex: /^$/,
          token: 'wikitext.nowiki.nowiki-text.nowiki-empty-line',
          allowEmptyToken: true
        },
        { defaultToken: 'wikitext.nowiki.nowiki-text' }
      ],
      wt_pre: [
        {
          regex: /<\/pre\s*>/,
          next: 'start',
          onMatch: function(_value: string, _currentState: string, stack: string[]) {
            stack.shift();
            this.next = stack[0] || 'start';
            return 'wikitext.pre.pre-close';
          }
        },
        {
          regex: /^$/,
          token: 'wikitext.pre.pre-text.pre-empty-line',
          allowEmptyToken: true
        },
        { defaultToken: 'wikitext.pre.pre-text' }
      ],
      wt_comment: [
        {
          regex: /-->/,
          next: 'start',
          onMatch: function(_value: string, _currentState: string, stack: string[]) {
            stack.shift();
            this.next = stack[0] || 'start';
            return 'comment.end.xml';
          }
        },
        { defaultToken: 'comment.xml' }
      ],
      wt_table: [
        {
          regex: /(?<=^\s*)\|}/,
          next: 'start',
          onMatch: function(_value: string, _currentState: string, stack: string[]) {
            stack.shift();
            this.next = stack[0] || 'start';
            return 'wikitext.table.table-close.table-color';
          }
        },
        {
          regex: /(?<=^\s*)\|\+/,
          token: 'wikitext.table.table-caption.table-color',
        },
        {
          regex: /(?<=^\s*)\|-/,
          token: 'wikitext.table.table-row-boundary.table-color',
        },

        {
          regex: /(?<=^\s*)\|/,
          token: 'wikitext.table.table-data-cell.table-color'
        },
        {
          regex: /(?<=^\s*\|[^\-].*)\|\|/,
          token: 'wikitext.table.table-data-cell.table-color'
        },
        {
          regex: /(?<=^\s*\|[^|]+)\|(?!\|)/,
          token: 'wikitext.table.table-data-cell.table-color'
        },

        {
          regex: /(?<=^\s*)!/,
          token: 'wikitext.table.table-header-cell.table-color'
        },
        {
          regex: /(?<=^\s*!.*)!!/,
          token: 'wikitext.table.table-header-cell.table-color'
        },
        {
          regex: /(?<=^\s*![^!|]+)\|(?!\|)/,
          token: 'wikitext.table.table-header-cell.table-color'
        },
        { include: 'start' },
        {
          defaultToken: function(_currentState: string, stack: string[]) {
            return stack_tokens('wikitext.table.table-text', stack);
          }
        }
      ]
    });

    this.normalizeRules();
  };

  WikitextHighlightRules.metaData = {
    '$schema': 'https://raw.githubusercontent.com/martinring/tmlanguage/master/tmlanguage.json',
    name: 'Wikitext',
    scopeName: 'source.wikitext',
  };

  oop.inherits(WikitextHighlightRules, TextHighlightRules);

  exports.WikitextHighlightRules = WikitextHighlightRules;
});

(<any> ace).define('ace/mode/wikitext', ['require', 'exports', 'module', 'ace/lib/oop', 'ace/lib/lang', 'ace/tokenizer', 'ace/layer/text',
  'ace/mode/text', 'ace/mode/javascript',  'ace/mode/xml', 'ace/mode/html', 'ace/mode/wikitext_highlight_rules'], function(acequire, exports, _module) {

  'use strict';

  let oop = acequire('../lib/oop');
  let TextMode = acequire('./text').Mode;
  let JavaScriptMode = acequire('./javascript').Mode;
  let XmlMode = acequire('./xml').Mode;
  let HtmlMode = acequire('./html').Mode;
  let Tokenizer = acequire("../tokenizer").Tokenizer;
  // let TextLayer = acequire('../layer/text').Text;
  // let lang = acequire('../lib/lang');

  let WikitextHighlightRules = acequire('./wikitext_highlight_rules').WikitextHighlightRules;

  let Mode = function() {
    this.HighlightRules = WikitextHighlightRules;

    this.createModeDelegates({
      'js-': JavaScriptMode,
      'xml-': XmlMode,
      'html-': HtmlMode,
    });

    //this.foldingRules = new FoldMode();
    this.$behaviour = this.$defaultBehaviour;
  };
  oop.inherits(Mode, TextMode);

  (function() {
    this.type = 'text';
    this.blockComment = { start: '<!--', end: '-->' };

    function splitNotInParens(s, del) {
      let current = '';
      let parenthesis = 0;
      let res = [];
      for (var i = 0, l = s.length; i < l; i++) {
        if (s[i] === '(') {
          parenthesis++;
          current = current + '(';
        } else if (s[i] === ')' && parenthesis > 0) {
          parenthesis--;
          current = current + ')';
        } else if (s[i] === del && parenthesis === 0) {
          res.push(current);
          current = '';
        } else {
          current = current + s[i];
        }
      }
      if (current !== '') {
        res.push(current);
      }
      return res;
    }

    this.getNextLineIndent = function(_state, _line: string, _tab) {
      return '';
    };

    this.getTokenizer = function() {
      if (!this.$tokenizer) {
        this.$highlightRules = this.$highlightRules || new this.HighlightRules(this.$highlightRuleConfig);
        this.$tokenizer = new Tokenizer(this.$highlightRules.getRules());

        let MAX_TOKEN_COUNT = 2000;

        this.$tokenizer.reportError = function reportError(msg, data) {
          var e = new Error(msg);
          (<any> e).data = data;
          console.error(msg, data);
          setTimeout(function() { throw e; });
        };

        // Custom implementation of getLineTokens.
        // The entire function is copied from the original except for a few changes.
        this.$tokenizer.getLineTokens = function(line: string, startState) {
          let stack: string[];
          if (startState && typeof startState !== "string") {
            stack = startState.slice(0);
            startState = stack[0];
            if (startState === "#tmp") {
              stack.shift();
              startState = stack.shift();
            }
          } else {
            stack = [];
          }

          let currentState = startState || "start";
          let state = this.states[currentState];
          if (!state) {
            currentState = "start";
            state = this.states[currentState];
          }
          let mapping = this.matchMappings[currentState];
          let re: RegExp = this.regExps[currentState];
          re.lastIndex = 0;

          let match: RegExpExecArray, tokens = [];
          let lastIndex = 0;
          let matchAttempts = 0;

          let token = {type: null, value: ""};

          main_loop: while (match = re.exec(line)) {
            let type = mapping.defaultToken;
            let rule = null;
            let value = match[0];
            let index = re.lastIndex;

            // BEGIN CUSTOM:
            if (typeof type === 'function') {
              // This allows the "defaultToken" property to also accept a function value instead of just string
              type = type(currentState, stack, line);
            }

            let tokenBefore = Object.assign({}, token); // added this line
            let tokensBefore = tokens.slice(); // added this line
            // END CUSTOM

            if (index - value.length > lastIndex) {
              let skipped = line.substring(lastIndex, index - value.length);
              if (token.type === type) {
                token.value += skipped;
              } else {
                if (token.type)
                  tokens.push(token);
                token = {type: type, value: skipped};
              }
            }

            for (var i = 0; i < match.length-2; i++) {
              if (match[i + 1] === undefined)
                continue;

              rule = state[mapping[i]];

              let typeBefore = type; // added this line

              if (rule.onMatch)
                type = rule.onMatch(value, currentState, stack, line, match); // added additional parameters
              else
                type = rule.token;

              // BEGIN CUSTOM (onMatch failing)
              if (type === false) {
                let reSplit = splitNotInParens(re.source, '|');

                if (reSplit[mapping[i]] !== '($.)') {
                  reSplit[mapping[i]] = '($.)';

                  let newRe = new RegExp(reSplit.join('|'), re.flags);
                  newRe.lastIndex = lastIndex;
                  re = newRe;

                  token = tokenBefore;
                  tokens = tokensBefore;
                  continue main_loop;
                } else {
                  type = typeBefore;
                }
              }

              let nextState = rule.next; // Copy to variable, can't set "rule.next" itself as it'll break things

              // For the inherited rules (from HTML/XML syntax highlight rules, they don't use the stack for the next
              // state so overwrite their behavior to use the stack.
              if (type.includes('meta') && nextState === 'start' && stack.length) {
                nextState = stack[0] || 'start';
              }
              // END CUSTOM

              // CUSTOM NOTE: changed usages of "rule.next" within this if statement below to use "nextState" instead
              if (nextState) {
                if (typeof nextState == "string") {
                  currentState = nextState;
                } else {
                  currentState = nextState.call(rule, currentState, stack);
                }

                state = this.states[currentState];
                if (!state) {
                  this.reportError("state doesn't exist", currentState);
                  currentState = "start";
                  state = this.states[currentState];
                }
                mapping = this.matchMappings[currentState];
                lastIndex = index;
                re = this.regExps[currentState];
                re.lastIndex = index;
              }
              if (rule.consumeLineEnd)
                lastIndex = index;
              break;
            }

            // BEGIN CUSTOM
            if (!value && rule && rule.allowEmptyToken) {
              // Need space for value otherwise a token with 0-length value will be ignored by the renderer.
              // But the space won't become part of the actual text, so it's okay.
              tokens.push({type: type, value: ' '});
            }
            // END CUSTOM

            if (value) {
              if (typeof type === "string") {
                if ((!rule || rule.merge !== false) && token.type === type) {
                  token.value += value;
                } else {
                  if (token.type)
                    tokens.push(token);
                  token = {type: type, value: value};
                }
              } else if (type) {
                if (token.type)
                  tokens.push(token);
                token = {type: null, value: ""};
                for (var j = 0; j < type.length; j++)
                  tokens.push(type[j]);
              }
            }

            if (lastIndex === line.length)
              break;

            lastIndex = index;

            if (matchAttempts++ > MAX_TOKEN_COUNT) {
              if (matchAttempts > 2 * line.length) {
                this.reportError("infinite loop with in ace tokenizer", {
                  startState: startState,
                  line: line
                });
              }
              while (lastIndex < line.length) {
                if (token.type)
                  tokens.push(token);
                token = {
                  value: line.substring(lastIndex, lastIndex += 2000),
                  type: "overflow"
                };
              }
              currentState = "start";
              stack = [];
              break;
            }
          }

          if (token.type)
            tokens.push(token);

          if (stack.length > 1) {
            if (stack[0] !== currentState)
              stack.unshift("#tmp", currentState);
          }

          // BEGIN CUSTOM
          tokens = quotifyWikitextTokens(tokens);
          // END CUSTOM

          return {
            tokens : tokens,
            state : stack.length ? stack : currentState
          };
        };
        // END: getLineTokens
      }
      return this.$tokenizer;
    };

    // this.lineCommentStart = ""//"";
    // this.blockComment = {start: ""/*"", end: ""*/""};
    // Extra logic goes here.

    this.$id = 'ace/mode/wikitext';
  }).call(Mode.prototype);
  exports.Mode = Mode;
});