import { escapeHtml } from '../shared/util/stringUtil';
import axios from 'axios';
import { showJavascriptErrorDialog } from './util/errorHandler';

export const endpoints = {
  base_uri: '/api',
  errorHandler: err => {
    if (!err.response.data || err.response.data.error != 'BAD_REQUEST') {
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
};

(<any> window).endpoints = endpoints;