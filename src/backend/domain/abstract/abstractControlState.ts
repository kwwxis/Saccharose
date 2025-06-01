import { Request } from 'express';
import { DEFAULT_LANG, LANG_CODES, LangCode } from '../../../shared/types/lang-types.ts';
import { DEFAULT_SEARCH_MODE, SEARCH_MODES, SearchMode } from '../../../shared/util/searchUtil.ts';
import { Knex } from 'knex';

export abstract class AbstractControlState {
  public request: Request = null;

  /**
   * Override the database connection to use. Or set to false to disable database connection.
   */
  public DbConnection: Knex|boolean = true;

  constructor(request?: Request) {
    this.request = request || null;
  }

  get inputLangCode(): LangCode {
    if (this.request) {
      if (typeof this.request.query['input'] === 'string' && (LANG_CODES as string[]).includes(this.request.query['input'])) {
        return this.request.query['input'] as LangCode;
      }
      return this.request.context.prefs.inputLangCode || DEFAULT_LANG;
    }
    return DEFAULT_LANG;
  }

  get outputLangCode(): LangCode {
    if (this.request) {
      if (typeof this.request.query['output'] === 'string' && (LANG_CODES as string[]).includes(this.request.query['output'])) {
        return this.request.query['output'] as LangCode;
      }
      return this.request.context.prefs.outputLangCode || DEFAULT_LANG;
    }
    return DEFAULT_LANG;
  }

  get searchMode(): SearchMode {
    if (this.request) {
      if (typeof this.request.query['searchMode'] === 'string' && (SEARCH_MODES as string[]).includes(this.request.query['searchMode'])) {
        return this.request.query['searchMode'] as SearchMode;
      }
      return this.request.context.prefs.searchMode || DEFAULT_SEARCH_MODE;
    }
    return DEFAULT_SEARCH_MODE;
  }

  abstract copy(trx?: Knex.Transaction|boolean): AbstractControlState;
}
