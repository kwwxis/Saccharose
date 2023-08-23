// noinspection JSUnusedGlobalSymbols

import { escapeHtml } from '../shared/util/stringUtil';
import axios, { AxiosError, Method } from 'axios';
import { showInternalErrorDialog, showJavascriptErrorDialog } from './util/errorHandler';
import { modalService } from './util/modalService';
import { HttpError } from '../shared/util/httpError';
import { cleanEmpty } from '../shared/util/arrayUtil';
import { CharacterFetters } from '../shared/types/genshin/fetter-types';

export abstract class SaccharoseApiEndpoint<T extends Object, R = any> {
  readonly uri: string;

  protected constructor(readonly base_uri: string, uri: string) {
    if (!uri.startsWith('/')) {
      throw 'SaccharoseApiEndpoint constructor: uri must start with "/"'
    }
    this.uri = this.base_uri + uri;
  }

  get(params: T): Promise<R>;
  get(params: T, asHTML: false): Promise<R>;
  get(params: T, asHTML: true): Promise<string>;
  get<H extends boolean>(params: T, asHTML: H): Promise<H extends true ? string : R>;

  get(params: T, asHTML: boolean = false): Promise<any> {
    return this.request('get', params, asHTML);
  }

  post(params: T): Promise<R>;
  post(params: T, asHTML: false): Promise<R>;
  post(params: T, asHTML: true): Promise<string>;
  post<H extends boolean>(params: T, asHTML: H): Promise<H extends true ? string : R>;

  post(params: T, asHTML: boolean = false): Promise<any> {
    return this.request('post', params, asHTML);
  }

  put(params: T): Promise<R>;
  put(params: T, asHTML: false): Promise<R>;
  put(params: T, asHTML: true): Promise<string>;
  put<H extends boolean>(params: T, asHTML: H): Promise<H extends true ? string : R>;

  put(params: T, asHTML: boolean = false): Promise<any> {
    return this.request('put', params, asHTML);
  }

  delete(params: T): Promise<R>;
  delete(params: T, asHTML: false): Promise<R>;
  delete(params: T, asHTML: true): Promise<string>;
  delete<H extends boolean>(params: T, asHTML: H): Promise<H extends true ? string : R>;

  delete(params: T, asHTML: boolean = false) {
    return this.request('delete', params, asHTML);
  }

  request(method: Method, params: T): Promise<R>;
  request(method: Method, params: T, asHTML: false): Promise<R>;
  request(method: Method, params: T, asHTML: true): Promise<string>;
  request<H extends boolean>(method: Method, params: T, asHTML: H): Promise<H extends true ? string : R>;

  request(method: Method, params: T, asHTML: boolean = false): Promise<any> {
    const currentUrlParams = new URLSearchParams(window.location.search);
    params['input'] = currentUrlParams.get('input');
    params['output'] = currentUrlParams.get('output');
    params['searchMode'] = currentUrlParams.get('searchMode');

    let cleanedParams = cleanEmpty(params);
    for (let paramKey of Object.keys(cleanedParams)) {
      if (typeof cleanedParams[paramKey] === 'boolean') {
        cleanedParams[paramKey] = cleanedParams[paramKey] ? 'true' : 'false';
      }
    }

    return axios
      .request({
        url: this.uri,
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

  generateSingleDialogueBranch: new GenshinApiEndpoint<{text: string, npcFilter?: string}>('/dialogue/single-branch-generate'),

  generateNpcDialogue: new GenshinApiEndpoint<{name: string}>('/dialogue/npc-dialogue-generate'),

  generateReminderDialogue: new GenshinApiEndpoint<{text: string, subsequentAmount?: number}>('/dialogue/reminder-dialogue-generate'),

  searchTextMap: new GenshinApiEndpoint<{
    text: string,
    startFromLine: number,
    resultSetNum: number,
  }>('/search-textmap'),

  getIdUsages: new GenshinApiEndpoint<{q: string}>('/id-usages'),

  voToDialogue: new GenshinApiEndpoint<{text: string}>('/dialogue/vo-to-dialogue'),

  getFetters: new GenshinApiEndpoint<{avatarId: number}, CharacterFetters>('/character/fetters'),

  searchReadables: new GenshinApiEndpoint<{text: string}>('/readables/search'),

  searchItems: new GenshinApiEndpoint<{text: string}>('/items/search'),
  searchWeapons: new GenshinApiEndpoint<{text: string}>('/weapons/search'),
  searchAchievements: new GenshinApiEndpoint<{text: string}>('/achievements/search'),

  // mediaUpload: function() {
  //
  //   return axios
  //     .request({
  //       url: this.uri,
  //       method: method,
  //       params: cleanedParams,
  //       headers: {
  //         'Accept': asHTML ? 'text/html' : 'application/json',
  //         'Content-Type': asHTML ? 'text/html' : 'application/json',
  //       }
  //     })
  //     .then(response => response.data)
  //     .catch(this.errorHandler);
  // }
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

(<any> window).genshinEndpoints = genshinEndpoints;
(<any> window).hsrEndpoints = genshinEndpoints;
(<any> window).zenlessEndpoints = genshinEndpoints;