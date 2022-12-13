import { escapeHtml } from '../shared/util/stringUtil';
import axios, { AxiosError } from 'axios';
import { showJavascriptErrorDialog } from './util/errorHandler';
import { DIALOG_ALERT, DIALOG_MODAL, openDialog } from './util/dialog';

export const endpoints = {
  base_uri: '/api',
  errorHtmlWrap: (str: string) => {
    return `<div class="card"><div class="content">${escapeHtml(str)}</div></div>`;
  },
  errorHandler: (err: AxiosError) => {
    console.log('Error Handler:', err);
    const data: any = err.response.data;

    if (!data || data.error != 'BAD_REQUEST') {
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
    }

    if (data && data.error_code === 'EBADCSRFTOKEN') {
      openDialog(`
      <h2>Session timed out.</h2>
      <p class='spacer-top'>
        The session for your page expired after being left open for too long.
      </p>
      <p class='spacer-top'>
        Simply just refresh the page to restore the session and fix the issue.
      </p>
      <div class='buttons spacer-top'>
        <button class='primary' ui-action="refresh-page">Refresh Page</button>
        <button class='secondary' ui-action="close-modals">Dismiss</button>
      </div>
    `, DIALOG_MODAL);
    }

    return err.response.data;
  },
  ping() {
    return axios
      .get(`${this.base_uri}/ping`)
      .then(response => response.data)
      .catch(this.errorHandler);
  },
  testGeneralErrorHandler() {
    return axios
      .get(`${this.base_uri}/nonexistant_endpoint`)
      .then(response => response.data)
      .catch(this.errorHandler);
  },
  findMainQuest(nameOrId: string|number, asHTML: boolean = false) {
    return axios
      .get(`${this.base_uri}/quests/findMainQuest`, {
        params: {name: nameOrId },
        headers: {
          'Accept': asHTML ? 'text/html' : 'application/json',
          'Content-Type': asHTML ? 'text/html' : 'application/json',
        }
      })
      .then(response => response.data)
      .catch(this.errorHandler);
  },
  generateMainQuest(id: string|number, asHTML: boolean = false) {
    return axios
      .get(`${this.base_uri}/quests/generate`, {
        params: {id: id},
        headers: {
          'Accept': asHTML ? 'text/html' : 'application/json',
          'Content-Type': asHTML ? 'text/html' : 'application/json',
        }
      })
      .then(response => response.data)
      .catch(this.errorHandler);
  },
  generateOL(text: string, hideTl: boolean = false, addDefaultHidden: boolean = false, hideRm: boolean = false, asHTML: boolean = false) {
    return axios
      .get(`${this.base_uri}/OL/generate`, {
        params: {
          text: text,
          hideTl: hideTl ? 'true' : 'false',
          hideRm: hideRm ? 'true' : 'false',
          addDefaultHidden: addDefaultHidden ? 'true' : 'false'
        },
        headers: {
          'Accept': asHTML ? 'text/html' : 'application/json',
          'Content-Type': asHTML ? 'text/html' : 'application/json',
        }
      })
      .then(response => response.data)
      .catch(this.errorHandler);
  },
  generateSingleDialogueBranch(text: string, npcFilter: string, asHTML: boolean = false) {
    return axios
      .get(`${this.base_uri}/dialogue/single-branch-generate`, {
        params: {text: text, npcFilter: npcFilter || null},
        headers: {
          'Accept': asHTML ? 'text/html' : 'application/json',
          'Content-Type': asHTML ? 'text/html' : 'application/json',
        }
      })
      .then(response => response.data)
      .catch(this.errorHandler);
  },
  generateNpcDialogue(npcName: string, asHTML: boolean = false) {
    return axios
      .get(`${this.base_uri}/dialogue/npc-dialogue-generate`, {
        params: {name: npcName},
        headers: {
          'Accept': asHTML ? 'text/html' : 'application/json',
          'Content-Type': asHTML ? 'text/html' : 'application/json',
        }
      })
      .then(response => response.data)
      .catch(this.errorHandler);
  },
  generateReminderDialogue(text: string, subsequentAmount: number = 0, asHTML: boolean = false) {
    return axios
      .get(`${this.base_uri}/dialogue/reminder-dialogue-generate`, {
        params: {text: text, subsequentAmount: subsequentAmount},
        headers: {
          'Accept': asHTML ? 'text/html' : 'application/json',
          'Content-Type': asHTML ? 'text/html' : 'application/json',
        }
      })
      .then(response => response.data)
      .catch(this.errorHandler);
  },
  searchTextMap(text: string, asHTML: boolean = false) {
    return axios
      .get(`${this.base_uri}/search-textmap`, {
        params: {text: text},
        headers: {
          'Accept': asHTML ? 'text/html' : 'application/json',
          'Content-Type': asHTML ? 'text/html' : 'application/json',
        }
      })
      .then(response => response.data)
      .catch(this.errorHandler);
  },
  voToDialogue(text: string, asHTML: boolean = false) {
    return axios
      .get(`${this.base_uri}/dialogue/vo-to-dialogue`, {
        params: {text: text},
        headers: {
          'Accept': asHTML ? 'text/html' : 'application/json',
          'Content-Type': asHTML ? 'text/html' : 'application/json',
        }
      })
      .then(response => response.data)
      .catch(this.errorHandler);
  },
};

(<any> window).endpoints = endpoints;