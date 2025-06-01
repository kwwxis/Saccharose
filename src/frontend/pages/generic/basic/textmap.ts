import {
  genshinEndpoints,
  SaccharoseApiEndpoint,
  starRailEndpoints,
  wuwaEndpoints,
  zenlessEndpoints,
} from '../../../core/endpoints.ts';
import { pageMatch } from '../../../core/pageMatch.ts';
import { GenericSearchPageHandle, startGenericSearchPageListeners } from '../../genericSearchPage.ts';
import { toInt } from '../../../../shared/util/numberUtil.ts';
import { frag } from '../../../util/domutil.ts';
import { listen } from '../../../util/eventListen.ts';
import SiteMode from '../../../core/userPreferences/siteMode.ts';
import { highlightReplace } from '../../../core/ace/aceHighlight.ts';
import { TextMapChangeRef } from '../../../../shared/types/changelog-types.ts';
import { createPatch } from '../../../../backend/util/jsdiff';
import { DiffUI } from '../../../util/DiffUI.ts';
import { isNightmode } from '../../../core/userPreferences/siteTheme.ts';
import { ColorSchemeType } from 'diff2html/lib/types';

pageMatch('vue/TextmapSearchPage', () => {
  let handle: GenericSearchPageHandle;

  let endpoint: SaccharoseApiEndpoint<any>;

  if (SiteMode.isGenshin) {
    endpoint = genshinEndpoints.searchTextMap;
  } else if (SiteMode.isStarRail) {
    endpoint = starRailEndpoints.searchTextMap;
  } else if (SiteMode.isZenless) {
    endpoint = zenlessEndpoints.searchTextMap;
  } else if (SiteMode.isWuwa) {
    endpoint = wuwaEndpoints.searchTextMap;
  }

  let excelUsagesEndpoint: SaccharoseApiEndpoint<any>;

  if (SiteMode.isGenshin) {
    excelUsagesEndpoint = genshinEndpoints.getExcelUsages;
  } else if (SiteMode.isStarRail) {
    excelUsagesEndpoint = starRailEndpoints.getExcelUsages;
  } else if (SiteMode.isZenless) {
    excelUsagesEndpoint = zenlessEndpoints.getExcelUsages;
  } else if (SiteMode.isWuwa) {
    excelUsagesEndpoint = wuwaEndpoints.getExcelUsages;
  }

  listen([
    {
      selector: '#versionFilterEnabled',
      event: 'input',
      handle(_ev) {
        const checkbox = document.querySelector<HTMLInputElement>('#versionFilterEnabled');
        if (checkbox.checked) {
          document.querySelector('#versionFilterOuter').classList.remove('hide');
        } else {
          document.querySelector('#versionFilterOuter').classList.add('hide');
        }
      }
    }
  ]);

  if (new URL(window.location.href).searchParams.has('versions')) {
    document.querySelector<HTMLInputElement>('#versionFilterEnabled').checked = true;
    document.querySelector('#versionFilterOuter').classList.remove('hide');
  }

  let diffUIs: DiffUI[] = [];

  startGenericSearchPageListeners({
    endpoint,
    asHtml: true,

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
        selector: '#resultSetIdx',
        apiParam: 'resultSetIdx',
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
      },
      {
        selector: '#hashSearch',
        apiParam: 'hashSearch',
        queryParam: 'hashSearch',
      },
      {
        selector: '#versionFilter',
        apiParam: 'versionFilter',
        queryParam: 'versions',
      }
    ],

    submitPendingTarget: '.search-submit-pending',
    submitButtonTarget: '.search-submit',
    resultTarget: '#search-result',

    onReceiveResult(caller: string, _apiPayload, resultTarget: HTMLElement, result: string, preventDefault: () => void) {
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
        diffUIs.forEach(x => x.destroy());
        diffUIs = [];
      }

      document.querySelector<HTMLInputElement>('#startFromLine').value = containerEl.getAttribute('data-continue-from-line');

      let resultSetIdx = containerEl.getAttribute('data-result-set-idx');
      document.querySelector<HTMLInputElement>('#resultSetIdx').value = String(toInt(resultSetIdx) + 1);

      let loadMoreButton = resultTarget.querySelector<HTMLButtonElement>('#search-load-more');
      if (loadMoreButton) {
        loadMoreButton.addEventListener('click', () => {
          handle.generateResult('loadMore');
          loadMoreButton.disabled = true;
        });
      }

      listen([
        {
          selector: '.excel-usages-trigger',
          event: 'click',
          multiple: true,
          handle(event, buttonEl) {
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

            buttonEl.querySelectorAll('.excel-usages-trigger-icon').forEach(x => x.classList.add('hide'));
            buttonEl.querySelector('.excel-usages-loading-icon').classList.remove('hide');

            excelUsagesEndpoint.send({q: hash, embed: true}, null, true).then(result => {
              resultEl.innerHTML = result;

              resultEl.querySelectorAll<HTMLTextAreaElement>('textarea.json').forEach(el => {
                highlightReplace(el, {mode: 'ace/mode/json'});
              });

              buttonEl.querySelector('.excel-usages-loading-icon').classList.add('hide');
              buttonEl.querySelectorAll('.excel-usages-trigger-icon').forEach(x => x.classList.remove('hide'));

              setTimeout(() => {
                buttonEl.click();
              });
            });
          }
        },
        {
          selector: '.change-refs-trigger',
          event: 'click',
          multiple: true,
          handle(event, buttonEl) {
            if (buttonEl.classList.contains('expanded-state')) {
              buttonEl.setAttribute('ui-tippy-hover', 'Expand change refs');
            } else {
              buttonEl.setAttribute('ui-tippy-hover', 'Collapse change refs');
            }
            return;
          }
        }
      ], resultTarget);

      resultTarget.querySelectorAll('.change-ref-content:not(.diff-processed)').forEach(el => {
        el.classList.add('diff-processed');

        const json: TextMapChangeRef = JSON.parse(el.getAttribute('data-json'));
        if (json.prevValue && json.value) {
          const diffUIArea: HTMLElement = el.querySelector('.diff-ui-area');
          const unifiedDiff = createPatch(`Diff`, json.prevValue, json.value);

          diffUIArea.style.marginTop = '15px';

          diffUIs.push(new DiffUI(diffUIArea, {
            currContent: json.value,
            prevContent: json.prevValue,
            unifiedDiff: unifiedDiff,
          }, {
            matching: 'lines',
            drawFileList: false,
            outputFormat: 'line-by-line',
            colorScheme: isNightmode() ? ColorSchemeType.DARK : ColorSchemeType.LIGHT,
            synchronizedScroll: true,
            wordWrap: true,
            highlightOpts: {
              mode: 'ace/mode/wikitext'
            },
          }));
        }
      });
    },
    afterInit(argHandle: GenericSearchPageHandle) {
      handle = argHandle;
    },
    beforeGenerateResult(caller: string) {
      if (caller === 'loadMore') {
        return;
      }
      document.querySelector<HTMLInputElement>('#startFromLine').value = '';
      document.querySelector<HTMLInputElement>('#resultSetIdx').value = '';
    }
  })
});
