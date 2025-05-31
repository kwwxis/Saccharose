import { LangCode } from '../lang-types.ts';
import { SearchMode } from '../../util/searchUtil.ts';

export type LogViewEntity = {
  sha_hash: string,
  log_type: LogViewType,
  timestamp: string,
  full_content: string,
  content: string,

  discord_user?: string,
  wiki_user?: string,
  lang_in?: LangCode,
  lang_out?: LangCode,
  search_mode?: SearchMode,

  http_status?: number,
  http_method?: string,
  http_uri?: string,
  http_runtime?: number,
};

export type LogViewType = 'access' | 'debug' | 'other';
