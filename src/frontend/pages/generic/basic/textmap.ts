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
import SiteModeInfo from '../../../core/userPreferences/siteModeInfo.ts';
import { highlightReplace } from '../../../core/ace/aceHighlight.ts';
import { TextMapChangeRef } from '../../../../shared/types/changelog-types.ts';
import { createDiffUIFullDiff, DiffUI } from '../../../util/DiffUI.ts';
import { isNightmode } from '../../../core/userPreferences/siteTheme.ts';
import { ColorSchemeType } from 'diff2html/lib/types';
import { GeneralEventBus } from '../../../core/generalEventBus.ts';
import { isLangCode, LangCode } from '../../../../shared/types/lang-types.ts';
import { modalService } from '../../../util/modalService.ts';
import { toBoolean } from '../../../../shared/util/genericUtil.ts';
import { toastInfo } from '../../../util/toasterUtil.ts';

pageMatch('TextmapSearchPage', () => {
  let handle: GenericSearchPageHandle;

  let endpoint: SaccharoseApiEndpoint<any>;

  if (SiteModeInfo.isGenshin) {
    endpoint = genshinEndpoints.searchTextMap;
  } else if (SiteModeInfo.isStarRail) {
    endpoint = starRailEndpoints.searchTextMap;
  } else if (SiteModeInfo.isZenless) {
    endpoint = zenlessEndpoints.searchTextMap;
  } else if (SiteModeInfo.isWuwa) {
    endpoint = wuwaEndpoints.searchTextMap;
  }

  let excelUsagesEndpoint: SaccharoseApiEndpoint<any>;

  if (SiteModeInfo.isGenshin) {
    excelUsagesEndpoint = genshinEndpoints.getExcelUsages;
  } else if (SiteModeInfo.isStarRail) {
    excelUsagesEndpoint = starRailEndpoints.getExcelUsages;
  } else if (SiteModeInfo.isZenless) {
    excelUsagesEndpoint = zenlessEndpoints.getExcelUsages;
  } else if (SiteModeInfo.isWuwa) {
    excelUsagesEndpoint = wuwaEndpoints.getExcelUsages;
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
        clearButton: '.version-filter-clear',
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

        if (json.changeType === 'superseded') {
          return;
        }

        if (json.prevValue && json.value) {
          const diffUIArea: HTMLElement = el.querySelector('.diff-ui-area');

          diffUIArea.style.marginTop = '15px';

          diffUIs.push(new DiffUI(diffUIArea, createDiffUIFullDiff('Diff', json.prevValue, json.value), {
            matching: 'lines',
            drawFileList: false,
            outputFormat: 'line-by-line',
            compactHeader: true,
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
  });

  listen([
    {
      selector: '.textmap-download-trigger[data-lang]',
      event: 'click',
      multiple: true,
      handle(_event, buttonEl) {
        const langCode: string = buttonEl.getAttribute('data-lang');
        if (!langCode || !isLangCode(langCode)) {
          return;
        }
        GeneralEventBus.emit('openTextMapDownloadModal', langCode);
      }
    }
  ])
});

GeneralEventBus.on('openTextMapDownloadModal', (langCode: LangCode) => {
  modalService.closeAll();

  let downloadOptions = {
    doNormText: true,
    decolor: false,
    plaintext: false,
    plaintextMcMode: 'both', // or 'male' or 'female'
    forceFancyDash: false,
    skipHtml2Quotes: false,
  };

  function radioCheckboxHtml(name: keyof typeof downloadOptions) {
    return `
        <label class="ui-radio boolean-radio dispBlock" style="padding-left:5px;font-size:13px;">
          <input type="radio" name="${name}" value="false" ${!downloadOptions[name] ? 'checked' : ''} />
          <span>No</span>
        </label>
        <label class="ui-radio boolean-radio dispBlock" style="padding-left:5px;font-size:13px;">
          <input type="radio" name="${name}" value="true" ${downloadOptions[name] ? 'checked' : ''} />
          <span>Yes</span>
        </label>
    `;
  }

  const modalRef = modalService.confirm('Download TextMap' + langCode, `
  <div class="content">
    <div class="field spacer10-bottom">
      <div class="fontWeight700 spacer5-bottom">Do Norm Text</div>
      <p>If set to no, then the raw textmap without any normalization/transformations can be downloaded.</p>
      <div class="valign spacer-top">${radioCheckboxHtml('doNormText')}</div>
    </div>
    <fieldset>
      <legend>Norm Text Options</legend>
      <div class="content">
        <div class="field spacer10-bottom">
          <div class="fontWeight700 spacer5-bottom">Decolor</div>
          <p>If yes, color syntax is removed while the text within colors remains.</p>
          <p>The behavior of this option is forced to yes when Plaintext is set to yes.</p>
          <div class="valign spacer-top">${radioCheckboxHtml('decolor')}</div>
        </div>
        <div class="field spacer10-bottom">
          <div class="fontWeight700 spacer5-bottom">Plaintext</div>
          <p>If yes, convert to plaintext without most wiki template syntax or common textmap script syntax.
          This is good for searching, as you can enter text naturally and not have to worry about the presence of some
          color syntax or such preventing you from finding something.</p>
          <div class="valign spacer-top">${radioCheckboxHtml('plaintext')}</div>
        </div>
        <div class="field spacer10-bottom">
          <div class="fontWeight700 spacer5-bottom">Plaintext MC Mode</div>
          <p>If both, then "<code>(he/she)</code>"; if male, then "<code>he</code>";
          if female, then "<code>she</code>".</p>
          <p>This is only available as an option when Plaintext is set to yes.</p>
          <div class="valign spacer-top">
            <label class="ui-radio dispBlock" style="padding-left:5px;font-size:13px;">
              <input type="radio" name="plaintextMcMode" value="both" disabled checked />
              <span>Both</span>
            </label>
            <label class="ui-radio dispBlock" style="padding-left:5px;font-size:13px;">
              <input type="radio" name="plaintextMcMode" value="male" disabled />
              <span>Male</span>
            </label>
            <label class="ui-radio dispBlock" style="padding-left:5px;font-size:13px;">
              <input type="radio" name="plaintextMcMode" value="female" disabled />
              <span>Female</span>
            </label>
          </div>
        </div>
        <div class="field spacer10-bottom">
          <div class="fontWeight700 spacer5-bottom">Force Fancy Dash</div>
          <p>If yes, then em-dashes and en-dashes are kept in Unicode form, rather than:</p>
          <p>1) be converted into <code>&amp;mdash;</code> or <code>&amp;ndash;</code> respectively when DoNormText=yes and Plaintext=no;</p>
          <p>or 2) be converted into regular ASCII dashes in plaintext mode when DoNormText=yes and Plaintext=yes.</p>
          <div class="valign spacer5-top">${radioCheckboxHtml('forceFancyDash')}</div>
        </div>
        <div class="field spacer10-bottom">
          <div class="fontWeight700 spacer5-bottom">Skip Html2Quotes</div>
          <p>Html2Quotes is the process by which italics are converted into <code>''</code> and
          bolds are converted into <code>'''</code> for wikitext. If this is set to yes, then that process will be skipped.</p>
          <div class="valign spacer-top">${radioCheckboxHtml('skipHtml2Quotes')}</div>
        </div>
      </div>
    </fieldset>
  </div>
  `, {
    modalClass: 'modal-lg',
    disallowBackdropClose: true,
    confirmButtonText: 'Download',
    cancelButtonText: 'Cancel',
  });

  modalRef.onConfirm(() => {
    Object.keys(downloadOptions).forEach(key => {
      const inputEl = modalRef.outerEl.querySelector<HTMLInputElement>(`input[name="${key}"]:checked`);
      if (inputEl) {
        if (key === 'plaintextMcMode') {
          downloadOptions[key] = inputEl.getAttribute('value');
        } else {
          downloadOptions[key] = toBoolean(inputEl.getAttribute('value'));
        }
      }
    });

    setTimeout(() => {
      modalService.alert('Downloading TextMap' + langCode, `
      <p class="spacer10-bottom">Your download has started. This could take a moment... please wait.</p>
      <p>You can close this modal after the download finishes.</p>
      `);

      let downloadLink: string = SiteModeInfo.home + '/textmap/download?langCode=' + langCode;
      Object.entries(downloadOptions).forEach(([key, value]) => {
        downloadLink += `&${key}=${value}`;
      });
      location.href = downloadLink;
    })
  });

  listen([
    {
      selector: '.boolean-radio input[type="radio"]',
      event: 'change',
      multiple: true,
      handle(event, inputEl) {
        const name = inputEl.getAttribute('name');
        const value = toBoolean(inputEl.getAttribute('value'));
        console.log('Changed', name, value);

        if (name === 'doNormText') {
          modalRef.outerEl.querySelectorAll<HTMLInputElement>('input[type="radio"]')
            .forEach(other => {
              const otherName = other.getAttribute('name');
              if (otherName === 'doNormText') {
                return;
              }

              if (value) {
                if (other.hasAttribute('data-already-disabled')) {
                  other.removeAttribute('data-already-disabled');
                } else {
                  other.disabled = false;
                }
              } else {
                if (other.disabled) {
                  other.setAttribute('data-already-disabled', 'true');
                }
                other.disabled = true;
              }
            });
        }
        if (name === 'plaintext') {
          modalRef.outerEl.querySelectorAll<HTMLInputElement>('input[type="radio"][name="plaintextMcMode"]')
            .forEach(other => {
              other.disabled = !value;
            });

          modalRef.outerEl.querySelectorAll<HTMLInputElement>('input[type="radio"][name="decolor"]')
            .forEach(other => {
              other.disabled = value;
            });
        }
      }
    }
  ], modalRef.outerEl);
});
