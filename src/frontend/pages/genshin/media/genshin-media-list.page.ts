import { starRailEndpoints } from '../../../core/endpoints.ts';
import { initiateMediaListPage } from '../../generic/media-app/media-list-app.ts';

initiateMediaListPage(
  'GenshinMediaListPage',
  starRailEndpoints.mediaSearch,
  starRailEndpoints.mediaCategory,
  '',
  '/images/genshin/'
);
