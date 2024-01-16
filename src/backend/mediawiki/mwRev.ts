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
import { AsyncLog } from '../util/logger.ts';
import { MwArticleInfo, MwRevision } from '../../shared/mediawiki/mwTypes.ts';
import { getRoughSizeOfObject } from '../../shared/util/genericUtil.ts';
import { Change } from 'diff';

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
    return { page: mwPage, revisions: await mwClient.db.getSavedRevisionsByPageId(mwPage.pageid) };
  }

  // Fetch from MediaWiki API:
  // --------------------------------------------------------------------------------------------------------------
  const revsFromApi: MwRevision[] = await mwClient.getArticleRevisions({
    pageids: mwPage.pageid
  });
  await asyncLog(`Fetched page revisions; page has ${revsFromApi.length} total revisions.`);

  // Fetch from Saccharose DB:
  // --------------------------------------------------------------------------------------------------------------
  const revsFromDb: Record<number, MwRevision> = await mwClient.db.getSavedRevisions(revsFromApi.map(r => r.revid));
  await asyncLog(`Of the ${revsFromApi.length} revisions, ${Object.keys(revsFromDb).length} are already saved to database.`);

  // Determine revisions needed to be saved:
  // --------------------------------------------------------------------------------------------------------------
  const revsToSave: MwRevision[] = [];
  for (let i = 0; i < revsFromApi.length; i++) {
    const rev = revsFromApi[i];
    if (!revsFromDb[rev.revid]) {
      revsToSave.push(rev);
    }
  }

  // Save new revisions:
  // --------------------------------------------------------------------------------------------------------------
  const chunkSize = 50;
  await asyncLog(revsToSave.length + ' revisions need to be saved to the database.');

  let chunkNum: number = 0;
  const chunkTotal: number = Math.ceil(revsToSave.length / chunkSize);

  for (let i = 0; i < revsToSave.length; i += chunkSize) {
    const chunk: MwRevision[] = revsToSave.slice(i, i + chunkSize);

    await asyncLog(`Saving revision chunk ${chunkNum+1} of ${chunkTotal}`);
    const contentRevs: MwRevision[] = await mwClient.getArticleRevisions({
      revids: chunk.map(r => r.revid).join('|')
    });

    await mwClient.db.saveRevisions(contentRevs);
    chunkNum++;
  }

  // Return result:
  // --------------------------------------------------------------------------------------------------------------
  return { page: mwPage, revisions: await mwClient.db.getSavedRevisionsByPageId(mwPage.pageid) };
}

export async function computeRevSegments(client: MwClientInterface, allRevs: MwRevision[], args: ScriptJobInput<'mwRevSave'>, asyncLog: AsyncLog): Promise<void> {
  const segmentHolder: MwOwnSegmentHolder = new MwOwnSegmentHolder();

  let updateBatch: {revid: number, segmentsJSON: string}[] = [];
  const updateBatchMaxLength: number = 50;

  if (!args.resegment && allRevs.every(rev => !!rev.has_segments)) {
    await asyncLog(`All revisions already have ownership segments computed, nothing left to do for this job.`);
    return;
  }

  let prevRevContent: string = '';
  let chunkNum: number = 0;
  const chunkSize: number = 50;
  const chunkTotal: number = Math.ceil(allRevs.length / chunkSize)
  await asyncLog(`Computing ownership segments... (${allRevs.length} revs, ${chunkTotal} chunks)`);

  for (let i = 0; i < allRevs.length; i += chunkSize) {
    try {
      const chunk: MwRevision[] = Object.values(await client.db.getSavedRevisions(allRevs.slice(i, i + chunkSize).map(r => r.revid), 'content'));
      await asyncLog(`Computing ownership segments... (chunk ${chunkNum+1} of ${chunkTotal})`);

      for (let _rev of chunk) {
        const revUser: string = (' ' + _rev.user).slice(1);
        const revContent: string = (' ' + _rev.content).slice(1);
        const revSegments = _rev.segments ? JSON.parse(JSON.stringify(_rev.segments)) : null;

        try {
          if (revSegments && !args.resegment) {
            segmentHolder.setSegments(revSegments);
            continue;
          }

          console.log('Start rev:', _rev.revid);
          const revChanges: Change[] = diffIntlWithSpace(prevRevContent, revContent, {
            langCode: 'EN' // TODO use mwPage.pagelanguage
          });
          console.log('Diff done:', _rev.revid);
          segmentHolder.apply(_rev.revid, revUser, revChanges);
          console.log('End rev:', _rev.revid);

          updateBatch.push({
            revid: _rev.revid,
            segmentsJSON: JSON.stringify(segmentHolder.segments)
          });
          await flushUpdateBatch();
        } finally {
          prevRevContent = revContent;
        }
      }
    } finally {
      chunkNum++;
      await flushUpdateBatch(true);
      for (let j = i; j < i + chunkSize; j++) {
        delete allRevs[j];
      }
    }
  }

  async function flushUpdateBatch(forceFlush: boolean = false) {
    if (!updateBatch.length) {
      return;
    }
    if (forceFlush || updateBatch.length >= updateBatchMaxLength) {
      console.log('Flush start', updateBatch.length);
      await client.db.knex.transaction(async tx => {
        for (let item of updateBatch) {
          await tx(client.db.WIKI_REV_TABLE)
            .where('revid', item.revid)
            .update({
              segments: item.segmentsJSON
            });
        }
      });
      updateBatch = [];
      console.log('Flush end');
    }
  }

  await flushUpdateBatch(true);

  await asyncLog(`Finished computing all ownership segments; ${updateBatch.length} revisions needed computing, ` +
    `${allRevs.length - updateBatch.length} revisions already had segments computed.`);
}

// Warning!!!
//   The entrypoint block below is actually part of the application and not test code!
//   This file can be programmatically executed as a separate process by the main application.
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const job: ScriptJob<'mwRevSave'> = await ScriptJob.init();
  const args: ScriptJobInput<'mwRevSave'> = job.input;

  try {
    await job.log(`Started job with arguments -> PageId: ${args.pageId}; SiteMode: ${args.siteMode}; Re-segment: ${args.resegment}`);

    const client: MwClientInterface = (() => {
      if (args.siteMode === 'genshin') {
        return mwGenshinClient;
      } else if (args.siteMode === 'hsr') {
        return mwStarRailClient;
      } else if (args.siteMode === 'zenless') {
        return mwZenlessClient;
      } else {
        throw 'Unsupported site mode: ' + args.siteMode;
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
  } catch (e) {
    await job.log('Job failed!', e);
    await job.complete({
      result_error: 'Job failed due to an unhandled exception.'
    });
    await job.exit();
  }
}
