import { TextMapFullChangelog } from '../../../../shared/types/changelog-types.ts';
import { defaultMap } from '../../../../shared/util/genericUtil.ts';
import { LangCode, TextMapHash } from '../../../../shared/types/lang-types.ts';
import path from 'path';
import chalk from 'chalk';
import { fsExists, fsReadJson } from '../../../util/fsutil.ts';
import { CreateChangelogOpts } from './createChangelogUtil.ts';
import { matchSupersedesInPlace, TmSupersession } from './computeTextMapSuperseding.ts';
import { sha256 } from '../../../util/hash-util.ts';
import { importTextMapChanges } from '../../../domain/abstract/tmchanges.ts';

const EMPTY_STR: string = '';

type ResultAggregate = {
  textmapChangelog: TextMapFullChangelog,
  allRemovedHashes: Set<TextMapHash>,
  allAddedHashes: Set<TextMapHash>,
  unchangedCounter: Record<LangCode, number>,
}

async function firstPass(opts: CreateChangelogOpts): Promise<ResultAggregate> {
  console.log('Starting computing textmap change entities - first pass');

  const textmapChangelog: TextMapFullChangelog = defaultMap(langCode => ({
    langCode,
    added: {},
    removed: {},
    updated: {},
    superseded: {},
  }));

  const {
    prevDataRoot,
    currDataRoot,
    noPriorChangelog,
  } = opts;

  // First Pass
  // --------------------------------------------------------------------------------------------------------------
  const allRemovedHashes: Set<TextMapHash> = new Set();
  const allAddedHashes: Set<TextMapHash> = new Set();
  const unchangedCounter: Record<LangCode, number> = defaultMap('Zero');

  await Object.values(opts.gameSchema).asyncForEach(async schemaTable => {
    if (!schemaTable.textMapSchemaLangCode) {
      return;
    }

    // Get lang code
    // --------------------------------------------------------------------------------------------------------------
    const langCode: LangCode = schemaTable.textMapSchemaLangCode;

    // Get paths
    // --------------------------------------------------------------------------------------------------------------
    let prevFilePath: string = noPriorChangelog ? null : path.resolve(prevDataRoot, schemaTable.jsonFile).replace(/\\/g, '/');
    let currFilePath: string = path.resolve(currDataRoot, schemaTable.jsonFile).replace(/\\/g, '/');

    let prevFilePathExists: boolean = await fsExists(prevFilePath);
    let currFilePathExists: boolean = await fsExists(currFilePath);

    if (prevFilePath && !prevFilePathExists) {
      prevFilePath = prevFilePath.replace(/\/TextMap([A-Z]+)\.json/, '/Text$1.json');
      prevFilePathExists = await fsExists(prevFilePath);
    }
    if (!currFilePathExists) {
      currFilePath = currFilePath.replace(/\/TextMap([A-Z]+)\.json/, '/Text$1.json');
      currFilePathExists = await fsExists(currFilePath);
    }

    // Get previous and current data
    // --------------------------------------------------------------------------------------------------------------
    const prevData: Record<TextMapHash, string> = noPriorChangelog || !prevFilePathExists
      ? {}
      : await fsReadJson(prevFilePath);

    if (!currFilePathExists) {
      console.log('  ' + chalk.red('(Does not exist)'));
      return;
    }

    const currData: Record<TextMapHash, string> = await fsReadJson(currFilePath);

    // Gather added/removed hashes
    // --------------------------------------------------------------------------------------------------------------
    const addedHashes: Set<TextMapHash> = new Set(Object.keys(currData).filter(hash => !prevData[hash]));
    const removedHashes: Set<TextMapHash> = new Set(Object.keys(prevData).filter(hash => !currData[hash]));

    // Initialize counters
    // --------------------------------------------------------------------------------------------------------------
    let addedCount = 0;
    let removedCount = 0;
    let updatedCount = 0;
    let unchangedCount = 0;

    // Push added entries
    // --------------------------------------------------------------------------------------------------------------
    for (let addedHash of addedHashes) {
      if (EMPTY_STR !== currData[addedHash]) {
        textmapChangelog[langCode].added[addedHash] = currData[addedHash];
        addedCount++;
        allAddedHashes.add(addedHash);
      }
    }

    // Push removed entries
    // --------------------------------------------------------------------------------------------------------------
    for (let removedHash of removedHashes) {
      if (EMPTY_STR !== prevData[removedHash]) {
        textmapChangelog[langCode].removed[removedHash] = prevData[removedHash];
        removedCount++;
        allRemovedHashes.add(removedHash);
      }
    }

    // Push updated or unchanged entries
    // --------------------------------------------------------------------------------------------------------------
    for (let [textMapHash, _textMapContent] of Object.entries(currData)) {
      if (addedHashes.has(textMapHash) || removedHashes.has(textMapHash)) {
        continue;
      }
      if (currData[textMapHash] !== prevData[textMapHash]) {
        updatedCount++;
        textmapChangelog[langCode].updated[textMapHash] = {
          oldValue: prevData[textMapHash],
          newValue: currData[textMapHash],
        };
      } else {
        unchangedCount++;
        unchangedCounter[langCode]++;
      }
    }

    // Print counter values
    // --------------------------------------------------------------------------------------------------------------
    console.log('Computed change entities for TextMap' + langCode + '\n' +
      '  Added: '     + addedCount + '\n' +
      '  Removed: '   + removedCount + '\n' +
      '  Updated: '   + updatedCount + '\n' +
      '  Unchanged: ' + unchangedCount);
  });

  console.log('Finished computing textmap change entities - first pass');

  return {
    textmapChangelog,
    allAddedHashes,
    allRemovedHashes,
    unchangedCounter,
  };
}

