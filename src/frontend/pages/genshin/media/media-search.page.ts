import { pageMatch } from '../../../core/pageMatch.ts';
import { GenericSearchPageHandle, startGenericSearchPageListeners } from '../../genericSearchPage.ts';
import { genshinEndpoints } from '../../../core/endpoints.ts';
import { GenshinImageIndexSearchResult } from '../../../../shared/types/genshin/genshin-image-index-types.ts';
import { toInt } from '../../../../shared/util/numberUtil.ts';
import { frag1, isElementPartiallyInViewport } from '../../../util/domutil.ts';
import { escapeHtml } from '../../../../shared/util/stringUtil.ts';

pageMatch('vue/MediaSearchPage', () => {
  let handle: GenericSearchPageHandle;

  startGenericSearchPageListeners({
    endpoint: genshinEndpoints.mediaSearch,
    asHtml: false,

    inputs: [
      {
        selector: '.image-name-search-input',
        apiParam: 'query',
        queryParam: 'q',
        clearButton: '.image-name-search-input-clear',
      },
      {
        selector: '#mediaSearchOffset',
        apiParam: 'offset',
      }
    ],

    submitPendingTarget: '.image-name-search-submit-pending',
    submitButtonTarget: '.image-name-search-submit',
    resultTarget: '#image-name-search-result',

    onReceiveResult(caller: string, resultTarget: HTMLElement, result, preventDefault: () => void) {
      preventDefault();
      resultTarget.classList.remove('hide');

      const resultContent: HTMLElement = document.querySelector('#image-name-search-result-content');

      console.log({ result });

      if (caller !== 'loadMore') {
        resultContent.innerHTML = '';
      }
      if (caller !== 'loadMore' && !result.results.length) {
        resultContent.innerHTML = `<p>No results</p`;
      }

      for (let entity of result.results) {
        resultContent.append(frag1(`
          <div class="media-image">
            <div class="image-frame bordered">
              <div class="image-obj">
                <img src="/images/genshin/${escapeHtml(entity.image_name)}.png" />
              </div>
              <a href="/media/details/${escapeHtml(entity.image_name)}" class="image-label" target="_blank">${escapeHtml(entity.image_name)}</a>
            </div>
          </div>
        `));
      }
      if (result.hasMore) {
        resultContent.append(frag1(`<div id="media-search-load-more" style="min-height:1px"></div>`))
      }

      document.querySelector<HTMLInputElement>('#mediaSearchOffset').value = String(result.nextOffset);
    },

    afterInit(argHandle: GenericSearchPageHandle) {
      handle = argHandle;

      function checkForLoadMore() {
        const loadMoreEl: HTMLElement = document.querySelector('#media-search-load-more');
        if (loadMoreEl && isElementPartiallyInViewport(loadMoreEl)) {
          loadMoreEl.remove();
          handle.generateResult('loadMore');
        }
      }

      window.addEventListener('scroll', () => checkForLoadMore());
      setInterval(() => checkForLoadMore(), 500);
    },

    beforeGenerateResult(caller: string) {
      if (caller === 'loadMore') {
        return;
      }
      document.querySelector<HTMLInputElement>('#mediaSearchOffset').value = '';
    }
  });
});
