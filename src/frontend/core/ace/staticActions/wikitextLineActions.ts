import { copyTextToClipboard, frag1, getElementOffset } from '../../../util/domutil.ts';
import { CommonLineId } from '../../../../shared/types/common-types.ts';
import { errorHtmlWrap, getOLEndpoint } from '../../endpoints.ts';
import { HttpError } from '../../../../shared/util/httpError.ts';
import { hideTippy } from '../../../util/tooltipUtil.ts';
import { uuidv4 } from '../../../../shared/util/uuidv4.ts';
import { DOMRect } from 'sortablejs';
import { templateIcon } from '../../../util/templateIcons.ts';

export function applyWikitextLineActions(element: HTMLElement, commonLineIds: CommonLineId[]) {
  if (commonLineIds.length) {
    const {endpoint, tlRmDisabled, neverDefaultHidden} = getOLEndpoint();

    let lastHoveredLine: HTMLElement;
    let isShown: boolean = false;
    let isActive: boolean = false;

    const cursorEl: HTMLElement = frag1(`
      <div class="ace_line-info">
        <div class="ace_line-info-inner">
          <div class="ace_line-info-buttons">
            <button class="copy-line"
                ui-tippy-hover="Copy line"
                ui-tippy-flash="{content:'Copied!', delay: [0,2000]}">${templateIcon('copy')}</button>
            <button class="show-info"
                ui-tippy-hover="Show IDs and OL">${templateIcon('translate')}</button>
          </div>
        </div>
      </div>
    `);

    cursorEl.querySelector('.copy-line').addEventListener('click', async () => {
      if (lastHoveredLine) {
        await copyTextToClipboard(lastHoveredLine.textContent.trim());
      }
    });

    cursorEl.querySelector('.show-info').addEventListener('click', async (_event) => {
      if (!lastHoveredLine)
        return;

      const buttonEl: HTMLButtonElement = cursorEl.querySelector('.show-info');
      if (lastHoveredLine.hasAttribute('data-active')) {
        buttonEl.classList.remove('active');
        removeAllPanels();
        return;
      } else {
        removeAllPanels();
        buttonEl.classList.add('active');
      }

      const guid: string = 'panel-' + uuidv4();
      const lineEl: HTMLElement = lastHoveredLine
      const lineRect: DOMRect = getElementOffset(lineEl);
      const hasDialogId: boolean = lastHoveredLine.hasAttribute('data-id');
      const hasTextMapHash: boolean = lastHoveredLine.hasAttribute('data-textMapHash');

      lineEl.setAttribute('data-active', guid);

      const panel: HTMLElement = frag1(`
      <div id="${guid}" class="ace_line-info-panel-outer">
        <div class="ace_line-info-panel">
          <h4 class="ace_line-info-toolbar valign">
            ${hasDialogId ? `
              <div class="prop valign">
                <span style="opacity:0.6">Dialog ID:&nbsp;</span>
                <code class="ace_line-info-panel--dialogId">${lineEl.getAttribute('data-id')}</code>
                <button class="copy-button" ui-action="copy: #${guid} .ace_line-info-panel--dialogId"
                  ui-tippy-hover="Copy Dialog ID"
                  ui-tippy-flash="{content:'Copied!', delay: [0,2000]}">${templateIcon('copy')}</button>
              </div>
            ` : ''}
            ${hasTextMapHash ? `
              <div class="prop valign">
                <span style="opacity:0.6">TextMapHash:&nbsp;</span>
                <code class="ace_line-info-panel--textMapHash">${lineEl.getAttribute('data-textMapHash')}</code>
                <button class="copy-button" ui-action="copy: #${guid} .ace_line-info-panel--textMapHash"
                  ui-tippy-hover="Copy TextMapHash"
                  ui-tippy-flash="{content:'Copied!', delay: [0,2000]}">${templateIcon('copy')}</button>
              </div>
            ` : ''}
            <div class="grow"></div>
            <button class="close"></button>
          </h4>
          ${hasTextMapHash ? `
          <div class="ace_line-info-OL"></div>
          ` : ''}
        </div>
      </div>
      `);

      panel.querySelector('.close').addEventListener('click', () => removeAllPanels());

      let p: Promise<void> = Promise.resolve();

      if (hasTextMapHash) {
        p = endpoint.send({
          text: lineEl.getAttribute('data-textMapHash'),
          hideTl: tlRmDisabled,
          addDefaultHidden: !neverDefaultHidden,
          hideRm: tlRmDisabled,
          singleResultSimpleHtml: true,
        }, null, true).then(result => {
          panel.querySelector('.ace_line-info-OL').innerHTML = result;
        }).catch((err: HttpError) => {
          if (err.type === 'NotFound') {
            panel.querySelector('.ace_line-info-OL').innerHTML = errorHtmlWrap('Not Found: ' + err.message);
          } else {
            panel.querySelector('.ace_line-info-OL').innerHTML = errorHtmlWrap(err.message);
          }
        });
      }

      p.finally(() => {
        calculateLinePanelPositions(panel, lineRect);
        document.body.append(panel);
      });
    });

    cursorEl.addEventListener('mouseenter', () => {
      cursorEl.classList.add('hovered');
      cursorEl.style.opacity = '1';
      isShown = true;
    });

    cursorEl.addEventListener('mouseleave', () => {
      cursorEl.classList.remove('hovered');
      setTimeout(() => {
        if (lastHoveredLine && !lastHoveredLine.classList.contains('hovered')) {
          removeCursor();
        }
      });
    });

    const removeAllPanels = () => {
      document.querySelectorAll('.ace_line-info-panel-outer').forEach((el: HTMLElement) => {
        document.querySelectorAll(`[data-active="${el.id}"]`).forEach(x => x.removeAttribute('data-active'));
        el.style.opacity = '0';
        setTimeout(() => {
          el.remove();
        }, 100);
      });
    };

    const removeCursor = () => {
      if (isActive)
        return;
      isShown = false;
      setTimeout(() => {
        if (isShown)
          return;
        hideTippy(cursorEl.querySelector('.copy-line'), true);
        hideTippy(cursorEl.querySelector('.show-info'), true);
        cursorEl.style.opacity = '0';
        setTimeout(() => {
          if (isShown)
            return;
          cursorEl.remove();
        }, 100);
      }, 500);
    };

    element.querySelectorAll('.ace_static_text_layer .ace_line').forEach((lineEl: HTMLElement) => {
      lineEl.addEventListener('mouseenter', () => {
        lineEl.classList.add('hovered');
        lastHoveredLine = lineEl;

        const lineRect: DOMRect = getElementOffset(lineEl);
        cursorEl.style.top = lineRect.top + 'px';
        cursorEl.style.left = lineRect.left + 'px';

        let showInfoEl: HTMLElement = cursorEl.querySelector('.show-info');

        if (lineEl.hasAttribute('data-id') || lineEl.hasAttribute('data-textMapHash')) {
          showInfoEl.style.width = '28px';
          showInfoEl.style.borderWidth = '1px';
        } else {
          showInfoEl.style.width = '0';
          showInfoEl.style.borderWidth = '0';
        }

        if (lineEl.hasAttribute('data-active')) {
          showInfoEl.classList.add('active');
        } else {
          showInfoEl.classList.remove('active');
        }

        if (!isShown) {
          document.body.append(cursorEl);
          cursorEl.style.opacity = '1';
          isShown = true;
        }
      });
      lineEl.addEventListener('mouseleave', () => {
        lineEl.classList.remove('hovered');
        setTimeout(() => {
          if (lastHoveredLine === lineEl && !cursorEl.classList.contains('hovered')) {
            removeCursor();
          }
        });
      });
    });
  }
}

function calculateLinePanelPositions(panel: HTMLElement, lineRect: DOMRect) {
  const extraWidthStretch: number = 60;
  panel.style.top = lineRect.top + lineRect.height + 'px';
  panel.style.left = (lineRect.left - (extraWidthStretch / 2)) + 'px';
  panel.style.width = (lineRect.width + extraWidthStretch) + 'px';
}

export function recalculateAceLinePanelPositions() {
  document.querySelectorAll('.ace_line-info-panel-outer').forEach((el: HTMLElement) => {
    const lineEl: HTMLElement = document.querySelector(`[data-active="${el.id}"]`);
    if (lineEl) {
      calculateLinePanelPositions(el, getElementOffset(lineEl));
    }
  });
}
