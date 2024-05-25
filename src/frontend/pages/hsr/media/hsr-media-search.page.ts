import { initiateMediaSearchPage } from '../../generic/media-app/media-search-app.ts';
import { starRailEndpoints } from '../../../core/endpoints.ts';

initiateMediaSearchPage(
  'StarRailMediaSearchPage',
  starRailEndpoints.mediaSearch,
  '/hsr',
  '/images/hsr/'
);
