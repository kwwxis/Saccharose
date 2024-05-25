import { initiateMediaListPage } from '../../generic/media-app/media-list-app.ts';
import { genshinEndpoints } from '../../../core/endpoints.ts';

initiateMediaListPage(
  'GenshinMediaListPage',
  genshinEndpoints.mediaSearch,
  genshinEndpoints.mediaCategory,
  '',
  '/images/genshin/'
);
