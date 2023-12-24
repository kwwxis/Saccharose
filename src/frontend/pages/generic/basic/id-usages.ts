import { pageMatch } from '../../../pageMatch.ts';
import { startGenericSearchPageListeners } from '../../genericSearchPage.ts';
import { genshinEndpoints, starRailEndpoints, SaccharoseApiEndpoint, zenlessEndpoints } from '../../../endpoints.ts';

pageMatch('pages/generic/basic/id-usages', () => {
  let endpoint: SaccharoseApiEndpoint<any>;

  if (pageMatch.isGenshin) {
    endpoint = genshinEndpoints.getIdUsages;
  } else if (pageMatch.isStarRail) {
    endpoint = starRailEndpoints.getIdUsages;
  } else if (pageMatch.isZenless) {
    endpoint = zenlessEndpoints.getIdUsages;
  }

  startGenericSearchPageListeners({
    endpoint,
    
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