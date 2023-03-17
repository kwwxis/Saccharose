import { endpoints } from '../../endpoints';
import { pageMatch } from '../../pageMatch';
import { GenericSearchPageHandle, startGenericSearchPageListeners } from '../genericSearchPage';
import { toInt } from '../../../shared/util/numberUtil';

pageMatch('pages/basic/text-map-expand', () => {
  let handle: GenericSearchPageHandle;

  startGenericSearchPageListeners({
    endpoint: endpoints.searchTextMap,

    secondaryInputUrlParam: 'startFromLine',
    secondaryInputTarget: '#startFromLine',

    onReceiveResult(caller: string, resultTarget: HTMLElement, result: any, preventDefault: () => void) {
      preventDefault();

      if (typeof result === 'object' && result.message) {
        resultTarget.innerHTML = endpoints.errorHtmlWrap(result.message);
        return;
      } else if (typeof result !== 'string') {
        resultTarget.innerHTML = endpoints.errorHtmlWrap('Internal error - malformed response');
        return;
      }

      resultTarget.querySelectorAll('[data-last-line]').forEach(el => el.removeAttribute('data-last-line'));

      if (caller === 'loadMore') {
        let loadMoreButton = resultTarget.querySelector('#search-load-more');
        if (loadMoreButton) {
          let parent = loadMoreButton.parentElement;
          loadMoreButton.remove();
          parent.innerHTML = `<p class="fontWeight600 textAlignCenter" style="font-size:17px">More results loaded.</p>`
        }
        resultTarget.insertAdjacentHTML('beforeend', result);
      } else {
        resultTarget.innerHTML = result;
      }

      let dataLastLineEl = resultTarget.querySelector('[data-last-line]');
      if (dataLastLineEl) {
        let lastLineValue = dataLastLineEl.getAttribute('data-last-line');
        document.querySelector<HTMLInputElement>('#startFromLine').value = String(toInt(lastLineValue) + 1);
      }

      let loadMoreButton = resultTarget.querySelector('#search-load-more');
      if (loadMoreButton) {
        loadMoreButton.addEventListener('click', () => {
          handle.generateResult('loadMore');
        });
      }
    },
    afterInit(argHandle: GenericSearchPageHandle) {
      handle = argHandle;
    },
    beforeGenerateResult(caller: string) {
      if (caller === 'loadMore') {
        return;
      }
      document.querySelector<HTMLInputElement>('#startFromLine').value = '';
    }
  })
});