import { pageMatch } from '../../../core/pageMatch.ts';
import { isInt, toInt } from '../../../../shared/util/numberUtil.ts';
import { revAppArticleSearch } from './rev-app-articleSearch.ts';
import { revAppArticlePage } from './rev-app-articlePage.ts';
import { MwArticleInfo, MwRevision } from '../../../../shared/mediawiki/mwTypes.ts';
import { OutputFormatType } from 'diff2html/lib/types';
import { isUnset } from '../../../../shared/util/genericUtil.ts';
import { GeneralEventBus } from '../../../core/generalEventBus.ts';
import { revSelect } from './rev-app-revPage.ts';
import { SITE_MODE_HOME } from '../../../core/userPreferences/siteMode.ts';
import { renderRevDiffTab } from './rev-tabs/revTab-diff.ts';

export class WikiRevAppState {
  pageId: number;
  revId: number;
  rev: MwRevision;

  page: MwArticleInfo;
  pageRevisions: MwRevision[] = [];
  revisionsById: Record<number, MwRevision> = {};

  private _prefs: WikiRevAppPrefs;

  getPrefs(): WikiRevAppPrefs {
    if (this._prefs) {
      return this._prefs;
    }
    this._prefs = localStorage.getObject('WikiRevApp.Prefs', {
      diffHighlightHover: true,
    });
    if (isUnset(this._prefs.diffHighlightHover)) {
      this._prefs.diffHighlightHover = true;
    }
    return this._prefs;
  }

  applyPrefs(prefs: Partial<WikiRevAppPrefs>): void {
    this._prefs = Object.assign(this.getPrefs(), prefs);
    localStorage.setObject('WikiRevApp.Prefs', this._prefs);
  }
}

export interface WikiRevAppPrefs {
  revTabId?: string,
  diffMode?: OutputFormatType,
  diffHighlightHover?: boolean,
}

function initSidebarStickyTop(state: WikiRevAppState) {
  if (!isInt(state.pageId)) {
    return;
  }

  const marginPx: number = 15;
  const maxScrollMarginPx = 24;
  const revAppSide = document.getElementById('revApp-side');
  const footerEl: HTMLElement = document.querySelector<HTMLElement>('body > footer');

  window.addEventListener('scroll', _scroll => {
    const scrollBottom = window.scrollY + window.innerHeight;
    const maxScrollBottom = document.body.scrollHeight - footerEl.offsetHeight - marginPx;

    revAppSide.style.top = (72 - Math.min(window.scrollY, 72 - marginPx)) + 'px';
    revAppSide.style.bottom = (scrollBottom >= maxScrollBottom ? (scrollBottom - maxScrollBottom) + maxScrollMarginPx : marginPx) + 'px';
  });
}

function initTabListeners(state: WikiRevAppState) {
  if (!isInt(state.pageId)) {
    return;
  }
  GeneralEventBus.on('TabChange', event => {
    if (event.tabgroup === 'revMainTabs') {
      if (event.tab.id === 'tab-revHome') {
        window.history.replaceState({}, null, `${SITE_MODE_HOME}/revs/${state.pageId}`);
        document.querySelector('#revApp-side').classList.add('out');
        return;
      } else {
        document.querySelector('#revApp-side').classList.remove('out');
      }

      const tabRevId: number = toInt(event.tab.getAttribute('data-revId'));
      if (state.revId !== tabRevId) {
        state.revId = tabRevId;

        // noinspection JSIgnoredPromiseFromCall
        revSelect(state);
      }
    }
  });

  GeneralEventBus.on('TabChange', event => {
    if (event.tabgroup === 'revSelectTabs') {
      state.applyPrefs({
        revTabId: event.tab.id
      });
      if (event.tab.id === 'tab-revDiff') {
        renderRevDiffTab(state);
      }
    }
  });
}

pageMatch('vue/WikiRevisionPage', async () => {
  const pageId: number = toInt(document.querySelector<HTMLMetaElement>('meta[name="x-pageid"]')?.content);
  const revId: number = toInt(document.querySelector<HTMLMetaElement>('meta[name="x-revid"]')?.content);

  const pageJson: string = document.querySelector<HTMLMetaElement>('meta[name="x-page"]')?.content;
  const page: MwArticleInfo = pageJson ? JSON.parse(pageJson) : null;

  const state: WikiRevAppState = new WikiRevAppState();
  state.pageId = pageId;
  state.revId = revId;
  state.page = page;

  initSidebarStickyTop(state);
  initTabListeners(state);
  await revAppArticleSearch(state)
  await revAppArticlePage(state);
});

