import '../../../loadenv.ts';
import { pathToFileURL } from 'url';
import { ScriptJob, ScriptJobState } from '../../../util/scriptJobs.ts';
import path from 'path';
import { REDIST_DIR } from '../../../loadenv.ts';
import fs from 'fs';

// Warning!!!
//   The entrypoint block below is actually part of the application and not test code!
//   This file can be programmatically executed as a separate process by the main application.
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const state: ScriptJobState<'createImageIndexArchive'> = ScriptJob.initDeleteState();

  const archiveName: string = state.result_data.archiveName;
  const archivePath: string = path.resolve(REDIST_DIR, archiveName);

  if (fs.existsSync(archivePath)) {
    fs.unlinkSync(archivePath);
    console.log('Deleted ' + archivePath);
  }
}
