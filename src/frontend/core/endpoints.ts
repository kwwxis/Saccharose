// noinspection JSUnusedGlobalSymbols
import { escapeHtml } from '../../shared/util/stringUtil.ts';
import axios, { AxiosError, Method } from 'axios';
import { showInternalErrorDialog, showJavascriptErrorDialog } from '../util/errorHandler.ts';
import { modalService } from '../util/modalService.ts';
import { HttpError } from '../../shared/util/httpError.ts';
import { cleanEmpty } from '../../shared/util/arrayUtil.ts';
import { FetterGroup } from '../../shared/types/genshin/fetter-types.ts';
import { VoiceAtlasGroup } from '../../shared/types/hsr/hsr-avatar-types.ts';
import SiteMode from './userPreferences/siteMode.ts';
import { LangDetectResult } from '../../shared/types/common-types.ts';
import { ScriptJobPostResult, ScriptJobState } from '../../backend/util/scriptJobs.ts';
import { MwArticleInfo, MwArticleSearchResult, MwRevision, MwRevLoadMode } from '../../shared/mediawiki/mwTypes.ts';
import { RequireOnlyOne } from '../../shared/types/utility-types.ts';
import {
  GenshinImageCategoryMap,
  GenshinImageIndexEntity, GenshinImageIndexSearchResult,
} from '../../shared/types/genshin/genshin-image-index-types.ts';

export type ApiParams<T> = T & {
  fields?: string,
  apiKey?: string,
};

export abstract class SaccharoseApiEndpoint<T extends Object, R = any> {
  readonly uri: string;

  protected constructor(readonly base_uri: string, uri: string) {
    if (!uri.startsWith('/')) {
      throw 'SaccharoseApiEndpoint constructor: uri must start with "/"'
    }
    this.uri = this.base_uri + uri;
  }

  get(params: ApiParams<T>): Promise<R>;
  get(params: ApiParams<T>, asHTML: false): Promise<R>;
  get(params: ApiParams<T>, asHTML: true): Promise<string>;
  get<H extends boolean>(params: ApiParams<T>, asHTML: H): Promise<H extends true ? string : R>;

  get(params: ApiParams<T>, asHTML: boolean = false): Promise<any> {
    return this.request('get', params, asHTML);
  }

  post(params: ApiParams<T>): Promise<R>;
  post(params: ApiParams<T>, asHTML: false): Promise<R>;
  post(params: ApiParams<T>, asHTML: true): Promise<string>;
  post<H extends boolean>(params: ApiParams<T>, asHTML: H): Promise<H extends true ? string : R>;

  post(params: ApiParams<T>, asHTML: boolean = false): Promise<any> {
    return this.request('post', params, asHTML);
  }

  put(params: ApiParams<T>): Promise<R>;
  put(params: ApiParams<T>, asHTML: false): Promise<R>;
  put(params: ApiParams<T>, asHTML: true): Promise<string>;
  put<H extends boolean>(params: ApiParams<T>, asHTML: H): Promise<H extends true ? string : R>;

  put(params: ApiParams<T>, asHTML: boolean = false): Promise<any> {
    return this.request('put', params, asHTML);
  }

  delete(params: ApiParams<T>): Promise<R>;
  delete(params: ApiParams<T>, asHTML: false): Promise<R>;
  delete(params: ApiParams<T>, asHTML: true): Promise<string>;
  delete<H extends boolean>(params: ApiParams<T>, asHTML: H): Promise<H extends true ? string : R>;

  delete(params: ApiParams<T>, asHTML: boolean = false) {
    return this.request('delete', params, asHTML);
  }

  request(method: Method, params: ApiParams<T>): Promise<R>;
  request(method: Method, params: ApiParams<T>, asHTML: false): Promise<R>;
  request(method: Method, params: ApiParams<T>, asHTML: true): Promise<string>;
  request<H extends boolean>(method: Method, params: ApiParams<T>, asHTML: H): Promise<H extends true ? string : R>;

  request(method: Method, params: ApiParams<T>, asHTML: boolean = false): Promise<any> {
    const currentUrlParams = new URLSearchParams(window.location.search);
    params['input'] = currentUrlParams.get('input');
    params['output'] = currentUrlParams.get('output');
    params['searchMode'] = currentUrlParams.get('searchMode');

    let uri: string = this.uri;
    let cleanedParams = cleanEmpty(params);

    for (let paramKey of Object.keys(cleanedParams)) {
      if (typeof cleanedParams[paramKey] === 'boolean') {
        cleanedParams[paramKey] = cleanedParams[paramKey] ? 'true' : 'false';
      }
      if (uri.includes(`{${paramKey}}`)) {
        uri = uri.replace(`{${paramKey}}`, cleanedParams[paramKey]);
        delete cleanedParams[paramKey];
      }
    }

    return axios
      .request({
        url: uri,
        method: method,
        params: cleanedParams,
        headers: {
          'Accept': asHTML ? 'text/html' : 'application/json',
          'Content-Type': asHTML ? 'text/html' : 'application/json',
        }
      })
      .then(response => response.data)
      .catch(this.errorHandler);
  }

