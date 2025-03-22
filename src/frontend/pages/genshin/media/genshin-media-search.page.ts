import { initiateMediaSearchPage } from '../../generic/media-app/media-search-app.ts';
import { genshinEndpoints } from '../../../core/endpoints.ts';

initiateMediaSearchPage(
  'GenshinMediaSearchPage',
  genshinEndpoints.mediaSearch,
  genshinEndpoints.mediaPostCreateImageIndexArchiveJob,
  '/genshin',
  '/images/genshin/',
  '/genshin/media/archive-job/',
  true
);
