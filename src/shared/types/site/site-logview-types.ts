import { LangCode } from '../lang-types.ts';
import { SearchMode } from '../../util/searchUtil.ts';

export type LogViewEntity = {
  id: string
  timestamp: string,
  discord_user: string,
  wiki_user: string,
  lang_in: LangCode,
  lang_out: LangCode,
  search_mode: SearchMode,
  http_status: number,
  http_method: string,
  content: string,
  http_runtime: number,
};

