import '../../../loadenv.ts';
import { pathToFileURL } from 'url';
import { ScriptJob, ScriptJobInput } from '../../../util/scriptJobs.ts';
import Seven from 'node-7z';
import SevenBin from '7zip-bin';
import { AbstractControl } from '../abstractControl.ts';
import { getGenshinControl } from '../../genshin/genshinControl.ts';
import { getWuwaControl } from '../../wuwa/wuwaControl.ts';
import { getZenlessControl } from '../../zenless/zenlessControl.ts';
import { getStarRailControl } from '../../hsr/starRailControl.ts';
import { ImageIndexSearchResult } from '../../../../shared/types/image-index-types.ts';
import { REDIST_DIR } from '../../../loadenv.ts';
import path from 'path';
import fs, { promises as fsp } from 'fs';
import { arraySum } from '../../../../shared/util/arrayUtil.ts';
import { getRandomInt } from '../../../../shared/util/genericUtil.ts';

const ONE_GB = 1_000_000_000;
const ONE_MB = 1_000_000;
const MAX_COMBINED_SIZE = ONE_GB;

const TMP_DIR = ENV.TMP_DIR;

async function doJob(job: ScriptJob<'createImageIndexArchive'>,
                     args: ScriptJobInput<'createImageIndexArchive'>) {
  const zipDir: string = TMP_DIR + "/" + args.siteMode + '-media-export.' + job.jobId;
  try {
    await job.log(`[Info] Started job with arguments -> SiteMode: ${args.siteMode}; SearchParams: ${JSON.stringify(args.searchParams)}`);

    const abstractControl: AbstractControl = (() => {
      switch (args.siteMode) {
        case 'genshin':
          return getGenshinControl();
        case 'hsr':
          return getStarRailControl();
        case 'zenless':
          return getZenlessControl();
        case 'wuwa':
          return getWuwaControl();
        default:
          throw 'Bad siteMode: ' + args.siteMode;
      }
    })();

    const IMAGES_DIR: string = (() => {
      switch (args.siteMode) {
        case 'genshin':
          return ENV.EXT_GENSHIN_IMAGES;
        case 'hsr':
          return ENV.EXT_HSR_IMAGES;
        case 'zenless':
          return ENV.EXT_ZENLESS_IMAGES;
        case 'wuwa':
          return ENV.EXT_WUWA_IMAGES;
        default:
          throw 'Bad siteMode: ' + args.siteMode;
      }
    })();

    await job.log('[Search] Searching image index...');

    const searchResult: ImageIndexSearchResult = await abstractControl.searchImageIndex(args.searchParams);

    const combinedImageSize: number = arraySum(searchResult.results.map(r => r.image_size));
    let combinedImageSizeLabel: string;
    if (combinedImageSize > ONE_GB) {
      combinedImageSizeLabel = (combinedImageSize / ONE_GB).toFixed(2) + ` GB (${combinedImageSize} bytes)`;
    } else if (combinedImageSize > ONE_MB) {
      combinedImageSizeLabel = (combinedImageSize / ONE_MB).toFixed(2) + ` MB (${combinedImageSize} bytes)`;
    } else {
      combinedImageSizeLabel = (combinedImageSize / 1000).toFixed(2) + ` KB (${combinedImageSize} bytes)`;
    }

    await job.log(`[Search] Searching image index is complete with ${searchResult.results.length} results ` +
      `(combined pre-zipped size: ${combinedImageSizeLabel}).`);
    if (combinedImageSize > MAX_COMBINED_SIZE) {
      await job.complete({
        result_error: `Combined pre-zipped size is too big! Max allowed size is 1 GB. Try again with a more narrow search query.`
      });
      return;
    }

    const archiveName = args.siteMode + '-media-export.' + job.jobId + '.7z';
    const archivePath = path.resolve(REDIST_DIR, archiveName);

    await job.log('[Preparation] Starting...');
    fs.mkdirSync(zipDir);

    let prepComplete: number = 0;
    let prepPercentSeen: Set<number> = new Set();
    let prepLastPercentLog: number = 0;

    await Promise.all(searchResult.results.map(result => {
      const srcPath = IMAGES_DIR + '/' + result.image_name + '.png';
      const destPath = zipDir + '/' + result.image_name + '.png';

      if (result.image_name.includes('/')) {
        const destDir = path.dirname(destPath);
        fs.mkdirSync(destDir, { recursive: true })
      }

      return fsp.copyFile(srcPath, destPath).catch(_ignore => {
        return Promise.resolve();
      }).then(() => {
        prepComplete++;
        const prepPercent = (prepComplete / searchResult.results.length) * 100 | 0;
        if (!prepPercentSeen.has(prepPercent)) {
          prepPercentSeen.add(prepPercent);

          if (prepPercent === 100 || (Date.now() - prepLastPercentLog) > getRandomInt(300,800)) {
            job.log(`[Preparation] In progress... ${prepPercent}%`);
            prepLastPercentLog = Date.now();
          }
        }
      });
    }));

    if (!prepPercentSeen.has(100)) {
      prepPercentSeen.add(100);
      await job.log(`[Preparation] In Progress... 100%`);
    }

    await job.log('[Preparation] Complete.');

    await job.log('[Archive] Starting...');

    let progressSeen: Set<number> = new Set();

    await new Promise<void>((resolve, reject) => {
      const stream7 = Seven.add(archivePath, `${zipDir}/*`, {
        $progress: true,
        $bin: SevenBin.path7za
      });

      stream7.on('progress', async (progress: Seven.Progress) => {
        if (!progressSeen.has(progress.percent)) {
          progressSeen.add(progress.percent);
          await job.log(`[Archive] Zipping... ${progress.percent}%`);
        }
      });

      stream7.on('error', async (err) => {
        await job.log('[Archive] Error:', err);
        console.error(err);
      });

      stream7.on('end', async () => {
        await job.log('[Archive] Ended');
        resolve();
      });
    });

    if (!progressSeen.has(100)) {
      progressSeen.add(100);
      await job.log(`[Archive] Zipping... 100%`);
    }

    await job.log('[Info] Job complete!');
    await job.log('[Info] Archive name: ' + archiveName);

    let statResult: fs.Stats = null;
    try {
      statResult = fs.statSync(archivePath);
    } catch (ignore) {}

    await job.complete({
      result_data: {
        archiveName,
        archiveStat: statResult,
      }
    });
  } catch (e) {
    await job.log('[Info] Job failed!', e);
    await job.complete({
      result_error: 'Job failed due to an unhandled exception.'
    });
  } finally {
    try {
      fs.rmSync(zipDir, { recursive: true });
    } catch (e) {}
    await job.exit();
  }
}

// Warning!!!
//   The entrypoint block below is actually part of the application and not test code!
//   This file can be programmatically executed as a separate process by the main application.
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const job: ScriptJob<'createImageIndexArchive'> = await ScriptJob.init();
  await doJob(job, job.input);
}
