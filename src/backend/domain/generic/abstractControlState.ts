import { Request } from 'express';
import { DEFAULT_LANG, LANG_CODES, LangCode } from '../../../shared/types/lang-types.ts';
import { DEFAULT_SEARCH_MODE, SEARCH_MODES, SearchMode } from '../../../shared/util/searchUtil.ts';

export abstract class AbstractControlState {
  public request: Request = null;

  /**
   * Disables establishing database connection on instance construction.
   *
   * This only has effect if it is set to true before the `Control` instance is created.
   * If it is changed the instance is created, then it has no effect.
   */
  public NoDbConnect: boolean = false;

  constructor(request?: Request) {
    this.request = request || null;
  }

  get inputLangCode(): LangCode {
    if (this.request) {
      if (typeof this.request.query['input'] === 'string' && (LANG_CODES as string[]).includes(this.request.query['input'])) {
        return this.request.query['input'] as LangCode;
      }
      return this.request.user.prefs.inputLangCode || DEFAULT_LANG;
    }
    return DEFAULT_LANG;
  }

  get outputLangCode(): LangCode {
    if (this.request) {
      if (typeof this.request.query['output'] === 'string' && (LANG_CODES as string[]).includes(this.request.query['output'])) {
        return this.request.query['output'] as LangCode;
      }
      return this.request.user.prefs.outputLangCode || DEFAULT_LANG;
    }
    return DEFAULT_LANG;
  }

  get searchMode(): SearchMode {
    if (this.request) {
      if (typeof this.request.query['searchMode'] === 'string' && (SEARCH_MODES as string[]).includes(this.request.query['searchMode'])) {
        return this.request.query['searchMode'] as SearchMode;
      }
      return this.request.user.prefs.searchMode || DEFAULT_SEARCH_MODE;
    }
    return DEFAULT_SEARCH_MODE;
  }

  abstract copy(): AbstractControlState;
}
