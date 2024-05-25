import { initiateMediaSearchPage } from '../../generic/media-app/media-search-app.ts';
import { genshinEndpoints } from '../../../core/endpoints.ts';

initiateMediaSearchPage(
  'StarRailMediaSearchPage',
  genshinEndpoints.mediaSearch,
  '/hsr',
  '/images/hsr/'
);
