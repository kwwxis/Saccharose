import { SearchMode } from '../../util/searchUtil.ts';
import { SiteMode } from './site-mode-type.ts';


export type SavedSearchEntity = {
  sha_hash?: number, // auto increment
  user_id: string,

  usage_type: SavedSearchUsageType,
  usage_time: string,
  site_mode: SiteMode,
  search_area: string,

  search_mode: SearchMode,
  search_query: string,
  other_fields: Record<string, any>,

  meta_name?: string,
  meta_desc?: string,
};

export type SavedSearchesRequestCriteria = {
  site_mode: SiteMode,
  search_area: string,
  search_text: string,
};

export type SavedSearchUsageType = 'recent' | 'saved' | 'public';

export const SavedSearchUsageTypes: SavedSearchUsageType[] = [
  'recent',
  'saved',
  'public',
];
