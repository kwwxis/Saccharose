import { pageMatch } from '../../../core/pageMatch.ts';
import {
  GenericSearchPageHandle,
  GenericSearchPageParamOpt,
  startGenericSearchPageListeners,
} from '../../genericSearchPage.ts';
import { SaccharoseApiEndpoint } from '../../../core/endpoints.ts';
import { frag1, isElementPartiallyInViewport } from '../../../util/domutil.ts';
import { escapeHtml } from '../../../../shared/util/stringUtil.ts';
import { ImageIndexSearchParams, ImageIndexSearchResult } from '../../../../shared/types/image-index-types.ts';
import { ModalRef, modalService } from '../../../util/modalService.ts';
import { ScriptJobPostResult } from '../../../../backend/util/scriptJobs.ts';
import { toastError, toastSuccess } from '../../../util/toasterUtil.ts';

export function initiateMediaSearchPage(
  vueComponentName: string,
  mediaSearchEndpoint: SaccharoseApiEndpoint<ImageIndexSearchParams, ImageIndexSearchResult>,
  mediaCreateImageIndexArchiveJob: SaccharoseApiEndpoint<ImageIndexSearchParams, ScriptJobPostResult<'createImageIndexArchive'>>,
  siteModeHome: string,
  imagePathPrefix: string,
  archiveJobPagePrefix: string,
  enableVersionFilter: boolean,
) {
  pageMatch(`vue/${vueComponentName}`, () => {
    let handle: GenericSearchPageHandle;

    startGenericSearchPageListeners({
      endpoint: mediaSearchEndpoint,
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
        },
        ... (enableVersionFilter ? [
          <GenericSearchPageParamOpt<any>> {
            selector: '#firstVersionFilter',
            apiParam: 'versionFilter',
            queryParam: 'versions',
          }
        ] : [])
      ],

      submitPendingTarget: '.image-name-search-submit-pending',
      submitButtonTarget: '.image-name-search-submit',
      resultTarget: '#image-name-search-result',

      onReceiveResult(caller: string, apiPayload: Record<string, string|number>, resultTarget: HTMLElement, result, preventDefault: () => void) {
        preventDefault();
        document.querySelector('#image-name-search-result-wrapper').classList.remove('hide');

        console.log({ result });

        if (caller !== 'loadMore') {
          resultTarget.innerHTML = '';
        }
        if (caller !== 'loadMore' && !result.results.length) {
          resultTarget.innerHTML = `<p>No results</p`;
        }
        if (caller !== 'loadMore') {
          const downloadButtonArea: HTMLElement = document.querySelector('#image-name-search-result-download-button-area');
          downloadButtonArea.innerHTML = '';

          const downloadButton: HTMLButtonElement = frag1(`<button class="primary primary--2">Download all results</button>`);

          downloadButton.addEventListener('click', () => {
            const query: string = String(apiPayload.query || '');
            modalService.confirm('Download all results', `
              <p>You will be downloading all results for query: <code>${escapeHtml(query)}</code></p>
              <p class="spacer10-top">You do <b>not</b> need to scroll down to load all results before initiating the download.</p>
              <hr class="spacer15-vert" />
              <p>Initiating the download will open a page in a <b>new tab</b>. Do not close this tab until the new tab is open.</p>
              <p class="spacer10-top">Once the new tab is open, you're free to close this tab or keep using it.</p>
            `, {
              confirmButtonText: 'Initiate download'
            }).onConfirm(() => {
              console.log('Confirmed');

              setTimeout(async () => {
                let ref: ModalRef = modalService.alert('Please wait...', `
                  <p>Working on starting your download request. Do not close this tab.</p>
                  
                  <p class="spacer15-top spacer10-bottom">This should take a few seconds. If it takes more than like 10 seconds,
                  then maybe something went wrong.</p>
                `, {
                  disallowUserClose: true
                });

                let postResult: ScriptJobPostResult<'createImageIndexArchive'>;
                let postDidFail: boolean = false;

                try {
                  postResult = await mediaCreateImageIndexArchiveJob.send({
                    query,
                  });
                  if (!postResult?.job?.job_id) {
                    postDidFail = true;
                    return;
                  }
                } catch (e) {
                  postDidFail = true;
                  return;
                }

                ref.close();
                setTimeout(() => {
                  if (postDidFail) {
                    modalService.alert('Failed to initiate download', 'Request to script job coordinator failed.');
                  } else if (postResult.posted === 'created_noack') {
                    modalService.alert('Failed to initiate download', postResult.message);
                  } else {
                    toastSuccess({title: 'Image archive job started', content: postResult.message});

                    const jobUrl = window.location.origin + archiveJobPagePrefix + postResult.job.job_id;
                    try {
                      window.open(jobUrl, '_blank').focus();
                    } catch (e) {
                      modalService.alert('Successfully started job', `
                        <p>The job was successfully started but failed to open the job page in a new tab
                        because pop-ups are disabled.</p>
                        
                        <p class="spacer10-top">Enable pop-ups for this site to prevent this from happening next time.</p>
                        
                        <hr class="spacer15-vert" />
                        
                        <p>You can click this link to open the job page:</p>
                        
                        <p class="spacer10-top"><a href="${jobUrl}">${jobUrl}</a></p>
                      `);
                    }
                  }
                });
              });
            });
          });

          downloadButtonArea.append(downloadButton);
        }

        for (let entity of result.results) {
          resultTarget.append(frag1(`
          <div class="media-image">
            <div class="image-frame bordered">
              <div class="image-obj">
                <img src="${imagePathPrefix}${escapeHtml(entity.image_name)}.png" />
              </div>
              <a href="${siteModeHome}/media/details/${escapeHtml(entity.image_name)}" class="image-label" target="_blank">${escapeHtml(entity.image_name)}</a>
            </div>
          </div>
        `));
        }
        if (result.hasMore) {
          resultTarget.append(frag1(`<div id="media-search-load-more" style="min-height:1px"></div>`))
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
      },

      beforeSendRequest(caller: string) {
        if (caller === 'loadMore') {
          return;
        }
        document.querySelector('#image-name-search-result-download-button-area').innerHTML = '';
      }
    });
  });
}
