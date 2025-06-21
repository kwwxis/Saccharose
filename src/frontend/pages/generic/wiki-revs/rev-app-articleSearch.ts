import { WikiRevAppState } from './rev-app-main.ts';
import { startGenericSearchPageListeners } from '../../genericSearchPage.ts';
import { genericEndpoints } from '../../../core/endpoints.ts';
import { SITE_MODE } from '../../../core/userPreferences/siteModeInfo.ts';
import { isInt } from '../../../../shared/util/numberUtil.ts';

export async function revAppArticleSearch(revAppState: WikiRevAppState) {
  if (isInt(revAppState.pageId)) {
    return;
  }

  startGenericSearchPageListeners({
    endpoint: genericEndpoints.searchArticles,
    asHtml: true,

    inputs: [
      {
        selector: '.search-input',
        apiParam: 'q',
        queryParam: 'q'
      }
    ],

    submitPendingTarget: '.search-submit-pending',
    submitButtonTarget: '.search-submit',
    resultTarget: '#search-result',

    beforeSendRequest(caller, apiPayload) {
      apiPayload.siteMode = SITE_MODE;
    }
  });
}
