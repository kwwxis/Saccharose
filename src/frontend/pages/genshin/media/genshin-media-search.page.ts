import { initiateMediaSearchPage } from '../../generic/media-app/media-search-app.ts';
import { genshinEndpoints } from '../../../core/endpoints.ts';

initiateMediaSearchPage(
  'GenshinMediaSearchPage',
  genshinEndpoints.mediaSearch,
  '',
  '/images/genshin/'
);
