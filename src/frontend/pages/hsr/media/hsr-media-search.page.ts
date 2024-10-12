import { initiateMediaSearchPage } from '../../generic/media-app/media-search-app.ts';
import { starRailEndpoints } from '../../../core/endpoints.ts';

initiateMediaSearchPage(
  'StarRailMediaSearchPage',
  starRailEndpoints.mediaSearch,
  starRailEndpoints.mediaPostCreateImageIndexArchiveJob,
  '/hsr',
  '/images/hsr/',
  '/hsr/media/archive-job/'
);
