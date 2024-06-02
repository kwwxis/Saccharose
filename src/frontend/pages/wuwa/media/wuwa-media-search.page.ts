import { initiateMediaSearchPage } from '../../generic/media-app/media-search-app.ts';
import { wuwaEndpoints } from '../../../core/endpoints.ts';

initiateMediaSearchPage(
  'WuwaMediaSearchPage',
  wuwaEndpoints.mediaSearch,
  '/wuwa',
  '/images/wuwa/'
);
