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
  ImageCategoryMap, ImageIndexSearchParams,
  ImageIndexSearchResult,
} from '../../shared/types/image-index-types.ts';
import { SitePrefName, SiteUserPrefs } from '../../shared/types/site/site-user-types.ts';
import { FavorWordGroup } from '../../shared/types/wuwa/favor-types.ts';
import { OLCombinedResult, OLResult } from '../../backend/domain/abstract/basic/OLgen.ts';
import { TextMapSearchResponse } from '../../shared/types/lang-types.ts';
import { IdToExcelUsages } from '../../shared/util/searchUtil.ts';

export type ApiParams<T> = T & {
  fields?: string,
  apiKey?: string,
};

export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export abstract class SaccharoseApiEndpoint<Params extends Object, Result = any, PostBody = any> {
  readonly uri: string;
  readonly method: ApiMethod;

  protected constructor(readonly base_uri: string,
                        uri: string,
                        method: ApiMethod) {
    if (!uri.startsWith('/')) {
      throw 'SaccharoseApiEndpoint constructor: uri must start with "/"'
    }
    this.uri = this.base_uri + uri;
    this.method = method;
  }

  send(params: ApiParams<Params>): Promise<Result>;
  send(params: ApiParams<Params>, body: PostBody): Promise<Result>;
  send(params: ApiParams<Params>, body: PostBody, asHTML: true): Promise<string>;
  send(params: ApiParams<Params>, body: PostBody, asHTML: false): Promise<Result>;

  send(params: ApiParams<Params>, body: PostBody = null, asHTML: boolean = false): Promise<any> {
    const currentUrlParams = new URLSearchParams(window.location.search);
    if (!params || typeof params !== 'object') {
      params = {} as Params;
    }
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
        method: this.method,
        params: cleanedParams,
        data: body,
        headers: {
          'Accept': asHTML ? 'text/html' : 'application/json'
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

export class GenshinApiEndpoint<Params extends Object, Result = any, PostBody = any> extends SaccharoseApiEndpoint<Params, Result, PostBody> {
  constructor(method: ApiMethod, uri: string) {
    super('/api/genshin', uri, method);
  }
}

export class StarRailApiEndpoint<Params extends Object, Result = any, PostBody = any> extends SaccharoseApiEndpoint<Params, Result, PostBody> {
  constructor(method: ApiMethod, uri: string) {
    super('/api/hsr', uri, method);
  }
}

export class ZenlessApiEndpoint<Params extends Object, Result = any, PostBody = any> extends SaccharoseApiEndpoint<Params, Result, PostBody> {
  constructor(method: ApiMethod, uri: string) {
    super('/api/zenless', uri, method);
  }
}

export class WuwaApiEndpoint<Params extends Object, Result = any, PostBody = any> extends SaccharoseApiEndpoint<Params, Result, PostBody> {
  constructor(method: ApiMethod, uri: string) {
    super('/api/wuwa', uri, method);
  }
}

export class GenericApiEndpoint<Params extends Object, Result = any, PostBody = any> extends SaccharoseApiEndpoint<Params, Result, PostBody> {
  constructor(method: ApiMethod, uri: string) {
    super('/api', uri, method);
  }
}

export class BaseUrlEndpoint<Params extends Object, Result = any, PostBody = any> extends SaccharoseApiEndpoint<Params, Result, PostBody> {
  constructor(method: ApiMethod, uri: string) {
    super('', uri, method);
  }
}

export const errorHtmlWrap = (str: string) => {
  return `<div class="card"><div class="content">${escapeHtml(str)}</div></div>`;
};

export const genshinEndpoints = {
  testGeneralErrorHandler: new GenshinApiEndpoint('GET', '/nonexistant_endpoint'),

  findMainQuest: new GenshinApiEndpoint<{name: string|number}>('GET', '/quests/findMainQuest'),
  generateMainQuest: new GenshinApiEndpoint<{id: string|number}>('GET', '/quests/generate'),

  generateOL: new GenshinApiEndpoint<{
    text: string,
    hideTl: boolean,
    hideRm: boolean,
    addDefaultHidden: boolean,
    includeHeader: boolean,
  }, OLResult[]>('GET', '/OL/generate'),

  combineOL: new GenshinApiEndpoint<any, OLCombinedResult, string>('POST', '/OL/combine'),

  generateSingleDialogueBranch: new GenshinApiEndpoint<{
    text: string,
    npcFilter?: string,
    voicedOnly?: string,
    versionFilter?: string,
  }>('GET', '/dialogue/single-branch-generate'),

  generateNpcDialogue: new GenshinApiEndpoint<{name: string}>(
    'GET', '/dialogue/npc-dialogue-generate'),

  generateReminderDialogue: new GenshinApiEndpoint<{text: string, subsequentAmount?: number}>(
    'GET', '/dialogue/reminder-dialogue-generate'),

  searchTextMap: new GenshinApiEndpoint<{
    text: string,
    startFromLine: number,
    resultSetIdx: number,
  }, TextMapSearchResponse>('GET', '/search-textmap'),

  getExcelUsages: new GenshinApiEndpoint<{q: string}, IdToExcelUsages>('GET', '/excel-usages'),

  voToDialogue: new GenshinApiEndpoint<any, any, {text: string}>('POST', '/dialogue/vo-to-dialogue'),

  getFetters: new GenshinApiEndpoint<{avatarId: number}, FetterGroup>('GET', '/character/fetters'),

  searchReadables: new GenshinApiEndpoint<{text: string}>('GET', '/readables/search'),

  searchItems: new GenshinApiEndpoint<{text: string}>('GET', '/items/search'),
  searchWeapons: new GenshinApiEndpoint<{text: string}>('GET', '/weapons/search'),
  searchAchievements: new GenshinApiEndpoint<{text: string}>('GET', '/achievements/search'),
  searchTutorials: new GenshinApiEndpoint<{text: string}>('GET', '/tutorials/search'),

  mediaSearch: new GenshinApiEndpoint<ImageIndexSearchParams, ImageIndexSearchResult>('GET', '/media/search'),
  mediaCategory: new GenshinApiEndpoint<{}, ImageCategoryMap>('GET', '/media/category'),
  mediaPostCreateImageIndexArchiveJob: new GenshinApiEndpoint<ImageIndexSearchParams,
    ScriptJobPostResult<'createImageIndexArchive'>>('POST', '/media/post-create-image-index-job'),

  searchTcgStages: new GenshinApiEndpoint<{text: string}>('GET', '/gcg/stage-search'),
};

export const starRailEndpoints = {
  generateOL: new StarRailApiEndpoint<{
    text: string,
    hideTl: boolean,
    hideRm: boolean,
    addDefaultHidden: boolean,
    includeHeader: boolean,
  }, OLResult[]>('GET', '/OL/generate'),

  combineOL: new StarRailApiEndpoint<any, OLCombinedResult, string>('POST', '/OL/combine'),

  searchTextMap: new StarRailApiEndpoint<{
    text: string,
    startFromLine: number,
    resultSetIdx: number,
  }, TextMapSearchResponse>('GET', '/search-textmap'),

  getExcelUsages: new StarRailApiEndpoint<{q: string}, IdToExcelUsages>('GET', '/excel-usages'),

  getVoiceAtlasGroup: new StarRailApiEndpoint<{avatarId: number}, VoiceAtlasGroup>('GET', '/character/voice-atlas'),

  mediaSearch: new StarRailApiEndpoint<ImageIndexSearchParams, ImageIndexSearchResult>('GET', '/media/search'),
  mediaCategory: new StarRailApiEndpoint<{}, ImageCategoryMap>('GET', '/media/category'),
  mediaPostCreateImageIndexArchiveJob: new StarRailApiEndpoint<ImageIndexSearchParams,
    ScriptJobPostResult<'createImageIndexArchive'>>('POST', '/media/post-create-image-index-job'),
};

export const zenlessEndpoints = {
  generateOL: new ZenlessApiEndpoint<{
    text: string,
    hideTl: boolean,
    hideRm: boolean,
    addDefaultHidden: boolean,
    includeHeader: boolean,
  }, OLResult[]>('GET', '/OL/generate'),

  combineOL: new ZenlessApiEndpoint<any, OLCombinedResult, string>('POST', '/OL/combine'),

  searchTextMap: new ZenlessApiEndpoint<{
    text: string,
    startFromLine: number,
    resultSetIdx: number,
  }, TextMapSearchResponse>('GET', '/search-textmap'),

  dialogueHelper: new ZenlessApiEndpoint<{
    text: string,
    hashSearch: boolean,
  }>('GET', '/dialogue-helper'),

  getExcelUsages: new ZenlessApiEndpoint<{q: string}, IdToExcelUsages>('GET', '/excel-usages'),
};

export const wuwaEndpoints = {
  generateOL: new WuwaApiEndpoint<{
    text: string,
    hideTl: boolean,
    hideRm: boolean,
    addDefaultHidden: boolean,
    includeHeader: boolean,
  }, OLResult[]>('GET', '/OL/generate'),

  combineOL: new WuwaApiEndpoint<any, OLCombinedResult, string>('POST', '/OL/combine'),

  searchTextMap: new WuwaApiEndpoint<{
    text: string,
    startFromLine: number,
    resultSetIdx: number,
  }, TextMapSearchResponse, TextMapSearchResponse>('GET', '/search-textmap'),

  getExcelUsages: new WuwaApiEndpoint<{q: string}, IdToExcelUsages>('GET', '/excel-usages'),

  getFavorWordGroup: new WuwaApiEndpoint<{roleId: number}, FavorWordGroup>('GET', '/role/favor-words'),

  mediaSearch: new WuwaApiEndpoint<ImageIndexSearchParams, ImageIndexSearchResult>('GET', '/media/search'),
  mediaCategory: new WuwaApiEndpoint<{}, ImageCategoryMap>('GET', '/media/category'),
  mediaPostCreateImageIndexArchiveJob: new WuwaApiEndpoint<ImageIndexSearchParams,
    ScriptJobPostResult<'createImageIndexArchive'>>('POST', '/media/post-create-image-index-job'),
};

export const genericEndpoints = {
  langDetect: new GenericApiEndpoint<{
    text: string
  }, LangDetectResult>('GET', '/lang-detect'),

  getPrefs: new GenericApiEndpoint<{}, SiteUserPrefs>('GET', '/prefs'),

  setPrefs: new GenericApiEndpoint<{
    prefName: SitePrefName,
    prefValue: SiteUserPrefs[SitePrefName]
  }, SiteUserPrefs>('POST', '/prefs'),

  dismissSiteNotice: new GenericApiEndpoint<{
    noticeId: number
  }, {result: 'dismissed'}>('POST', '/site-notice/dismiss'),

  authCheck: new BaseUrlEndpoint<{
    wikiUsername: string,
    wikiLang?: string,
  }, {
    result: 'denied' | 'approved' | 'banned',
    reason: string,
  }>('POST', '/auth/check'),

  authUncheck: new BaseUrlEndpoint<{}>('POST', '/auth/uncheck'),

  simplePostJob: new GenericApiEndpoint<{
    action: string,
    [arg: string]: string|number|boolean,
  }, ScriptJobPostResult<any>>('POST', '/jobs/simple-post'),

  getJob: new GenericApiEndpoint<{
    jobId: string,
  }, ScriptJobState<any>>('GET', '/jobs/{jobId}'),

  getArticleInfo: new GenericApiEndpoint<{
    siteMode: string,
    pageid: number
  }, MwArticleInfo>('GET', '/mw/{siteMode}/articles'),

  searchArticles: new GenericApiEndpoint<{
    siteMode: string,
    q: string|number
  }, MwArticleSearchResult>('GET', '/mw/{siteMode}/articles/search'),

  getRevisions: new GenericApiEndpoint<RequireOnlyOne<{
    siteMode: string,
    revid?: number|string,
    pageid?: number,
    loadMode?: MwRevLoadMode,
  }, 'revid' | 'pageid'>, MwRevision[]>('GET', '/mw/{siteMode}/revs'),
};

export function getOLEndpoint(): {endpoint: SaccharoseApiEndpoint<any>, tlRmDisabled: boolean, neverDefaultHidden: boolean} {
  let endpoint: SaccharoseApiEndpoint<any>;
  let tlRmDisabled: boolean = false;
  let neverDefaultHidden: boolean = false;

  if (SiteMode.isGenshin) {
    endpoint = genshinEndpoints.generateOL;
  } else if (SiteMode.isStarRail) {
    endpoint = starRailEndpoints.generateOL;
    tlRmDisabled = false;
    neverDefaultHidden = true;
  } else if (SiteMode.isZenless) {
    endpoint = zenlessEndpoints.generateOL;
    tlRmDisabled = false;
    neverDefaultHidden = true;
  } else if (SiteMode.isWuwa) {
    endpoint = wuwaEndpoints.generateOL;
    tlRmDisabled = false;
    neverDefaultHidden = true;
  }
  return {endpoint, tlRmDisabled, neverDefaultHidden};
}

export function getOLCombineEndpoint(): SaccharoseApiEndpoint<any> {
  if (SiteMode.isGenshin) {
    return genshinEndpoints.combineOL;
  } else if (SiteMode.isStarRail) {
    return starRailEndpoints.combineOL;
  } else if (SiteMode.isZenless) {
    return zenlessEndpoints.combineOL;
  } else if (SiteMode.isWuwa) {
    return wuwaEndpoints.combineOL;
  }
}

(<any> window).genshinEndpoints = genshinEndpoints;
(<any> window).starRailEndpoints = starRailEndpoints;
(<any> window).zenlessEndpoints = zenlessEndpoints;
(<any> window).wuwaEndpoints = wuwaEndpoints;
(<any> window).genericEndpoints = genericEndpoints;
