import path, { dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import console from 'console';
import { diffIntlWithSpace } from '../util/jsIntlDiff.ts';
import { LANG_CODE_TO_LOCALE } from '../../shared/types/lang-types.ts';
import { mwGenshinClient } from './mwClientInterface.ts';
import { closeKnex } from '../util/db.ts';
import fs from 'fs';
import { MwOwnSegment, MwOwnSegmentHolder } from './mwOwnSegmentHolder.ts';
import { MwRevision } from '../../shared/mediawiki/mwTypes.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function test0() {
  const segmentHolder: MwOwnSegmentHolder = new MwOwnSegmentHolder();

  segmentHolder.setSegments([
    {value: 'The quick brown ', owner: 'UserA', mode: 'added'},
    {value: 'fox jumps over ', owner: 'UserB', mode: 'added'},
    {value: ' the lazy dog!', owner: 'UserC', mode: 'added'},
  ], true);

  console.log('1:', segmentHolder.segments);

  segmentHolder.apply('Jane', diffIntlWithSpace(
    `The quick brown fox jumps over the lazy dog!`,
    `The very quick red fox jumps over the lazy dog!`,
    {locale: LANG_CODE_TO_LOCALE['EN']}
  ));

  console.log('2:', segmentHolder.segments);
}

async function test1(pageId: number) {
  const segmentHolder: MwOwnSegmentHolder = new MwOwnSegmentHolder();

  const revs: MwRevision[] = await mwGenshinClient.db.getSavedRevisionsByPageId(pageId);

  let prevRevContent = '';

  let counter = 0;

  let lastSegments: MwOwnSegment[] = [];

  for (let rev of revs) {
    lastSegments = JSON.parse(JSON.stringify(segmentHolder.segments));

    segmentHolder.apply(rev.user, diffIntlWithSpace(prevRevContent, rev.content, {
      locale: LANG_CODE_TO_LOCALE['EN']
    }));

    if (segmentHolder.rejoin() !== rev.content) {
      //console.log(segmentHolder.segments);
      fs.writeFileSync(path.resolve(__dirname, './article_prev.wt'), prevRevContent, {encoding: 'utf-8'});
      fs.writeFileSync(path.resolve(__dirname, './article_curr.wt'), rev.content, {encoding: 'utf-8'});
      fs.writeFileSync(path.resolve(__dirname, './article_segments_prev.json'), JSON.stringify(lastSegments, null, 2),
        {encoding: 'utf-8'});
      fs.writeFileSync(path.resolve(__dirname, './article_segments_curr.json'), JSON.stringify(segmentHolder.segments, null, 2),
        {encoding: 'utf-8'});
      fs.writeFileSync(path.resolve(__dirname, './article_rejoin.wt'), segmentHolder.rejoin(), {encoding: 'utf-8'});

      const lastRevs = segmentHolder._lastRevChanges
        .filter(c => c.mode === 'added' || c.mode === 'removed');
      fs.writeFileSync(path.resolve(__dirname, './article_revs.json'), JSON.stringify(lastRevs, null, 2),
        {encoding: 'utf-8'});

      for (let rev of segmentHolder._lastRevChanges) {
        if (rev.mode === 'added') {
          continue;
        }
        if (rev.value !== prevRevContent.slice(rev.start, rev.end)) {
          console.log('Bad rev', rev);
        }
      }

      //console.log(segmentHolder.segments);
      console.log('rev:', rev.revid, 'counter:', counter, 'valid:', segmentHolder.rejoin() === rev.content, 'author:', rev.user);
      console.log('comment:', rev.comment)
      return;
    }

    prevRevContent = rev.content;
    counter++;
  }

  console.log('Success');
}

async function test2() {
  const segmentHolder: MwOwnSegmentHolder = new MwOwnSegmentHolder();
  //segmentHolder.disableInsert = true;

  const prevRevContent = fs.readFileSync(path.resolve(__dirname, './article_prev.wt'), {encoding: 'utf-8'}).trim();
  const currRevContent = fs.readFileSync(path.resolve(__dirname, './article_curr.wt'), {encoding: 'utf-8'}).trim();

  segmentHolder.setSegments(JSON.parse(fs.readFileSync(path.resolve(__dirname, './article_segments_prev.json'), {encoding: 'utf-8'})));

  segmentHolder.apply('DQueenie13', diffIntlWithSpace(prevRevContent, currRevContent, {
    locale: LANG_CODE_TO_LOCALE['EN']
  }));

  //console.log(segmentHolder.segments);
  console.log('Valid: ', segmentHolder.rejoin() === currRevContent);

  for (let rev of segmentHolder._lastRevChanges) {
    if (rev.mode === 'added') {
      continue;
    }
    if (rev.value !== prevRevContent.slice(rev.start, rev.end)) {
      console.log('Bad rev', rev);
    }
  }

  fs.writeFileSync(path.resolve(__dirname, './article_rejoin2.wt'), segmentHolder.rejoin(), {encoding: 'utf-8'});
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await mwGenshinClient.login();

  // Primordial One:
  //await getAndStoreRevisions(mwGenshinClient, 'Primordial One');
  //await getAndStoreRevisions(mwGenshinClient, 114663);

  // Timeline:
  //await getAndStoreRevisions(mwGenshinClient, 'Timeline');
  //await getAndStoreRevisions(mwGenshinClient, 12442);

  // Focalors:
  //await getAndStoreRevisions(mwGenshinClient, 'Focalors');
  //await getAndStoreRevisions(mwGenshinClient, 18598);

  // Test:
  await test1(18598);

  await closeKnex();
}
