import { initiateMediaListPage } from '../../generic/media-app/media-list-app.ts';
import { wuwaEndpoints } from '../../../core/endpoints.ts';

initiateMediaListPage(
  'WuwaMediaListPage',
  wuwaEndpoints.mediaSearch,
  wuwaEndpoints.mediaCategory,
  '/wuwa',
  '/images/wuwa/',
  false
);
