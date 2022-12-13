import util from 'util';
import { exec, spawn } from 'child_process';
import config from '../config';

const execPromise = util.promisify(exec);

export async function passthru(command: string,
                                       stdoutStream?: (data: string) => void,
                                       stderrStream?: (data: string) => void): Promise<number|Error> {
  let stdout_endbuf = '';
  let stderr_endbuf = '';

  return new Promise((resolve, reject) => {
    const child = spawn(command, {
      env: { PATH: process.env.SHELL_PATH },
      shell: process.env.SHELL_EXEC,
      detached: true,
    });
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    if (stdoutStream) {
      child.stdout.on('data', (chunk: string) => {
        chunk = stdout_endbuf + chunk;
        stdout_endbuf = '';

        let lines = chunk.split(/\n/g);
        if (!chunk.endsWith('\n')) {
          stdout_endbuf = lines.pop();
        }
        for (let line of lines) {
          stdoutStream(line);
        }
      });
    }
    if (stderrStream) {
      child.stderr.on('data', (chunk: string) => {
        chunk = stderr_endbuf + chunk;
        stderr_endbuf = '';

        let lines = chunk.split(/\n/g);
        if (!chunk.endsWith('\n')) {
          stderr_endbuf = lines.pop();
        }
        for (let line of lines) {
          stderrStream(line);
        }
      });
    }
    child.on('error', error => {
      if (stdoutStream && stdout_endbuf)
        stdoutStream(stdout_endbuf);
      if (stderrStream && stderr_endbuf)
        stderrStream(stderr_endbuf);
      reject(error);
    });
    child.on('close', exitCode => {
      if (stdoutStream && stdout_endbuf)
        stdoutStream(stdout_endbuf);
      if (stderrStream && stderr_endbuf)
        stderrStream(stderr_endbuf);
      resolve(exitCode);
    });
  });
}

export function createGrepCommand(searchText: string, file: string, extraFlags?: string, escapeDoubleQuotes: boolean = true): string {
  if (escapeDoubleQuotes && file.endsWith('.json')) {
    searchText = searchText.replace(/"/g, `\\"`); // double quotes, assuming searching within JSON string values
  }
  searchText = searchText.replace(/'/g, `'"'"'`); // escape single quote by gluing different kinds of quotations, do this after double quote replacement

  searchText = searchText.replace(/\\/g, '\\\\\\\\');

  // Must use single quotes for searchText - double quotes has different behavior in bash, is insecure for arbitrary string...
  // Use "-F" flag (fixed strings) so it isn't interpreted as a pattern. But don't use "-F" flag if "-E" flag (extended regex) is present.
  let defaultFlags = extraFlags && extraFlags.includes('-E') ? '-i' : '-iF';
  return `grep ${defaultFlags} ${extraFlags || ''} '${searchText}' ${config.database.getGenshinDataFilePath(file)}`;
}

export async function grep(searchText: string, file: string, extraFlags?: string, escapeDoubleQuotes: boolean = true): Promise<string[]> {
  try {
    const cmd = createGrepCommand(searchText, file, extraFlags, escapeDoubleQuotes);
    const { stdout, stderr } = await execPromise(cmd, {
      env: { PATH: process.env.SHELL_PATH },
      shell: process.env.SHELL_EXEC,
    });
    return stdout.split(/\n/).map(s => s.trim()).filter(x => !!x);
  } catch (err) {
    if (err && err.code === 1) {
      return []; // exit code of 1 is no matches found - not an error for our use case
    } else if (err && err.code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER') {
      throw 'Max buffer reached (too many results).';
    } else {
      throw 'Text map search error.';
    }
  }
}

export async function grepStream(searchText: string, file: string, stream: (line: string) => void, extraFlags?: string): Promise<number|Error> {
  const cmd = createGrepCommand(searchText, file, extraFlags);
  return await passthru(cmd, stream);
}

export async function grepIdStartsWith(idProp: string, idPrefix: number | string, file: string): Promise<(number | string)[]> {
  let isInt = typeof idPrefix === 'number';
  let grepSearchText = `"${idProp}": ${isInt ? idPrefix : '"' + idPrefix}`;
  let lines = await grep(grepSearchText, file, null, false);
  let out = [];
  for (let line of lines) {
    let parts = /":\s+"?([^",$]+)/.exec(line);
    out.push(isInt ? parseInt(parts[1]) : parts[1]);
  }
  return out;
}