import { pageMatch } from '../../../core/pageMatch.ts';
import {
  DOMClassWatcher,
  flashElement,
  frag1,
  getElementOffset,
  isElementPartiallyInViewport,
} from '../../../util/domutil.ts';
import { OverlayScrollbars } from 'overlayscrollbars';
import { isNightmode } from '../../../core/userPreferences/siteTheme.ts';
import { GeneralEventBus } from '../../../core/generalEventBus.ts';
import { listen } from '../../../util/eventListen.ts';

pageMatch('vue/GenshinChangelogPage', async () => {
  const tocContent = Array.from(document.querySelectorAll('.new-summary-section-header')).map(headerEl => {
    const title = headerEl.querySelector('.new-summary-section-title').textContent;
    const count = headerEl.querySelector('.new-summary-section-count').textContent;

    return `
      <a class="new-summary-toc-item" href="#${headerEl.id}" data-for="${headerEl.id}">${title} (${count})</a>
    `;
  }).join('\n<hr />\n');

  const tocElement: HTMLElement = frag1(`
    <div id="new-summary-toc" class="card">
      <h2 id="new-summary-toc-header" class="valign">
        <span>Table of Contents</span>
        <span class="grow"></span>
        <button id="new-summary-toc-hide-button" class="secondary small">Hide</button>
      </h2>
      <div id="new-summary-toc-content" class="content">
        ${tocContent}
      </div>
    </div>
  `);

  const tocWrapper = document.querySelector('#new-summary-toc-parent');
  tocWrapper.append(tocElement);

  listen({
    selector: '.new-summary-toc-item',
    event: 'click',
    multiple: true,
    handle(event, target) {
      event.preventDefault();
      event.stopPropagation();

      const headerEl: HTMLElement = document.getElementById(target.getAttribute('data-for'));
      const contentEl: HTMLElement = headerEl.nextElementSibling as HTMLElement;

      if (!isElementPartiallyInViewport(headerEl)) {
        const bounds = getElementOffset(headerEl);
        const margin = 10;
        window.scrollTo({
          left: 0,
          top: bounds.top - margin
        });
      }

      flashElement(headerEl);
      flashElement(contentEl);

      const expando: HTMLSpanElement = headerEl.querySelector('.expando');
      if (expando.classList.contains('collapsed-state')) {
        expando.click();
      }
    }
  }, tocElement);

  listen({
    selector: '#new-summary-collapse-all-button',
    event: 'click',
    handle() {
      for (let expando of Array.from(document.querySelectorAll<HTMLElement>('.new-summary-section-header .expando'))) {
        if (!expando.classList.contains('collapsed-state')) {
          expando.click();
        }
      }
    }
  })

  const tocHideButton: HTMLButtonElement = document.querySelector('#new-summary-toc-hide-button');
  const tocShowButton: HTMLButtonElement = document.querySelector('#new-summary-toc-show-button');

  tocHideButton.addEventListener('click', () => {
    tocElement.classList.add('out1');
    tocShowButton.classList.remove('hide');
    flashElement(tocShowButton);
  });
  tocShowButton.addEventListener('click', () => {
    tocElement.classList.remove('out1');
    tocShowButton.classList.add('hide');
  });

  initNewSummaryTOCScroll();

  GeneralEventBus.on('TabChange', detail => {
    if (detail.tabgroup === 'changelogAreas') {
      if (detail.tab.id === 'tab-newSummary') {
        tocElement.classList.remove('out2');
      } else {
        tocElement.classList.add('out2');
      }
    }
  });

  new DOMClassWatcher('#new-summary-toc', ['out1', 'out2'], () => {
    checkNewSummaryTOC();
  }, () => {
    checkNewSummaryTOC();
  });
});

function checkNewSummaryTOC() {
  const tocElement = document.getElementById('new-summary-toc');
  const appSidebar = document.getElementById('app-sidebar');
  if (tocElement.classList.contains('out1') || tocElement.classList.contains('out2')) {
    appSidebar.style.opacity = '1';
    appSidebar.style.removeProperty('pointer-events');
  } else {
    appSidebar.style.opacity = '0';
    appSidebar.style.pointerEvents = 'none';
  }
}

function initNewSummaryTOCScroll() {
  const marginPx: number = 5;
  const maxScrollMarginPx = 15;
  const tocElement = document.getElementById('new-summary-toc');
  const tocContentElement = document.getElementById('new-summary-toc-content');
  const appSidebar = document.getElementById('app-sidebar');
  const footerEl: HTMLElement = document.querySelector<HTMLElement>('body > footer');

  function action() {
    const scrollBottom = window.scrollY + window.innerHeight;
    const maxScrollBottom = document.body.scrollHeight - footerEl.offsetHeight - marginPx;

    const topPx = window.scrollY < 52
      ? (72 - Math.min(window.scrollY, 72 - marginPx))
      : 50;
    const bottomPx = (scrollBottom >= maxScrollBottom ? (scrollBottom - maxScrollBottom) + maxScrollMarginPx : marginPx);

    tocElement.style.top = topPx + 'px';
    tocElement.style.bottom = bottomPx + 'px';
  }

  window.addEventListener('scroll', _scroll => {
    action();
  });

  action();
  appSidebar.style.opacity = '0';
  appSidebar.style.pointerEvents = 'none';

  OverlayScrollbars(tocContentElement, {
    scrollbars: {
      theme: isNightmode() ? 'os-theme-light' : 'os-theme-dark',
      autoHide: 'leave'
    },
    overflow: {
      x: 'hidden'
    }
  });
}
