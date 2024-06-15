import { pageMatch } from '../../../core/pageMatch.ts';
import { startGenericSearchPageListeners } from '../../genericSearchPage.ts';
import {
  genshinEndpoints,
  starRailEndpoints,
  SaccharoseApiEndpoint,
  zenlessEndpoints,
  wuwaEndpoints,
} from '../../../core/endpoints.ts';
import SiteMode from '../../../core/userPreferences/siteMode.ts';

pageMatch('pages/generic/basic/excel-usages', () => {
  let endpoint: SaccharoseApiEndpoint<any>;

  if (SiteMode.isGenshin) {
    endpoint = genshinEndpoints.getExcelUsages;
  } else if (SiteMode.isStarRail) {
    endpoint = starRailEndpoints.getExcelUsages;
  } else if (SiteMode.isZenless) {
    endpoint = zenlessEndpoints.getExcelUsages;
  } else if (SiteMode.isWuwa) {
    endpoint = wuwaEndpoints.getExcelUsages;
  }

  startGenericSearchPageListeners({
    endpoint,
    asHtml: true,

    inputs: [
      {
        selector: '.search-input',
        apiParam: 'q',
        queryParam: 'q',
        guards: [
          function (text: string): string {
            if (!text.split(/,/g).map(s => s.trim()).filter(s => !!s).every(s => /^-?[a-zA-Z0-9_]+$/.test(s))) {
              return 'Searchable identifiers can only contain: letters, numbers, underscores, and/or a leading negative sign.';
            }
            return null;
          }
        ]
      }
    ],

    submitPendingTarget: '.search-submit-pending',
    submitButtonTarget: '.search-submit',
    resultTarget: '#search-result',
  });
});