  errorHandler(err: AxiosError) {
    console.log('Error Handler:', err);

    const data: any = err.response.data;
    const httpError: HttpError = HttpError.fromJson(data);

    if (httpError && (httpError.status >= 500 && httpError.status <= 599)) {
      showInternalErrorDialog(data);
      return;
    }

    if (httpError && httpError.type === 'EBADCSRFTOKEN') {
      modalService.modal('Session timed out', `
        <p>
          The session for your page expired after being left open for too long.
        </p>
        <p class='spacer15-top'>
          Simply just refresh the page to restore the session and fix the issue.
        </p>
        <div class='buttons spacer15-top'>
          <button class='primary' ui-action="refresh-page">Refresh Page</button>
          <button class='secondary' ui-action="close-modals">Dismiss</button>
        </div>
      `);
      return;
    }

    if (!httpError || httpError.status !== 400) {
      const errorObj: any = {error: err.toJSON()};

      if (err.response) {
        errorObj.response = {status: err.response.status, headers: err.response.headers, data: err.response.data};
      }

      showJavascriptErrorDialog(err.message,
        escapeHtml(`HTTP ${err.config.method.toUpperCase()} Request to ${err.config.url}`),
        undefined,
        undefined,
        errorObj
      );
      return;
    }

    return Promise.reject(httpError);
  }
}

export class GenshinApiEndpoint<T extends Object, R = any> extends SaccharoseApiEndpoint<T, R> {
  constructor(uri: string) {
    super('/api/genshin', uri);
  }
}

export class StarRailApiEndpoint<T extends Object, R = any> extends SaccharoseApiEndpoint<T, R> {
  constructor(uri: string) {
    super('/api/hsr', uri);
  }
}

export class ZenlessApiEndpoint<T extends Object, R = any> extends SaccharoseApiEndpoint<T, R> {
  constructor(uri: string) {
    super('/api/zenless', uri);
  }
}

export class GenericApiEndpoint<T extends Object, R = any> extends SaccharoseApiEndpoint<T, R> {
  constructor(uri: string) {
    super('/api', uri);
  }
}

export class BaseUrlEndpoint<T extends Object, R = any> extends SaccharoseApiEndpoint<T, R> {
  constructor(uri: string) {
    super('', uri);
  }
}

export const errorHtmlWrap = (str: string) => {
  return `<div class="card"><div class="content">${escapeHtml(str)}</div></div>`;
};

export const genshinEndpoints = {
  testGeneralErrorHandler: new GenshinApiEndpoint('/nonexistant_endpoint'),

  findMainQuest: new GenshinApiEndpoint<{name: string|number}>('/quests/findMainQuest'),
  generateMainQuest: new GenshinApiEndpoint<{id: string|number}>('/quests/generate'),

  generateOL: new GenshinApiEndpoint<{
    text: string,
    hideTl: boolean,
    hideRm: boolean,
    addDefaultHidden: boolean,
    includeHeader: boolean,
  }>('/OL/generate'),

  generateSingleDialogueBranch: new GenshinApiEndpoint<{text: string, npcFilter?: string, voicedOnly?: string}>('/dialogue/single-branch-generate'),

  generateNpcDialogue: new GenshinApiEndpoint<{name: string}>('/dialogue/npc-dialogue-generate'),

  generateReminderDialogue: new GenshinApiEndpoint<{text: string, subsequentAmount?: number}>('/dialogue/reminder-dialogue-generate'),

  searchTextMap: new GenshinApiEndpoint<{
    text: string,
    startFromLine: number,
    resultSetNum: number,
  }>('/search-textmap'),

  getIdUsages: new GenshinApiEndpoint<{q: string}>('/id-usages'),

  voToDialogue: new GenshinApiEndpoint<{text: string}>('/dialogue/vo-to-dialogue'),

  getFetters: new GenshinApiEndpoint<{avatarId: number}, FetterGroup>('/character/fetters'),

  searchReadables: new GenshinApiEndpoint<{text: string}>('/readables/search'),

  searchItems: new GenshinApiEndpoint<{text: string}>('/items/search'),
  searchWeapons: new GenshinApiEndpoint<{text: string}>('/weapons/search'),
  searchAchievements: new GenshinApiEndpoint<{text: string}>('/achievements/search'),
  searchTutorials: new GenshinApiEndpoint<{text: string}>('/tutorials/search'),

  mediaSearch: new GenshinApiEndpoint<{
    query?: string,
    cat1?: string,
    cat2?: string,
    cat3?: string,
    cat4?: string,
    cat5?: string,
    catPath?: string,
    catRestrict?: boolean,
    offset?: number,
    searchMode?: string,
  }, GenshinImageIndexSearchResult>('/media/search'),
  mediaCategory: new GenshinApiEndpoint<{}, GenshinImageCategoryMap>('/media/category'),
};

