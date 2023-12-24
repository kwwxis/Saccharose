import { genshinEndpoints, SaccharoseApiEndpoint, starRailEndpoints, zenlessEndpoints } from '../../../endpoints.ts';
import { pageMatch } from '../../../pageMatch.ts';
import { GenericSearchPageHandle, startGenericSearchPageListeners } from '../../genericSearchPage.ts';
import { toInt } from '../../../../shared/util/numberUtil.ts';
import { frag } from '../../../util/domutil.ts';
import { startListeners } from '../../../util/eventLoader.ts';
import { highlightReplace, highlightWikitextReplace } from '../../../util/ace/wikitextEditor.ts';
import SiteMode from '../../../siteMode.ts';

pageMatch('pages/generic/basic/textmap', () => {
  let handle: GenericSearchPageHandle;

  let endpoint: SaccharoseApiEndpoint<any>;

  if (SiteMode.isGenshin) {
    endpoint = genshinEndpoints.searchTextMap;
  } else if (SiteMode.isStarRail) {
    endpoint = starRailEndpoints.searchTextMap;
  } else if (SiteMode.isZenless) {
    endpoint = zenlessEndpoints.searchTextMap;
  }

  let idUsagesEndpoint: SaccharoseApiEndpoint<any>;

  if (SiteMode.isGenshin) {
    idUsagesEndpoint = genshinEndpoints.getIdUsages;
  } else if (SiteMode.isStarRail) {
    idUsagesEndpoint = starRailEndpoints.getIdUsages;
  } else if (SiteMode.isZenless) {
    idUsagesEndpoint = zenlessEndpoints.getIdUsages;
  }

  startGenericSearchPageListeners({
    endpoint,

    inputs: [
      {
        selector: '.search-input',
        apiParam: 'text',
        queryParam: 'q',
        pasteButton: '.search-input-paste',
        clearButton: '.search-input-clear',
      },
      {
        selector: '#startFromLine',
        apiParam: 'startFromLine',
      },
      {
        selector: '#resultSetNum',
        apiParam: 'resultSetNum',
      },
      {
        selector: '#isRawInput',
        apiParam: 'isRawInput',
        queryParam: 'isRawInput',
      },
      {
        selector: '#isRawOutput',
        apiParam: 'isRawOutput',
        queryParam: 'isRawOutput',
      }
    ],

    submitPendingTarget: '.search-submit-pending',
    submitButtonTarget: '.search-submit',
    resultTarget: '#search-result',

    onReceiveResult(caller: string, resultTarget: HTMLElement, result: any, preventDefault: () => void) {
      preventDefault();

      const fragment = frag(result);
      const containerEl = fragment.querySelector('.result-wrapper');

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

      startListeners([
        {
          el: '.id-usages-trigger',
          ev: 'click',
          multiple: true,
          fn(event, buttonEl) {
            if (buttonEl.classList.contains('triggered')) {
              if (buttonEl.classList.contains('expanded-state')) {
                buttonEl.setAttribute('ui-tippy-hover', 'Expand usage results');
              } else {
                buttonEl.setAttribute('ui-tippy-hover', 'Collapse usage results');
              }
              return;
            }

            event.preventDefault();
            event.stopPropagation();

            buttonEl.classList.add('triggered');
            // buttonEl.classList.remove('expand-action', 'collapsed-state')
            // buttonEl.classList.add('triggered', 'collapse-action', 'expanded-state');

            const hash = buttonEl.getAttribute('data-hash');
            const resultEl = document.getElementById(buttonEl.getAttribute('data-result-target'));
            buttonEl.setAttribute('ui-action', 'expando: #' + resultEl.id);

            buttonEl.setAttribute('ui-tippy-hover', 'Collapse usage results');

            buttonEl.querySelectorAll('.id-usages-trigger-icon').forEach(x => x.classList.add('hide'));
            buttonEl.querySelector('.id-usages-loading-icon').classList.remove('hide');

            idUsagesEndpoint.get({q: hash, v2: true}, true).then(result => {
              resultEl.innerHTML = result;

              resultEl.querySelectorAll<HTMLTextAreaElement>('textarea.json').forEach(el => {
                highlightReplace(el, 'ace/mode/json');
              });

              buttonEl.querySelector('.id-usages-loading-icon').classList.add('hide');
              buttonEl.querySelectorAll('.id-usages-trigger-icon').forEach(x => x.classList.remove('hide'));

              setTimeout(() => {
                buttonEl.click();
              });
            });
          }
        }
      ], resultTarget);
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
