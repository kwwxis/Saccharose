import { GenshinControl, getGenshinControl } from '../genshinControl.ts';
import { GameVersion } from '../../../../shared/types/game-versions.ts';
import path from 'path';
import { fsRead, fsWalkAsync } from '../../../util/fsutil.ts';
import {
  ReadableChange,
  ReadableChangedLocPath,
  ReadableChangeEntity, ReadableChangeRange, ReadableChanges,
  ReadableContentEntity,
} from '../../../../shared/types/changelog-types.ts';
import { LangCode } from '../../../../shared/types/lang-types.ts';
import { sha256 } from '../../../util/hash-util.ts';
import fs from 'fs';
import { pathToFileURL } from 'url';
import { closeKnex } from '../../../util/db.ts';


function createReadableChanges(ctrl: GenshinControl, langCode: LangCode, inputList: ReadableChange[]): ReadableChanges {
  const ret: ReadableChanges = {
    list: [],
    byVersionNumber: {},
    langCode: langCode,
    ranges: []
  };

  for (let r of inputList) {
    ret.byVersionNumber[r.version] = r;
  }

  for (let v of ctrl.gameVersions.list) {
    if (ret.byVersionNumber[v.number]) {
      ret.list.push(ret.byVersionNumber[v.number]);
    }
  }

  if (!ret.list.length) {
    return ret;
  }

  const startNewRange = (startingAt: ReadableChange, previous?: ReadableChange): ReadableChangeRange => {
    const gameVersion = ctrl.gameVersions.get(startingAt.version);
    return {
      startVersion: gameVersion,
      endVersion:   gameVersion,
      contentText:  startingAt.contentText,
      contentHash:  startingAt.contentHash,
      prevContentVersion: ctrl.gameVersions.get(previous?.version) || gameVersion.prev(),
      prevContentText: previous?.contentText || '',
    };
  };

  let currentRange: ReadableChangeRange = startNewRange(ret.list[0]);
  let prevChange: ReadableChange = ret.list[0];

  for (let change of ret.list.slice(1)) {
    if (change.contentHash !== currentRange.contentHash) {
      // Start of a new range
      ret.ranges.push(currentRange);
      currentRange = startNewRange(change, prevChange);
    } else {
      // Continuing current range
      currentRange.endVersion = ctrl.gameVersions.get(change.version);
    }
    prevChange = change;
  }

  ret.ranges.push(currentRange);

  return ret;
}


export class ReadableChangesCtrl {

  constructor(readonly ctrl: GenshinControl) {}

  public async getReadableChanges(langCode: LangCode, locPath: string): Promise<ReadableChanges> {
    const rows: ReadableChange[] = await this.ctrl.knex("readable_changes as rc")
      .join("readable_content as rct", function () {
        this.on("rc.loc_path", "=", "rct.loc_path").andOn(
          "rc.content_hash",
          "=",
          "rct.content_hash"
        );
      })
      .select(
        "rc.lang_code",
        "rc.name",
        "rc.loc_path",
        "rc.version",
        "rc.content_hash",
        "rct.content_text"
      )
      .where("rc.loc_path", locPath)
      .then(rows => rows.map((r) => ({
        langCode: r.lang_code,
        name: r.name,
        locPath: r.loc_path,
        version: r.version,
        contentHash: r.content_hash,
        contentText: r.content_text,
      })));

    return createReadableChanges(this.ctrl, langCode, rows);
  }

  /**
   * Get all loc_paths where content changed between two versions,
   * including both old and new content_hashes.
   */
  async getChangedLocsWithHashes(
    oldVersion: string,
    newVersion: string,
    langCode?: LangCode
  ): Promise<ReadableChangedLocPath[]> {
    if (!oldVersion) {
      return [];
    }

    const query = this.ctrl.knex("readable_changes as old")
      .join("readable_changes as new", "old.loc_path", "new.loc_path")
      .where("old.version", oldVersion)
      .andWhere("new.version", newVersion)
      .andWhereNot("old.content_hash", this.ctrl.knex.ref("new.content_hash"))
      .select({
        locPath: "old.loc_path",
        langCode: "old.lang_code",
        name: "old.name",
        oldContentHash: "old.content_hash",
        newContentHash: "new.content_hash",
      });

    if (langCode) {
      query.andWhere("old.lang_code", langCode).andWhere("new.lang_code", langCode);
    }

    return query;
  }
}

/** Utility function: split an array into chunks of given size */
function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

async function importForVersion(ctrl: GenshinControl, version: GameVersion) {
  const DIR: string = path.resolve(ENV.GENSHIN_ARCHIVES, `./${version.number}/Readable`);
  if (!fs.existsSync(DIR)) {
    return;
  }

  const changes: ReadableChangeEntity[] = [];
  const contents: ReadableContentEntity[] = [];

  console.log();
  console.log(`[${version.number}] Gathering entities...`);
  for await (let filePath of fsWalkAsync(DIR)) {
    if (!filePath.endsWith('.txt')) {
      continue;
    }

    const locPath: string = path.relative(DIR, filePath)
      .replace(/\\/g, '/')
      .slice(0, -4); // remove ".txt"

    const [langCode, name] = locPath.split('/');

    const contentText: string = await fsRead(filePath);
    const contentHash: string = sha256(contentText);

    changes.push({
      loc_path: locPath,
      lang_code: langCode as LangCode,
      name: name,
      version: version.number,
      content_hash: contentHash,
    });

    contents.push({
      loc_path: locPath,
      content_hash: contentHash,
      content_text: contentText,
    });
  }

  const CHANGES_BATCH_SIZE = 1000;
  const CONTENTS_BATCH_SIZE = 500;

  await ctrl.knex.transaction(async (trx) => {
    const contentBatches = chunk(contents, CONTENTS_BATCH_SIZE);
    const changeBatches = chunk(changes, CHANGES_BATCH_SIZE);

    // Insert contents (ignore on conflict)
    let batchNum = 0;
    for (const batch of contentBatches) {
      batchNum++;
      await trx("readable_content")
        .insert(batch)
        .onConflict(["loc_path", "content_hash"])
        .ignore();
      console.log(`[${version.number}] Content batch ${batchNum}/${contentBatches.length}`);
    }

    // Insert changes (merge on conflict)
    batchNum = 0;
    for (const batch of changeBatches) {
      batchNum++;
      await trx("readable_changes")
        .insert(batch)
        .onConflict(["loc_path", "version"])
        .merge(["lang_code", "name", "content_hash"]);
      console.log(`[${version.number}] Change batch ${batchNum}/${changeBatches.length}`);
    }
  });
}

export async function importGenshinReadableChanges(ctrl: GenshinControl, versionTarget: string) {
  console.log('Starting...');
  console.log('Inserting to target database on ' + ENV.POSTGRES_GAMEDATA_HOST);
  console.log();

  if (versionTarget === 'ALL') {
    for (let version of ctrl.gameVersions.list) {
      await importForVersion(ctrl, version);
    }
  } else {
    const version = ctrl.gameVersions.get(versionTarget);
    if (version) {
      await importForVersion(ctrl, version);
    } else {
      throw new Error(`Not a valid version: ${version}`);
    }
  }

  console.log();
  console.log('All complete');
}


if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const ctrl = getGenshinControl();

  const results = await ctrl.readableChanges.getChangedLocsWithHashes('5.8', '6.0');

  inspect(results);

  await closeKnex();
}
