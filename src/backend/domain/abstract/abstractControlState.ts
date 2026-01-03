import { Request } from 'express';
import { DEFAULT_LANG, LangCode } from '../../../shared/types/lang-types.ts';
import { DEFAULT_SEARCH_MODE, SearchMode } from '../../../shared/util/searchUtil.ts';
import { Knex } from 'knex';
import { WsSession } from '../../websocket/ws-sessions.ts';
import { SiteUser, SiteUserPrefs } from '../../../shared/types/site/site-user-types.ts';

export type AbstractControlStateType<T extends AbstractControlState = AbstractControlState> = {new(controlUserModeProvider?: ControlUserModeProvider): T};

export abstract class AbstractControlState {
  readonly controlUserMode: ControlUserMode;

  public MAX_TEXTMAP_SEARCH_RESULTS: number = 100;

  /**
   * Override the database connection to use. Or set to false to disable database connection.
   */
  public DbConnection: Knex|boolean = true;

  constructor(controlUserModeProvider?: ControlUserModeProvider) {
    this.controlUserMode = getControlUserMode(controlUserModeProvider);
  }

  get inputLangCode(): LangCode {
    return this.controlUserMode.inputLangCode;
  }

  get outputLangCode(): LangCode {
    return this.controlUserMode.outputLangCode;
  }

  get searchMode(): SearchMode {
    return this.controlUserMode.searchMode;
  }

  get prefs(): SiteUserPrefs {
    return this.controlUserMode.prefs;
  }

  abstract copy(trx?: Knex.Transaction|boolean): AbstractControlState;
}

export interface ControlUserMode {
  inputLangCode: LangCode,
  outputLangCode: LangCode,
  searchMode: SearchMode,
  prefs: SiteUserPrefs,
  cookies: Record<string, any>,
}

export type ControlUserModeProvider = ControlUserMode|Request|WsSession|SiteUser;

function createDefaultControlUserMode(): ControlUserMode {
  return {
    inputLangCode: DEFAULT_LANG,
    outputLangCode: DEFAULT_LANG,
    searchMode: DEFAULT_SEARCH_MODE,
    prefs: {},
    cookies: {},
  };
}

export function getControlUserMode(input: ControlUserModeProvider): ControlUserMode {
  if (!input) {
    return createDefaultControlUserMode();
  }

  const isMode = (o: any): o is ControlUserMode => o.inputLangCode && o.outputLangCode && o.searchMode;
  const isRequest = (o: any): o is Request => o.query && o.context;
  const isSiteUser = (o: any): o is SiteUser => o.id && o.wiki_allowed;

  if (isMode(input)) {
    return input;
  }

  const mode: ControlUserMode = createDefaultControlUserMode();

  if (input instanceof WsSession) {
    input = input.user;
  }

  if (isRequest(input)) {
    mode.inputLangCode = input.context.inputLangCode;
    mode.outputLangCode = input.context.outputLangCode;
    mode.searchMode = input.context.searchMode;
    mode.prefs = input.context.prefs;
    mode.cookies = input.context.cookies();
  }

  if (isSiteUser(input)) {
    mode.inputLangCode = input.prefs.inputLangCode || DEFAULT_LANG;
    mode.outputLangCode = input.prefs.outputLangCode || DEFAULT_LANG;
    mode.searchMode = input.prefs.searchMode || DEFAULT_SEARCH_MODE;
    mode.prefs = input.prefs;
  }

  return mode;
}
