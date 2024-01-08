import Bot from 'nodemw';
import { MwArticleInfoEntity, MwDbInterface, mwGenshinDb, mwStarRailDb, mwZenlessDb } from './mwDbInterface.ts';
import { pathToFileURL } from 'url';
import { closeKnex } from '../util/db.ts';
import { NodeJSCallback } from 'nodemw/lib/types';
import { RequestSiteMode } from '../routing/requestContext.ts';
import { HttpError } from '../../shared/util/httpError.ts';
import { isInt } from '../../shared/util/numberUtil.ts';
import { MwArticleInfo, MwNamespace, MwRevision, MwArticleSearchResult } from '../../shared/mediawiki/mwTypes.ts';
import { isEmpty } from '../../shared/util/genericUtil.ts';
import { ucFirst } from '../../shared/util/stringUtil.ts';

export class MwClientInterface {
  private _isLoggedIn: boolean;
  readonly bot: Bot;

  constructor(readonly db: MwDbInterface, server: string) {
    this.bot = new Bot({
      protocol: 'https',
      server: server,
      path: '/',
      username: process.env.MW_USERNAME,
      password: process.env.MW_PASSWORD,
      debug: false
    });
  }

  getFirstItem(obj) {
    const key = Object.keys(obj).shift();
    return obj[key];
  }

  isLoggedIn() {
    return this._isLoggedIn;
  }

  login(): Promise<any> {
    if (this._isLoggedIn) {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      this.bot.logIn((err: any, result: any) => {
        if (err) {
          reject(err);
        } else {
          this._isLoggedIn = true;
          resolve(result);
        }
      })
    });
  }

  private async getOne(params: any, callback: NodeJSCallback<any>) {
    (<any> this.bot).api.call(params, callback);
  }

  private async getAll(params: any, key: string, callback: NodeJSCallback<any>) {
    this.bot.getAll(params, key, callback);
  }

  async searchArticles(text: string, limit?: number, ns?: MwNamespace): Promise<MwArticleSearchResult[]> {
    await this.login();

    const searchResults: MwArticleSearchResult[] = await new Promise((resolve, reject) => {
      // https://www.mediawiki.org/wiki/API:Search
      this.getOne(
        {
          action: "query",
          list: "search",
          srsearch: text,
          srnamespace: ns || '0',
          srprop: "timestamp",
          srlimit: limit || 15,
          srsort: 'relevance'
        },
        (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(this.getFirstItem(result));
          }
        },
      );
    });

    const artInfo: MwArticleInfo = await this.getArticleInfo(text);
    if (artInfo && !searchResults.some(x => x.pageid === artInfo.pageid)) {
      searchResults.unshift({
        ns: artInfo.ns,
        pageid: artInfo.pageid,
        title: artInfo.title,
        timestamp: artInfo.touched
      });
    }

    return searchResults;
  }

  async getArticleInfo(titleOrId: string|number, options?: any): Promise<MwArticleInfo> {
    await this.login();

    if (isEmpty(titleOrId)) {
      return null;
    }

    if (typeof titleOrId === 'string') {
      titleOrId = ucFirst(titleOrId);
    }

    const artInfoEntity: MwArticleInfoEntity = await this.db.getArticleInfoEntity(titleOrId);
    if (artInfoEntity) {
      return artInfoEntity.json;
    }

    if (!options) {
      options = {};
    }
    if (!Array.isArray(options.inprop)) {
      // If not specified, get almost everything.
      // https://www.mediawiki.org/wiki/API:Info
      options.inprop = [
        "associatedpage",
        "displaytitle",
        "notificationtimestamp",
        "protection",
        "subjectid",
        "talkid",
        "url",
        "varianttitles",
        "visitingwatchers",
        "watched",
        "watchers",
      ];
    }
    const params: any = {
      action: "query",
      prop: "info",
      inprop: options.inprop.join("|")
    };

    if (isInt(titleOrId)) {
      params.pageids = titleOrId;
    } else {
      params.titles = String(titleOrId);
    }

    if (options.intestactions && options.intestactions.length !== 0) {
      params.intestactions = options.intestactions.join("|");
    }

    const artInfo: MwArticleInfo = await (new Promise((resolve, _reject) => {
      this.getOne(
        params,
        (err, result) => {
          if (err) {
            resolve(null);
          } else {
            const item: MwArticleInfo = this.getFirstItem(this.getFirstItem(result));
            if (item.hasOwnProperty('missing')) {
              resolve(null);
            } else {
              resolve(item);
            }
          }
        },
      );
    }));

    if (artInfo && (<any> artInfo).from) {
      return this.getArticleInfo((<any> artInfo).to, options);
    }

    if (artInfo) {
      await this.db.putArticleInfoEntity(artInfo);
    }
    return artInfo;
  }

  async getArticleRevisions(by: {titles?: string, pageids?: string|number, revids?: string}): Promise<MwRevision[]> {
    await this.login();

    const params: any = {
      action: "query",
      prop: "revisions",
      rvprop: ["ids", "timestamp", "size", "flags", "comment", "user", "userid", "size"].join("|"),
      rvdir: "newer",
      rvlimit: 500,
    };

    if (by.titles) {
      params.titles = by.titles;
    }

    if (by.pageids) {
      params.pageids = by.pageids;
    }

    if (by.revids) {
      params.revids = by.revids;
      delete params.rvdir;
      delete params.rvlimit;
      params.rvprop += '|content';
    }

    return new Promise((resolve, reject) => {
      this.bot.getAll(
        params,
        (batch) => {
          const page = this.getFirstItem(batch.pages);

          return page.revisions.map((rev: MwRevision) => {
            rev.minor = typeof rev.minor === 'string';
            rev.pageid = page.pageid;
            if (rev['*']) {
              rev.content = rev['*'];
              delete rev['*'];
            }
            return rev;
          });
        },
        (error, result) => error ? reject(error) : resolve(result),
      );
    });
  }
}

export const mwGenshinClient: MwClientInterface = new MwClientInterface(mwGenshinDb, 'genshin-impact.fandom.com');
export const mwStarRailClient: MwClientInterface = new MwClientInterface(mwStarRailDb, 'honkai-star-rail.fandom.com');
export const mwZenlessClient: MwClientInterface = new MwClientInterface(mwZenlessDb, 'zenless-zone-zero.fandom.com');

export function getMwClient(siteMode: RequestSiteMode): MwClientInterface {
  switch (siteMode as string) {
    case 'genshin':
      return mwGenshinClient;
    case 'hsr':
      return mwStarRailClient;
    case 'zenless':
      return mwZenlessClient;
  }
  throw HttpError.badRequest('BadParameter', 'Bad site mode: ' + siteMode + '; expected one of: genshin, hsr, zenless');
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  //const results = await mwGenshinClient.getArticleInfo(114663);
  //console.log(results);

  console.log(await mwGenshinClient.db.hasRevision(1447742));

  await closeKnex();
}
