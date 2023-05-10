import { genshinEndpoints, SaccharoseApiEndpoint, starRailEndpoints, zenlessEndpoints } from '../../../endpoints';
import { pageMatch } from '../../../pageMatch';
import { GenericSearchPageHandle, startGenericSearchPageListeners } from '../../genericSearchPage';
import { toInt } from '../../../../shared/util/numberUtil';
import { frag } from '../../../util/domutil';

pageMatch('pages/generic/basic/textmap', () => {
  let handle: GenericSearchPageHandle;

  let endpoint: SaccharoseApiEndpoint<any>;

  if (pageMatch.isGenshin) {
    endpoint = genshinEndpoints.searchTextMap;
  } else if (pageMatch.isStarRail) {
    endpoint = starRailEndpoints.searchTextMap;
  } else if (pageMatch.isZenless) {
    endpoint = zenlessEndpoints.searchTextMap;
  }

  startGenericSearchPageListeners({
    endpoint,

    inputs: [
      {
        selector: '.search-input',
        apiParam: 'text',
        queryParam: 'q',
        clearButton: '.search-input-clear',
      },
      {
        selector: '#startFromLine',
        apiParam: 'startFromLine',
      },
      {
        selector: '#resultSetNum',
        apiParam: 'resultSetNum',
      }
    ],

    submitPendingTarget: '.search-submit-pending',
    submitButtonTarget: '.search-submit',
    resultTarget: '#search-result',

    onReceiveResult(caller: string, resultTarget: HTMLElement, result: any, preventDefault: () => void) {
      preventDefault();

      const fragment = frag(result);
      const containerEl = fragment.querySelector('.dialogue-container');

      if (caller === 'loadMore') {
        resultTarget.querySelectorAll('.search-load-more-container').forEach(e => e.remove());
        resultTarget.querySelectorAll('.load-more-status').forEach(e => e.remove());
        resultTarget.append(fragment);
      } else {
        resultTarget.innerHTML = '';
        resultTarget.append(fragment);
      }

      let lastLineValue = containerEl.getAttribute('data-last-line');
      document.querySelector<HTMLInputElement>('#startFromLine').value = String(toInt(lastLineValue) + 1);

      let resultSetNum = containerEl.getAttribute('data-result-set-num');
      document.querySelector<HTMLInputElement>('#resultSetNum').value = String(toInt(resultSetNum) + 1);

      let loadMoreButton = resultTarget.querySelector<HTMLButtonElement>('#search-load-more');
      if (loadMoreButton) {
        loadMoreButton.addEventListener('click', () => {
          handle.generateResult('loadMore');
          loadMoreButton.disabled = true;
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
      document.querySelector<HTMLInputElement>('#resultSetNum').value = '';
    }
  })
});