import { Knex } from 'knex';
import { openPg } from '../util/db.ts';
import { MwArticleInfo, MwRevision } from './mwClientInterface.ts';
import { MwOwnSegment } from './mwOwnSegmentHolder.ts';
import { isInt, toInt } from '../../shared/util/numberUtil.ts';

export type MwRevEntity = {
  pageid: number,
  revid: number,
  parentid: number,
  segments: MwOwnSegment[],
  json: MwRevision
};

export type MwArticleInfoEntity = {
  pageid: number,
  title: string,
  expires: number,
  json: MwArticleInfo,
}

export class MwDbInterface {
  readonly ARTICLE_CACHE_DURATION_MS: number = 60 * 2 * 1000; // 2 minutes

  readonly knex: Knex;
  readonly WIKI_REV_TABLE: string;
  readonly ARTICLE_CACHE_TABLE: string;

  constructor(readonly prefix: string) {
    this.knex = openPg();
    this.WIKI_REV_TABLE = prefix + 'wiki_revs';
    this.ARTICLE_CACHE_TABLE = prefix + 'wiki_article_info';
  }

  async putArticleInfoEntity(articleInfo: MwArticleInfo) {
    const entity: MwArticleInfoEntity = {
      pageid: articleInfo.pageid,
      title: articleInfo.title,
      expires: Date.now() + this.ARTICLE_CACHE_DURATION_MS,
      json: articleInfo
    };
    await this.knex(this.ARTICLE_CACHE_TABLE).insert(entity).onConflict('pageid').merge().then();
  }

  async getArticleInfoEntity(titleOrId: number|string, ignoreExpiry: boolean = false): Promise<MwArticleInfoEntity> {
    const article: MwArticleInfoEntity =
      isInt(titleOrId)
        ? await this.knex.select('*').from(this.ARTICLE_CACHE_TABLE)
          .where('pageid', toInt(titleOrId))
          .first()
          .then()
        : await this.knex.select('*').from(this.ARTICLE_CACHE_TABLE)
          .where('title', titleOrId)
          .first()
          .then();

    if (!article) {
      return null;
    }
    if (article.expires < Date.now() && !ignoreExpiry) {
      return null;
    }
    return article;
  }

  private mapEntity(revEntity: MwRevEntity): MwRevision {
    const rev: MwRevision = revEntity.json;
    rev.revid = toInt(rev.revid);
    rev.pageid = toInt(rev.pageid);
    rev.parentid = toInt(rev.parentid);
    rev.userid = toInt(rev.userid);
    rev.segments = revEntity.segments;
    return rev;
  }

  async getSavedRevisions(revids: number[]): Promise<Record<number, MwRevision>> {
    const savedRevs: Record<number, MwRevision> = {};
    const chunkSize = 100;

    for (let i = 0; i < revids.length; i += chunkSize) {
      const chunk: number[] = revids.slice(i, i + chunkSize);

      const results: MwRevEntity[] = await this.knex.select('*').from(this.WIKI_REV_TABLE)
        .whereIn('revid', chunk).then();

      for (let revEntity of results) {
        savedRevs[revEntity.revid] = this.mapEntity(revEntity);
      }
    }
    return savedRevs;
  }

  async hasRevision(revid: number): Promise<boolean> {
    const revEntity: Pick<MwRevEntity, 'revid'> = await this.knex.select('revid').from(this.WIKI_REV_TABLE)
      .where({ 'revid': revid }).first().then();
    return revEntity && toInt(revEntity.revid) === revid;
  }

  async saveRevisions(revs: MwRevision[]) {
    const knex = this.knex;
    const tableName = this.WIKI_REV_TABLE;
    await knex.transaction(function(tx) {
      return knex.batchInsert(tableName, revs.map(rev => (<MwRevEntity> {
        pageid: rev.pageid,
        revid: rev.revid,
        parentid: rev.parentid,
        segments: rev.segments,
        json: Object.assign({}, rev, {segments: undefined})
      }))).transacting(tx);
    }).then();
  }

  async fetchRevisions(pageid: number): Promise<MwRevision[]> {
    const results: MwRevEntity[] = await this.knex.select('*').from(this.WIKI_REV_TABLE)
      .where({pageid: pageid}).orderBy('revid').then();

    const savedRevs: MwRevision[] = [];
    for (let revEntity of results) {
      const rev: MwRevision = this.mapEntity(revEntity);
      savedRevs.push(rev);
    }
    return savedRevs;
  }
}

export const mwGenshinDb: MwDbInterface = new MwDbInterface('genshin_');
export const mwStarRailDb: MwDbInterface = new MwDbInterface('hsr_');
export const mwZenlessDb: MwDbInterface = new MwDbInterface('zenless_');
