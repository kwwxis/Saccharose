import { starRailEndpoints } from '../../../core/endpoints.ts';
import { initiateMediaListPage } from '../../generic/media-app/media-list-app.ts';

initiateMediaListPage(
  'StarRailMediaListPage',
  starRailEndpoints.mediaSearch,
  starRailEndpoints.mediaCategory,
  '/hsr',
  '/images/hsr/'
);
