import { Knex } from 'knex';
import { Request } from '../util/router';
import { DEFAULT_SEARCH_MODE, SEARCH_MODES, SearchMode } from '../util/searchUtil';
import { openKnex } from '../util/db';
import { DEFAULT_LANG, LANG_CODES, LangCode } from '../../shared/types/lang-types';

export class AbstractControlState {
  // Instances:
  public KnexInstance: Knex = null;
  public Request: Request = null;

  get inputLangCode(): LangCode {
    if (this.Request) {
      if (typeof this.Request.query['input'] === 'string' && (LANG_CODES as string[]).includes(this.Request.query['input'])) {
        return this.Request.query['input'] as LangCode;
      }
      return this.Request.cookies['inputLangCode'] || DEFAULT_LANG;
    }
    return DEFAULT_LANG;
  }

  get outputLangCode(): LangCode {
    if (this.Request) {
      if (typeof this.Request.query['output'] === 'string' && (LANG_CODES as string[]).includes(this.Request.query['output'])) {
        return this.Request.query['output'] as LangCode;
      }
      return this.Request.cookies['outputLangCode'] || DEFAULT_LANG;
    }
    return DEFAULT_LANG;
  }

  get searchMode(): SearchMode {
    if (this.Request) {
      if (typeof this.Request.query['searchMode'] === 'string' && (SEARCH_MODES as string[]).includes(this.Request.query['searchMode'])) {
        return this.Request.query['searchMode'] as SearchMode;
      }
      return this.Request.cookies['search-mode'] || DEFAULT_SEARCH_MODE;
    }
    return DEFAULT_SEARCH_MODE;
  }

}

export class AbstractControl<T extends AbstractControlState>  {
  readonly state: T;
  readonly knex: Knex;

  protected IdComparator = (a: any, b: any) => a.Id === b.Id;
  protected sortByOrder = (a: any, b: any) => {
    return a.Order - b.Order || a.Order - b.Order;
  };

  constructor(controlState: Request | T, stateConstructor: {new(): T}) {
    if (!!controlState && controlState.hasOwnProperty('url')) {
      this.state = new stateConstructor();
      this.state.Request = controlState as Request;
    } else if (!!controlState) {
      this.state = controlState as T;
    } else {
      this.state = new stateConstructor();
    }
    this.knex = this.state.KnexInstance || openKnex();
  }
}