export const starRailEndpoints = {
  generateOL: new StarRailApiEndpoint<{
    text: string,
    hideTl: boolean,
    hideRm: boolean,
    addDefaultHidden: boolean,
    includeHeader: boolean,
  }>('/OL/generate'),

  searchTextMap: new StarRailApiEndpoint<{
    text: string,
    startFromLine: number,
    resultSetNum: number,
  }>('/search-textmap'),

  getIdUsages: new StarRailApiEndpoint<{q: string}>('/id-usages'),

  getVoiceAtlasGroup: new StarRailApiEndpoint<{avatarId: number}, VoiceAtlasGroup>('/character/voice-atlas'),
};

export const zenlessEndpoints = {
  generateOL: new ZenlessApiEndpoint<{
    text: string,
    hideTl: boolean,
    hideRm: boolean,
    addDefaultHidden: boolean,
    includeHeader: boolean,
  }>('/OL/generate'),

  searchTextMap: new ZenlessApiEndpoint<{
    text: string,
    startFromLine: number,
    resultSetNum: number,
  }>('/search-textmap'),

  getIdUsages: new ZenlessApiEndpoint<{q: string}>('/id-usages'),
};

export const genericEndpoints = {
  langDetect: new GenericApiEndpoint<{
    text: string
  }, LangDetectResult>('/lang-detect'),

  authCheck: new BaseUrlEndpoint<{
    wikiUsername: string,
    wikiLang?: string,
  }, {
    result: 'denied' | 'approved' | 'banned',
    reason: string,
  }>('/auth/check'),

  authUncheck: new BaseUrlEndpoint<{}>('/auth/uncheck'),

  postJob: new GenericApiEndpoint<{
    action: string,
    [arg: string]: string|number|boolean,
  }, ScriptJobPostResult<any>>('/jobs/post'),

  getJob: new GenericApiEndpoint<{
    jobId: string,
  }, ScriptJobState<any>>('/jobs/{jobId}'),

  getArticleInfo: new GenericApiEndpoint<{
    siteMode: string,
    pageid: number
  }, MwArticleInfo>('/mw/{siteMode}/articles'),

  searchArticles: new GenericApiEndpoint<{
    siteMode: string,
    q: string|number
  }, MwArticleSearchResult>('/mw/{siteMode}/articles/search'),

  getRevisions: new GenericApiEndpoint<RequireOnlyOne<{
    siteMode: string,
    revid?: number|string,
    pageid?: number,
    loadMode?: MwRevLoadMode,
  }, 'revid' | 'pageid'>, MwRevision[]>('/mw/{siteMode}/revs'),
};

export function getOLEndpoint(): {endpoint: SaccharoseApiEndpoint<any>, tlRmDisabled: boolean, neverDefaultHidden: boolean} {
  let endpoint: SaccharoseApiEndpoint<any>;
  let tlRmDisabled: boolean = false;
  let neverDefaultHidden: boolean = false;

  if (SiteMode.isGenshin) {
    endpoint = genshinEndpoints.generateOL;
  } else if (SiteMode.isStarRail) {
    endpoint = starRailEndpoints.generateOL;
    tlRmDisabled = true;
    neverDefaultHidden = true;
  } else if (SiteMode.isZenless) {
    endpoint = zenlessEndpoints.generateOL;
    tlRmDisabled = true;
    neverDefaultHidden = true;
  }
  return {endpoint, tlRmDisabled, neverDefaultHidden};
}

(<any> window).genshinEndpoints = genshinEndpoints;
(<any> window).starRailEndpoints = starRailEndpoints;
(<any> window).zenlessEndpoints = zenlessEndpoints;
(<any> window).genericEndpoints = genericEndpoints;
