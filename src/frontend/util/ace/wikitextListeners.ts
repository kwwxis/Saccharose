
import * as ace from 'brace';
import { aceEditors, highlightWikitextReplace } from './wikitextEditor.ts';
import { runWhenDOMContentLoaded, startListeners } from '../eventLoader.ts';
import { DOMClassWatcher, isElement, textNodesUnder } from '../domutil.ts';

let createdDomClassWatcher = false;

export function createAceDomClassWatcher() {
  if (!createdDomClassWatcher) {
    createdDomClassWatcher = true;
    new DOMClassWatcher('body', 'nightmode',
      () => {
        aceEditors.forEach(editor => editor.setTheme('ace/theme/tomorrow_night'));

        let TomorrowNightTheme = ace.acequire('ace/theme/tomorrow_night');
        let TextmateTheme = ace.acequire('ace/theme/textmate');
        document.querySelectorAll('.highlighted').forEach(el => {
          el.classList.remove(TextmateTheme.cssClass);
          el.classList.add(TomorrowNightTheme.cssClass);
        });
      },
      () => {
        aceEditors.forEach(editor => editor.setTheme('ace/theme/textmate'));

        let TomorrowNightTheme = ace.acequire('ace/theme/tomorrow_night');
        let TextmateTheme = ace.acequire('ace/theme/textmate');
        document.querySelectorAll('.highlighted').forEach(el => {
          el.classList.remove(TomorrowNightTheme.cssClass);
          el.classList.add(TextmateTheme.cssClass);
        });
      });
  }
}

runWhenDOMContentLoaded(() => {
  startListeners([
    {
      el: document,
      ev: 'click',
      fn: function(event: KeyboardEvent) {
        if (!(event.ctrlKey || event.metaKey || event.altKey) || !event.target || typeof event.target['closest'] !== 'function') {
          return;
        }

        let target: HTMLElement = event.target as HTMLElement;
        let token = target.closest('.ace_template-name, .ace_link-name');

        if (token) {
          const url = token.getAttribute('data-href');
          if (url) {
            window.open(url, '_blank');
          }
        }
      },
    },
    {
      el: document,
      ev: 'keydown',
      fn: function(event: KeyboardEvent) {
        if (!(event.key === 'k' && (event.ctrlKey || event.metaKey))) {
          return;
        }

        const sel = window.getSelection();
        if (!sel.rangeCount) {
          return;
        }

        const range: Range = sel.getRangeAt(0);
        const startNode: Node = range.startContainer;
        const endNode: Node = range.endContainer;
        const startEl: Element = isElement(startNode) ? startNode : startNode.parentElement;
        const endEl: Element = isElement(endNode) ? endNode : endNode.parentElement;

        const textLayer: HTMLElement = (() => {
          let textLayer1: HTMLElement = startEl.closest('.ace_static_text_layer')
          let textLayer2: HTMLElement = endEl.closest('.ace_static_text_layer');
          return textLayer1 && textLayer2 && textLayer1 === textLayer2 ? textLayer1 : null;
        })();

        if (!textLayer) {
          return;
        }

        const contentEditableEl: HTMLElement = textLayer.closest('[contenteditable]');
        if (!contentEditableEl) {
          return;
        }

        event.stopPropagation();
        event.preventDefault();

        const banCheck = (node: Node): string => {
          const el = isElement(node) ? node : node.parentElement;

          if (el.closest('.ace_link-name')) {
            return 'Cannot create a link inside another link';
          } else if (el.closest('.ace_template-name')) {
            return 'Cannot create a link inside a template name';
          } else if (el.closest('.ace_template-named-param')) {
            return 'Cannot create a link inside a template parameter name';
          } else if (el.closest('.ace_tag-name')) {
            return 'Cannot create a link inside an HTML tag name';
          } else if (el.closest(`
                .ace_template-open, .ace_template-close,
                .ace_header-open, .ace_header-close,
                .ace_variable-open, .ace_variable-close,
                .ace_parserFn-open, .ace_parserFn-close,
                .ace_tag-open, .ace_end-tag-open, .ace_tag-close`)) {
            return 'Cannot create a link here';
          }

          return null;
        };

        const startBan = banCheck(startNode);
        const endBan = banCheck(endNode);

        if (startBan) {
          displayAceTokenTooltip(endEl, 'error', startBan, 2000);
          return;
        }
        if (endBan) {
          displayAceTokenTooltip(endEl, 'error', endBan, 2000);
          return;
        }

        const textNodes: Text[] = textNodesUnder(textLayer);

        console.log({range, startNode, endNode, textNodes});

        let startPos: number = -1;
        let endPos: number = -1;

        let textPos: number = 0;
        for (let textNode of textNodes) {
          if (textNode === startNode) {
            startPos = textPos + range.startOffset;
            console.log('start node found!');
          }

          if (textNode === endNode) {
            endPos = textPos + range.endOffset;
            console.log('end node found!');
          }

          textPos += textNode.length;
        }

        const wholeText: string = textLayer.textContent;
        let textRange: string = wholeText.slice(startPos, endPos);

        while (textRange.length && textRange.endsWith(' ')) {
          endPos--;
          textRange = wholeText.slice(startPos, endPos);
        }
        while (textRange.length && textRange.startsWith(' ')) {
          startPos++;
          textRange = wholeText.slice(startPos, endPos);
        }

        console.log({startPos, endPos, range: wholeText.slice(startPos, endPos)});

        if (textRange.includes('\n')) {
          displayAceTokenTooltip(endEl, 'error', 'Cannot create a link over multiple lines.', 2000);
          return;
        } else if (textRange.includes('[[') && textRange.includes(']]')) {
          if (textRange.match(/\[\[/g).length >= 2 || textRange.match(/]]/g).length >= 2) {
            displayAceTokenTooltip(endEl, 'error', 'Selection contains multiple links.', 2000);
            return;
          }
          textRange = textRange.replace(/\[\[/g, '').replace(/]]/g, '');
          const newText = wholeText.substring(0, startPos) + textRange + wholeText.substring(endPos);
          highlightWikitextReplace(contentEditableEl, newText.trim());
        } else if (textRange.includes('[[') || textRange.includes(']]')) {
          displayAceTokenTooltip(endEl, 'error',
            'Selection contains partial link.<br />Select an entire link to unlink.', 2000);
          return;
        } else {
          const newText = wholeText.substring(0, startPos) + '[[' + textRange + ']]' + wholeText.substring(endPos);
          highlightWikitextReplace(contentEditableEl, newText.trim());
        }
      }
    }
  ]);
});

export function displayAceTokenTooltip(at: Element, tooltipType: string, tooltipHtml: string, timeout: number = 0): HTMLSpanElement {
  document.querySelectorAll('.ace_token-tooltip').forEach(el => el.remove());

  const atRect = at.getBoundingClientRect();
  const tooltipTop = atRect.top + document.body.scrollTop + atRect.height + 5;
  const tooltipLeft = atRect.left + (atRect.width / 2);

  const tooltipEl = document.createElement('span');
  tooltipEl.classList.add('ace_token-tooltip', 'active');
  tooltipEl.setAttribute('data-type', tooltipType);
  tooltipEl.innerHTML = tooltipHtml;

  tooltipEl.style.top = tooltipTop + 'px';
  tooltipEl.style.left = tooltipLeft + 'px';
  document.body.append(tooltipEl);

  if (timeout > 0) {
    setTimeout(() => {
      tooltipEl.remove();
    }, timeout);
  }

  return tooltipEl;
}
