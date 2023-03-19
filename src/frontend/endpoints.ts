import { escapeHtml } from '../shared/util/stringUtil';
import axios, { AxiosError, Method } from 'axios';
import { showInternalErrorDialog, showJavascriptErrorDialog } from './util/errorHandler';
import { modalService } from './util/modalService';
import { HttpError } from '../shared/util/httpError';
import { cleanEmpty } from '../shared/util/arrayUtil';
import { CharacterFetters } from '../shared/types/fetter-types';

// noinspection JSUnusedGlobalSymbols
export class SaccharoseApiEndpoint<T extends Object, R = any> {
  readonly base_uri: string = '/api';
  readonly uri: string;

  constructor(uri: string) {
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
    let rawParams = cleanEmpty(params);
    for (let paramKey of Object.keys(rawParams)) {
      if (typeof rawParams[paramKey] === 'boolean') {
        rawParams[paramKey] = rawParams[paramKey] ? 'true' : 'false';
      }
    }
    return axios
      .request({
        url: this.uri,
        method: method,
        params: params,
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

    if (httpError && httpError.status === 500) {
      showInternalErrorDialog(data);
      return;
    }

    if (httpError && httpError.type === 'EBADCSRFTOKEN') {
      modalService.modal(`
        <h2>Session timed out.</h2>
        <p class='spacer15-top'>
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

export const endpoints = {
  errorHtmlWrap: (str: string) => {
    return `<div class="card"><div class="content">${escapeHtml(str)}</div></div>`;
  },

  ping: new SaccharoseApiEndpoint('/ping'),
  testGeneralErrorHandler: new SaccharoseApiEndpoint('/nonexistant_endpoint'),

  findMainQuest: new SaccharoseApiEndpoint<{name: string|number}>('/quests/findMainQuest'),
  generateMainQuest: new SaccharoseApiEndpoint<{id: string|number}>('/quests/generate'),

  generateOL: new SaccharoseApiEndpoint<{
    text: string,
    hideTl: boolean,
    hideRm: boolean,
    addDefaultHidden: boolean,
  }>('/OL/generate'),

  generateSingleDialogueBranch: new SaccharoseApiEndpoint<{text: string, npcFilter?: string}>('/dialogue/single-branch-generate'),

  generateNpcDialogue: new SaccharoseApiEndpoint<{name: string}>('/dialogue/npc-dialogue-generate'),

  generateReminderDialogue: new SaccharoseApiEndpoint<{text: string, subsequentAmount?: number}>('/dialogue/reminder-dialogue-generate'),

  searchTextMap: new SaccharoseApiEndpoint<{
    text: string,
    startFromLine: number,
    resultSetNum: number,
  }>('/search-textmap'),

  getIdUsages: new SaccharoseApiEndpoint<{q: string}>('/id-usages'),

  voToDialogue: new SaccharoseApiEndpoint<{text: string}>('/dialogue/vo-to-dialogue'),

  getFetters: new SaccharoseApiEndpoint<{avatarId: number}, CharacterFetters>('/character/fetters'),

  searchReadables: new SaccharoseApiEndpoint<{text: string}>('/readables/search'),
};

(<any> window).endpoints = endpoints;