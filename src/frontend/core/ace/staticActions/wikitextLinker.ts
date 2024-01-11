// noinspection CssUnusedSymbol

import { listen, runWhenDOMContentLoaded } from '../../../util/eventListen.ts';
import { isHTMLElement, textNodesUnder } from '../../../util/domutil.ts';
import { highlightWikitextReplace } from '../aceHighlight.ts';
import { showAceTooltipNow } from '../aceTooltips.ts';
import { toInt } from '../../../../shared/util/numberUtil.ts';

let didApply = false;

export function applyWikitextLinker() {
  if (didApply) {
    return;
  }
  didApply = true;

  runWhenDOMContentLoaded(() => {
    listen([
      {
        selector: document,
        event: 'keydown',
        handle(event: KeyboardEvent) {
          // Check 1: Must have pressed Ctrl+K
          // ----------------------------------------------------------------------------------------------------
          if (!(event.key === 'k' && (event.ctrlKey || event.metaKey))) {
            return;
          }

          // Check 2: Must have text selected
          // ----------------------------------------------------------------------------------------------------
          const sel = window.getSelection();
          if (!sel.rangeCount) {
            return;
          }

          // Get first and last element of text selection
          // ----------------------------------------------------------------------------------------------------
          const range: Range = sel.getRangeAt(0);
          const startNode: Node = range.startContainer;
          const endNode: Node = range.endContainer;
          const startEl: Element = isHTMLElement(startNode) ? startNode : startNode.parentElement;
          const endEl: Element = isHTMLElement(endNode) ? endNode : endNode.parentElement;

          // Get and check text layer
          // ----------------------------------------------------------------------------------------------------
          const textLayer: HTMLElement = (() => {
            // Check that both startEl and endEl are in a text layer
            let textLayer1: HTMLElement = startEl.closest('.ace_static_text_layer')
            let textLayer2: HTMLElement = endEl.closest('.ace_static_text_layer');
            // And make sure that they are the same text layer
            return textLayer1 && textLayer2 && textLayer1 === textLayer2 ? textLayer1 : null;
          })();

          // Check 3: Entire selection must be in a text layer
          // ----------------------------------------------------------------------------------------------------
          if (!textLayer) {
            return;
          }

          // Check 4: Make sure we're in a highlighted element
          // ----------------------------------------------------------------------------------------------------
          const aceMainElement: HTMLElement = textLayer.closest('[data-highlight-id]');
          if (!aceMainElement) {
            return;
          }

          const aceLineElement: HTMLElement = startEl.closest('.ace_line');
          const aceLineIdx: number = toInt(aceLineElement.getAttribute('data-line-idx'));
          const aceLineNumber: number = aceLineIdx + 1;

          // Prevent defaults, now we know this is a valid situation.
          // ----------------------------------------------------------------------------------------------------
          event.stopPropagation();
          event.preventDefault();

          // Check 5: prevent invalid linking
          // ----------------------------------------------------------------------------------------------------
          const banCheck = (node: Node): string => {
            const el = isHTMLElement(node) ? node : node.parentElement;

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

          const startBan: string = banCheck(startNode);
          const endBan: string = banCheck(endNode);

          if (startBan) {
            showAceTooltipNow(endEl, 'error', startBan, 2000);
            return;
          }
          if (endBan) {
            showAceTooltipNow(endEl, 'error', endBan, 2000);
            return;
          }

          // Find start and end pos
          // ----------------------------------------------------------------------------------------------------
          const textNodes: Text[] = textNodesUnder(textLayer);

          //console.log({range, startNode, endNode, textNodes});

          let startPos: number = -1;
          let endPos: number = -1;

          let textPos: number = 0;
          for (let textNode of textNodes) {
            if (textNode === startNode) {
              startPos = textPos + range.startOffset;
              //console.log('start node found!');
            }

            if (textNode === endNode) {
              endPos = textPos + range.endOffset;
              //console.log('end node found!');
            }

            textPos += textNode.length;
          }

          // Contract text range if necessary to exclude leading/trailing whitespace.
          // E.g. if " Lumine " is highlighted, then it becomes "Lumine"
          // ----------------------------------------------------------------------------------------------------
          const wholeText: string = textLayer.textContent;
          let textRange: string = wholeText.slice(startPos, endPos);

          // If the text range is entirely whitespace, then don't remove any whitespace
          if (!/^\s+$/.test(textRange)) {
            // Loop to remove trailing whitespace:
            while (textRange.length && /\s$/.test(textRange)) {
              endPos--;
              textRange = wholeText.slice(startPos, endPos);
            }

            // Loop to remove leading whitespace:
            while (textRange.length && /^\s/.test(textRange)) {
              startPos++;
              textRange = wholeText.slice(startPos, endPos);
            }
          }

          //console.log({startPos, endPos, range: wholeText.slice(startPos, endPos)});

          // Final checks and perform action.
          // ----------------------------------------------------------------------------------------------------
          if (textRange.includes('\n')) {
            showAceTooltipNow(endEl, 'error', 'Cannot create a link over multiple lines.', 2000);
            return;
          } else if (textRange.includes('[[') && textRange.includes(']]')) {
            if (textRange.match(/\[\[/g).length >= 2 || textRange.match(/]]/g).length >= 2) {
              showAceTooltipNow(endEl, 'error', 'Selection contains multiple links.', 2000);
              return;
            }

            const startLinkIdx = textRange.indexOf('[[');
            const endLinkIdx = textRange.indexOf(']]');
            textRange = textRange.replace(/\[\[/g, '').replace(/]]/g, '');

            const newText = wholeText.substring(0, startPos) + textRange + wholeText.substring(endPos);
            highlightWikitextReplace(aceMainElement, {
              textOverride: newText.trim(),
              markerAdjustments: [
                {
                  line: aceLineNumber,
                  col: startPos + startLinkIdx,
                  mode: 'delete',
                  count: 2,
                },
                {
                  line: aceLineNumber,
                  col: startPos + endLinkIdx,
                  mode: 'delete',
                  count: 2,
                }
              ]
            });
          } else if (textRange.includes('[[') || textRange.includes(']]')) {
            showAceTooltipNow(endEl, 'error',
              'Selection contains partial link.<br />Select an entire link to unlink.', 2000);
            return;
          } else {
            const newText = wholeText.substring(0, startPos) + '[[' + textRange + ']]' + wholeText.substring(endPos);

            highlightWikitextReplace(aceMainElement, {
              textOverride: newText.trim(),
              markerAdjustments: [
                {
                  line: aceLineNumber,
                  col: startPos,
                  mode: 'insert',
                  count: 2,
                },
                {
                  line: aceLineNumber,
                  col: startPos + textRange.length,
                  mode: 'insert',
                  count: 2,
                }
              ]
            });
          }
        }
      }
    ]);
  });
}
