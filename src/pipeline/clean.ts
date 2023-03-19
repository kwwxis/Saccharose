// Had to make this because the NPM 'rimraf' package is incredibly slow for some reason

import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distFolder = path.resolve(__dirname, '../../dist');
const envFile = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envFile });

console.log('Deleting ' + distFolder);

const execPromise = util.promisify(exec);
await execPromise('rm -rf ' + distFolder, {
  env: { PATH: process.env.SHELL_PATH },
  shell: process.env.SHELL_EXEC,
});