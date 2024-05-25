import { initiateMediaListPage } from '../../generic/media-app/media-list-app.ts';
import { starRailEndpoints } from '../../../core/endpoints.ts';

initiateMediaListPage(
  'StarRailMediaListPage',
  starRailEndpoints.mediaSearch,
  starRailEndpoints.mediaCategory,
  '/hsr',
  '/images/hsr/'
);
