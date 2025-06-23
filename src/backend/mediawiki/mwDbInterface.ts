import { Knex } from 'knex';
import { openPgSite } from '../util/db.ts';
import { MwOwnSegment } from './mwOwnSegmentHolder.ts';
import { isInt, toInt } from '../../shared/util/numberUtil.ts';
import { MwArticleInfo, MwRevision, MwRevLoadMode } from '../../shared/mediawiki/mwTypes.ts';
import { isNotEmpty } from '../../shared/util/genericUtil.ts';
import { diffIntlWithSpace } from '../util/jsIntlDiff.ts';
import { createPatch } from '../util/jsdiff/jsdiff.js';

export type MwRevEntity = {
  pageid: number,
  revid: number,
  parentid: number,
  segments: MwOwnSegment[],
  has_segments?: boolean,
  json: MwRevision
};

export type MwArticleInfoEntity = {
  pageid: number,
  title: string,
  expires: number,
  json: MwArticleInfo,
}

export class MwDbInterface {
  readonly ARTICLE_CACHE_DURATION_MS: number = 1000 * 60 * 10; // 10 minutes

  readonly knex: Knex;
  readonly WIKI_REV_TABLE: string;
  readonly ARTICLE_CACHE_TABLE: string;

  constructor(readonly prefix: string) {
    this.knex = openPgSite();
    this.WIKI_REV_TABLE = prefix + 'wiki_revs';
    this.ARTICLE_CACHE_TABLE = prefix + 'wiki_article_info';
  }

  async putArticleInfoEntity(articleInfo: MwArticleInfo): Promise<MwArticleInfoEntity> {
    const entity: MwArticleInfoEntity = {
      pageid: articleInfo.pageid,
      title: articleInfo.title,
      expires: Date.now() + this.ARTICLE_CACHE_DURATION_MS,
      json: articleInfo
    };
    await this.knex(this.ARTICLE_CACHE_TABLE).insert(entity).onConflict('pageid').merge().then();
    return entity;
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
    if (article.json) {
      article.json.cacheExpiry = article.expires;
    }
    if (article.expires < Date.now() && !ignoreExpiry) {
      return null;
    }
    return article;
  }

  private async mapEntity(revEntity: MwRevEntity, loadMode?: MwRevLoadMode): Promise<MwRevision> {
    if (!revEntity || !revEntity.json) {
      return null;
    }
    const rev: MwRevision = revEntity.json;
    rev.revid = toInt(rev.revid);
    rev.pageid = toInt(rev.pageid);
    rev.parentid = toInt(rev.parentid);
    rev.userid = toInt(rev.userid);
    rev.has_segments = revEntity.has_segments || false;

    if (loadMode === 'content' || loadMode === 'contentAndPrev') {
      rev.segments = revEntity.segments;
    } else {
      delete rev.content;
    }

    if (loadMode === 'contentAndPrev' && isNotEmpty(rev.parentid) && isInt(rev.parentid) && rev.parentid !== 0) {
      const prev = await this.getSavedRevision(rev.parentid, 'content');
      rev.prevContent = prev.content;
      rev.prevDiff = diffIntlWithSpace(prev.content, rev.content, {
        langCode: 'EN' // TODO support other languages
      });
      rev.prevSize = prev.size;
      rev.unifiedDiff = createPatch(`Rev #${rev.revid}`, rev.prevContent, rev.content);
    }

    return rev;
  }

  private revisionCols(loadMode?: MwRevLoadMode): (string|Knex.Raw)[] {
    const mainCols: (string|Knex.Raw)[] = ['pageid', 'revid', 'parentid', 'json'];
    if (loadMode === 'content' || loadMode === 'contentAndPrev') {
      mainCols.push('segments');
    }
    mainCols.push(
      this.knex.raw(`segments is not null as has_segments`)
    );
    return mainCols;
  }

  async getSavedRevision(revid: number|string, loadMode?: MwRevLoadMode): Promise<MwRevision> {
    if (!isInt(revid)) {
      return null;
    }
    revid = toInt(revid);
    const result = await this.knex.select(this.revisionCols(loadMode)).from(this.WIKI_REV_TABLE)
      .where('revid', revid).first().then();
    return await this.mapEntity(result, loadMode);
  }

  async getSavedRevisions(revids: number[], loadMode?: MwRevLoadMode): Promise<Record<number, MwRevision>> {
    const savedRevs: Record<number, MwRevision> = {};
    const chunkSize = 100;

    for (let i = 0; i < revids.length; i += chunkSize) {
      const chunk: number[] = revids.slice(i, i + chunkSize);

      const results: MwRevEntity[] = await this.knex.select(this.revisionCols(loadMode)).from(this.WIKI_REV_TABLE)
        .whereIn('revid', chunk).then();

      await results.asyncMap(async revEntity => {
        savedRevs[revEntity.revid] = await this.mapEntity(revEntity, loadMode);
      });
    }
    return savedRevs;
  }

  async getSavedRevisionsByPageId(pageid: number, loadMode?: MwRevLoadMode): Promise<MwRevision[]> {
    const results: MwRevEntity[] = await this.knex.select(this.revisionCols(loadMode)).from(this.WIKI_REV_TABLE)
      .where({pageid: pageid}).orderBy('revid').then();

    const savedRevs: MwRevision[] = [];
    for (let revEntity of results) {
      const rev: MwRevision = await this.mapEntity(revEntity, loadMode);
      savedRevs.push(rev);
    }
    return savedRevs;
  }

  async hasRevision(revid: number, withSegments: boolean = false): Promise<boolean> {
    const revEntity: Pick<MwRevEntity, 'revid' | 'segments'> = await this.knex.select('revid', 'segments').from(this.WIKI_REV_TABLE)
      .where({ 'revid': revid }).first().then();
    return revEntity && toInt(revEntity.revid) === revid && (!withSegments || !!revEntity.segments);
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
}

export const mwGenshinDb: MwDbInterface = new MwDbInterface('genshin_');
export const mwStarRailDb: MwDbInterface = new MwDbInterface('hsr_');
export const mwZenlessDb: MwDbInterface = new MwDbInterface('zenless_');
export const mwWuwaDb: MwDbInterface = new MwDbInterface('wuwa_');
