import '../loadenv.ts';
import {
  MwClientInterface,
  mwGenshinClient,
  mwStarRailClient, mwZenlessClient,
} from './mwClientInterface.ts';
import './mwRevTest.ts';
import { pathToFileURL } from 'url';
import { ScriptJobInput, ScriptJob } from '../util/scriptJobs.ts';
import { MwOwnSegmentHolder } from './mwOwnSegmentHolder.ts';
import { diffIntlWithSpace } from '../util/jsIntlDiff.ts';
import { LANG_CODE_TO_LOCALE } from '../../shared/types/lang-types.ts';
import { AsyncLog } from '../util/logger.ts';
import { MwArticleInfo, MwRevision } from '../../shared/mediawiki/mwTypes.ts';

export async function getAndStoreRevisions(mwClient: MwClientInterface, titleOrId: string|number, asyncLog: AsyncLog): Promise<{
  page: MwArticleInfo,
  revisions: MwRevision[]
}> {
  const mwPage: MwArticleInfo = await mwClient.getArticleInfo(titleOrId);
  if (!mwPage) {
    return { page: null, revisions: [] };
  }
  await asyncLog(`Loaded article info -> PageId ${mwPage.pageid}; Title: ${mwPage.title}; LastRevId: ${mwPage.lastrevid}`)

  if (await mwClient.db.hasRevision(mwPage.lastrevid)) {
    await asyncLog('Already have all latest revisions for page saved to database; no need to fetch.');
    return { page: mwPage, revisions: await mwClient.db.getSavedRevisionsByPageId(mwPage.pageid, 'content') };
  }

  const revisions: MwRevision[] = await mwClient.getArticleRevisions({
    pageids: mwPage.pageid
  });
  await asyncLog(`Fetched page revisions; page has ${revisions.length} total revisions.`);

  // All revisions accumulator:
  const allRevs: MwRevision[] = [];

  // rev id -> revision:
  const savedRevs: Record<number, MwRevision> = await mwClient.db.getSavedRevisions(revisions.map(r => r.revid), 'content');
  await asyncLog(`Of the ${revisions.length} revisions, ${Object.keys(savedRevs).length} are already saved to database.`);

  // rev id -> revision:
  const revsToSave: Record<number, {rev: MwRevision, idx: number}> = {};

  for (let i = 0; i < revisions.length; i++) {
    const rev = revisions[i];
    if (savedRevs[rev.revid]) {
      allRevs[i] = savedRevs[rev.revid];
    } else {
      allRevs[i] = null;
      revsToSave[rev.revid] = {rev, idx: i};
    }
  }

  const chunkSize = 50;
  const revsToSaveArr = Object.values(revsToSave);
  await asyncLog(Object.keys(revsToSaveArr).length + ' revisions need to be saved to the database.');

  let chunkNum: number = 0;
  const chunkTotal: number = Math.ceil(revsToSaveArr.length / chunkSize);

  for (let i = 0; i < revsToSaveArr.length; i += chunkSize) {
    const chunk = revsToSaveArr.slice(i, i + chunkSize);

    await asyncLog(`Saving revision chunk ${chunkNum+1} of ${chunkTotal}`);
    const contentRevs: MwRevision[] = await mwClient.getArticleRevisions({
      revids: chunk.map(r => r.rev.revid).join('|')
    });

    await mwClient.db.saveRevisions(contentRevs);

    for (let rev of contentRevs) {
      const idx = revsToSave[rev.revid].idx;
      allRevs[idx] = rev;
    }

    chunkNum++;
  }

  return { page: mwPage, revisions: allRevs };
}

export async function computeRevSegments(client: MwClientInterface, allRevs: MwRevision[], args: ScriptJobInput<'mwRevSave'>, asyncLog: AsyncLog): Promise<MwOwnSegmentHolder> {
  const segmentHolder: MwOwnSegmentHolder = new MwOwnSegmentHolder();

  let prevRevContent: string = '';

  const updateBatch: {revid: number, segmentsJSON: string}[] = [];

  if (!args.resegment && allRevs.every(rev => !!rev.segments)) {
    await asyncLog(`All revisions already have ownership segments computed, nothing left to do for this job.`);
    segmentHolder.setSegments(allRevs[allRevs.length - 1].segments);
    return segmentHolder;
  }

  await asyncLog(`Computing ownership segments...`);

  let revNum = 1;
  for (let rev of allRevs) {
    try {
      if (revNum % 25 === 0 || revNum === allRevs.length) {
        await asyncLog(`Computing ownership segments... (${revNum}/${allRevs.length})`);
      }

      if (rev.segments && !args.resegment) {
        segmentHolder.setSegments(rev.segments);
        continue;
      }

      segmentHolder.apply(rev.user, diffIntlWithSpace(prevRevContent, rev.content, {
        locale: LANG_CODE_TO_LOCALE['EN'] // TODO use mwPage.pagelanguage
      }));

      rev.segments = segmentHolder.segments;
      updateBatch.push({
        revid: rev.revid,
        segmentsJSON: JSON.stringify(rev.segments)
      });
    } finally {
      prevRevContent = rev.content;
      revNum++;
    }
  }

  await asyncLog(`Finished computing ownership segments; ${updateBatch.length} revisions needed computing, ` +
    `${allRevs.length - updateBatch.length} revisions already had segments computed.`);

  if (updateBatch.length) {
    const chunkSize = 50;
    let chunkNum: number = 0;
    const chunkTotal: number = Math.ceil(updateBatch.length / chunkSize);

    await asyncLog(`Saving the new ownership segments to database... (${chunkTotal} chunks)`);

    for (let i = 0; i < updateBatch.length; i += chunkSize) {
      const chunk = updateBatch.slice(i, i + chunkSize);
      await asyncLog(`Saving ownership segment chunk ${chunkNum+1} of ${chunkTotal}`);

      await client.db.knex.transaction(function (tx) {
        return Promise.all(chunk.map(item =>
          client.db.knex(client.db.WIKI_REV_TABLE)
            .where('revid', item.revid)
            .update({
              segments: item.segmentsJSON
            })
            .transacting(tx)
        ));
      });

      chunkNum++;
    }
    await asyncLog(`Finished saving ownership segments to database.`);
  } else {
    await asyncLog(`No new ownership segments to save to database.`);
  }

  return segmentHolder;
}

// Warning!!!
//   The entrypoint block below is actually part of the application and not test code!
//   This file can be programmatically executed as a separate process by the main application.
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const job: ScriptJob<'mwRevSave'> = await ScriptJob.init();
  const args = job.input;

  await job.log(`Started job with arguments -> PageId: ${args.pageId}; SiteMode: ${args.siteMode}; Re-segment: ${args.resegment}`);

  const client: MwClientInterface = (() => {
    if (args.siteMode === 'genshin') {
      return mwGenshinClient;
    } else if (args.siteMode === 'hsr') {
      return mwStarRailClient;
    } else {
      return mwZenlessClient;
    }
  })();

  const asyncLog: AsyncLog = async (... args: any[]) => {
    await job.log(... args);
  };

  const { page, revisions } = await getAndStoreRevisions(client, args.pageId, asyncLog);
  await computeRevSegments(client, revisions, args, asyncLog);

  await job.log('Job complete!');

  await job.complete({
    result_data: {
      page
    }
  });
  await job.exit();
}
