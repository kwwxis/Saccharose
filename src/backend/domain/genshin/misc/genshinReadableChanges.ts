import { GenshinControl } from '../genshinControl.ts';
import { GameVersion, GameVersions } from '../../../../shared/types/game-versions.ts';
import path from 'path';
import { fsRead, fsWalkAsync } from '../../../util/fsutil.ts';
import { Knex } from 'knex';
import {
  ReadableChange,
  ReadableChangeEntity,
  ReadableContentEntity,
} from '../../../../shared/types/changelog-types.ts';
import { LangCode } from '../../../../shared/types/lang-types.ts';
import { sha256 } from '../../../util/hash-util.ts';
import fs from 'fs';

/**
 * Fetch readable changes (with content) for a given locPath.
 * If `version` is provided, only fetch that version.
 */
export async function getReadableChanges(
  db: Knex,
  locPath: string,
  version?: string
): Promise<ReadableChange[]> {
  const rows = await db("readable_changes as rc")
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
    .modify((qb) => {
      if (version) {
        qb.andWhere("rc.version", version);
      }
    });

  // Map DB rows -> camelCase ReadableChange
  return rows.map((r) => ({
    langCode: r.lang_code,
    name: r.name,
    locPath: r.loc_path,
    version: r.version,
    contentHash: r.content_hash,
    contentText: r.content_text,
  }));
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

  const BATCH_SIZE = 100;

  await ctrl.knex.transaction(async (trx) => {
    const contentBatches = chunk(contents, BATCH_SIZE);
    const changeBatches = chunk(changes, BATCH_SIZE);

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