async function secondPass(opts: CreateChangelogOpts, resultAgg: ResultAggregate) {
  console.log('Starting computing textmap change entities - second pass');

  const {
    textmapChangelog,
    allAddedHashes,
    allRemovedHashes
  } = resultAgg;

  // Second Pass
  // --------------------------------------------------------------------------------------------------------------
  const supersessions: Record<string, TmSupersession> = {};

  const initSupersession = (summary: string, enText: string) => {
    if (!supersessions[summary]) {
      supersessions[summary] = {
        enText: enText,
        removedHashes: [],
        supersedeCandidates: [],
      };
    }
  }

  for (let removedHash of allRemovedHashes) {
    let { summaryHash, enText } = tmFullChangelogHashSummaryHash(opts.langCodes, removedHash, 'removed', textmapChangelog);
    initSupersession(summaryHash, enText);
    supersessions[summaryHash].removedHashes.push(removedHash);
  }

  for (let addedHash of allAddedHashes) {
    let { summaryHash, enText } = tmFullChangelogHashSummaryHash(opts.langCodes, addedHash, 'added', textmapChangelog);
    initSupersession(summaryHash, enText);
    supersessions[summaryHash].supersedeCandidates.push(addedHash);
  }

  let supersessionCount = 0;
  let nonSupersessionRemovedHashCount = 0;
  let nonSupersessionAddedHashCount = 0;

  for (let summaryHash of Object.keys(supersessions)) {
    let supersession = supersessions[summaryHash];

    matchSupersedesInPlace(supersession);

    for (let supersedeMatch of supersession.supersedeMatches) {
      tmRemoveHash(opts.langCodes, supersedeMatch.removedHash, 'removed', textmapChangelog);
      tmRemoveHash(opts.langCodes, supersedeMatch.supersedeCandidate, 'added', textmapChangelog);
      for (let langCode of opts.langCodes) {
        textmapChangelog[langCode].superseded[supersedeMatch.removedHash] = supersedeMatch.supersedeCandidate;
      }
      supersessionCount++;
    }

    nonSupersessionRemovedHashCount += supersession.unresolvedRemovedHashes.length;
    nonSupersessionAddedHashCount += supersession.unusedSupersedeCandidates.length;

    delete supersessions[summaryHash];
  }

  console.log(`Supersession removed/added pair hash count: ${supersessionCount}`);
  console.log(`Non-supersession removed hash count: ${nonSupersessionRemovedHashCount}`);
  console.log(`Non-supersession added hash count: ${nonSupersessionAddedHashCount}`);

  console.log('Finished computing textmap change entities - second pass');
}

function reprintChangeCounts(opts: CreateChangelogOpts, resultAggregate: ResultAggregate) {
  console.log('Reprinting change counts...');
  for (let langCode of opts.langCodes) {
    console.log(`For TextMap${langCode}:`);
    console.log(`  Added:      ` + Object.keys(resultAggregate.textmapChangelog[langCode].added).length);
    console.log(`  Removed:    ` + Object.keys(resultAggregate.textmapChangelog[langCode].removed).length);
    console.log(`  Updated:    ` + Object.keys(resultAggregate.textmapChangelog[langCode].updated).length);
    console.log(`  Superseded: ` + Object.keys(resultAggregate.textmapChangelog[langCode].superseded).length);
    console.log(`  Unchanged:  ` + resultAggregate.unchangedCounter[langCode]);
  }
}

async function doImport(opts: CreateChangelogOpts, resultAgg: ResultAggregate) {
  console.log('Beginning importing textmap change entities');
  await importTextMapChanges(opts.ctrl.knex, resultAgg.textmapChangelog, opts.version);
  console.log('Finished importing textmap change entities');
}

export async function computeTextMapChanges(opts: CreateChangelogOpts) {
  console.log('-'.repeat(100));
  const resultAggregate = await firstPass(opts);

  console.log('-'.repeat(100));
  await secondPass(opts, resultAggregate);

  console.log('-'.repeat(100));
  reprintChangeCounts(opts, resultAggregate);

  console.log('-'.repeat(100));
  await doImport(opts, resultAggregate);

  console.log('-'.repeat(100));
}

function tmFullChangelogHashSummaryHash(langCodes: LangCode[],
                                        hash: TextMapHash,
                                        type: 'added' | 'removed',
                                        fullChangelog: TextMapFullChangelog): {
  summaryHash: string,
  enText: string
} {
  let parts: string[] = [];
  let enText: string;

  for (let langCode of langCodes) {
    parts.push(langCode);
    if (fullChangelog[langCode]) {
      let data: Record<TextMapHash, string> = fullChangelog[langCode][type];
      if (data[hash]) {
        parts.push(data[hash]);
        if (langCode === 'EN') {
          enText = data[hash];
        }
      }
    }
  }
  return {
    summaryHash: sha256(parts.join(';')),
    enText,
  };
}

function tmRemoveHash(langCodes: LangCode[],
                      hash: TextMapHash,
                      type: 'added' | 'removed',
                      fullChangelog: TextMapFullChangelog): void {
  for (let langCode of langCodes) {
    if (fullChangelog[langCode]) {
      let data: Record<TextMapHash, string> = fullChangelog[langCode][type];
      if (data[hash]) {
        delete data[hash];
      }
    }
  }
}

