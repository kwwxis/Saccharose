import util from 'util';
import { exec, execSync, spawn } from 'child_process';
import { getGenshinDataFilePath, PIPELINE_DIR } from '../loadenv';
import { pathToFileURL } from 'url';
import treeKill from 'tree-kill';
import { isPromise, isset } from '../../shared/util/genericUtil';
import { toInt } from '../../shared/util/numberUtil';
import { splitLimit } from '../../shared/util/stringUtil';
import path from 'path';
import { sort } from '../../shared/util/arrayUtil';

const execPromise = util.promisify(exec);

/**
 * Streams the output of the command on a line-by-line basis.
 *
 * Since this is a stream, it should not run into out-of-memory issues unless there is an extremely long line in
 * the command output.
 *
 * @param command The command to execute in the bash shell.
 * @param stdoutLineStream Stream method for stdout.
 * @param stderrLineStream Stream method for stderr.
 */
export async function passthru(command: string,
                                       stdoutLineStream?: (data: string, kill?: () => void) => Promise<void>|void,
                                       stderrLineStream?: (data: string, kill?: () => void) => Promise<void>|void): Promise<number|Error> {
  const partial_line_buffer = {
    stdout: '',
    stderr: '',
  };

  let didKill: boolean = false;

  const callback_promises: Promise<void>[] = [];

  const create_chunk_listener = (buffer_name: 'stdout' | 'stderr', stream_method: (data: string, kill?: () => void) => Promise<void>|void, killFn: () => void) => {
    return (chunk: string) => {
      if (didKill) {
        return;
      }

      // The chunk is an arbitrary string from the output of the command, it can start at any point and end at any point.
      // However, we want to send data to the output method on a line-by-line basis.

      // Append any data left in the buffer to the start of the chunk, and then clear the buffer.
      chunk = partial_line_buffer[buffer_name] + chunk;
      partial_line_buffer[buffer_name] = '';

      if (!chunk.includes('\n')) {
        // If the chunk did not contain any new lines, that means there's no new lines to send to the output method.
        // So just save the entire chunk into the buffer and wait for the next chunk.
        partial_line_buffer[buffer_name] = chunk;
        return;
      }

      // Split the chunk into lines.
      let lines = chunk.split(/\n/g);

      // If the chunk ended with a new line, then there's no need to add to the partial line buffer.
      // But if the chunk did not end with a new line, that means the chunk ends with an incomplete line, so we do not
      // want to send that line to the output method yet.
      // Instead, we pop off that last line and put it into the partial line buffer so that the line can be completed
      // by the next chunk(s).
      if (!chunk.endsWith('\n')) {
        partial_line_buffer[buffer_name] = lines.pop();
      }

      for (let line of lines) {
        if (didKill) {
          return;
        }
        let ret = stream_method(line, killFn);
        if (isPromise(ret)) {
          callback_promises.push(ret);
        }
      }
    };
  };

  return new Promise((resolve, reject) => {
    //console.log('Command:', command);
    const child = spawn(command, {
      env: { PATH: process.env.SHELL_PATH },
      shell: process.env.SHELL_EXEC,
      detached: true,
    });

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');

    const killFn = () => {
      // Pausing the stdout and sending the kill signal doesn't really seem to work.
      // so set didKill = true so the stream callback isn't called anymore even if the command is still running.
      child.stdout.pause();
      child.stderr.pause();
      treeKill(child.pid);
      didKill = true;
    };

    const flush_partial_line_buffer = () => {
      // Once the shell stream closes, send any data still left in the partial line buffers to the output methods.

      if (didKill) {
        return;
      }

      let ret1: Promise<void>|void, ret2: Promise<void>|void;

      if (stdoutLineStream && partial_line_buffer.stdout)
        ret1 = stdoutLineStream(partial_line_buffer.stdout, killFn);
      if (stderrLineStream && partial_line_buffer.stderr)
        ret2 = stderrLineStream(partial_line_buffer.stderr, killFn);

      if (isPromise(ret1))
        callback_promises.push(ret1);
      if (isPromise(ret2))
        callback_promises.push(ret2);

      partial_line_buffer.stdout = '';
      partial_line_buffer.stderr = '';
    };

    if (stdoutLineStream) {
      const listener = create_chunk_listener('stdout', stdoutLineStream, killFn);
      child.stdout.on('data', listener);
    }

    if (stderrLineStream) {
      const listener = create_chunk_listener('stderr', stderrLineStream, killFn);
      child.stderr.on('data', listener);
    }

    child.on('error', error => {
      console.error('\x1b[4m\x1b[1mshell error:\x1b[0m\n', error);
      flush_partial_line_buffer();
      Promise.all(callback_promises).then(() => reject(error));
    });

    child.on('close', exitCode => {
      flush_partial_line_buffer();
      Promise.all(callback_promises).then(() => resolve(exitCode));
    });
  });
}

/**
 * Escape a string to be used as the argument to a command.
 */
export function shellEscapeArg(s: string, prefix: string = '', suffix: string = ''): string {
  s = s.replace(/\x00+/g, '');
  s = s.replace(/\b/g, '');

  s = s.replace(/'+/g, m => `'"${m}"'`);

  s = s.replace(/\n/g, '\\\\n');
  s = s.replace(/\r/g, '\\\\r');
  s = s.replace(/\f/g, '\\\\f');
  s = s.replace(/\t/g, '\\\\t');
  s = s.replace(/\v/g, '\\\\v');

  return `'` + prefix + s + suffix + `'`;
}

export class ShellFlags {
  private map: Map<string, string>;

  private constructor(map?: Map<string, string>) {
    this.map = map || new Map<string, string>();
  }

  merge(flags: ShellFlags): this {
    for (let [flag, value] of flags.entries()) {
      this.map.set(flag, value);
    }
    return this;
  }

  getFlagValue(flag: string): string {
    return this.map.get(flag);
  }

  has(flag: string): boolean {
    if (!flag.startsWith('-')) {
      throw 'Flag should start with "-" or "--", instead got "' + flag + '"';
    }
    return this.map.has(flag);
  }

  set(flag: string, value?: string): void {
    if (!flag.startsWith('-')) {
      throw 'Flag should start with "-" or "--", instead got "' + flag + '"';
    }
    this.map.set(flag, value || '');
  }

  add(flags: string) {
    this.merge(ShellFlags.parseFlags(flags));
  }

  remove(flag: string): boolean {
    if (!flag.startsWith('-')) {
      throw 'Flag should start with "-" or "--", instead got "' + flag + '"';
    }
    return this.map.delete(flag);
  }

  keys() {
    return this.map.keys();
  }

  values() {
    return this.map.values();
  }

  entries() {
    return this.map.entries();
  }

  get size(): number {
    return this.map.size;
  }

  stringify(): string {
    return ShellFlags.stringifyFlags(this);
  }

  static parseFlags(flags: string): ShellFlags {
    if (!flags) {
      return new ShellFlags();
    }
    let out: Map<string, string> = new Map<string, string>();
    let curr: string;
    for (let arg of flags.split(/(\s+)/g)) {
      if (arg.startsWith('--')) {
        out.set(curr = arg, '');
      } else if (arg.startsWith('-')) {
        [... arg.slice(1)].forEach(a => out.set(curr = ('-'+a), ''));
      } else if (curr) {
        out.set(curr, out.get(curr) + arg);
      }
    }
    for (let flag of out.keys()) {
      out.set(flag, out.get(flag).trim());
    }
    return new ShellFlags(out);
  }

  static stringifyFlags(flags: ShellFlags): string {
    if (!flags || !flags.size) {
      return '';
    }

    let flagsWithValues = [];
    let doubles = [];
    let singles = '';

    for (let flag of flags.keys()) {
      if (!!flags.getFlagValue(flag)) {
        flagsWithValues.push(flag + ' ' + flags.getFlagValue(flag));
      } else if (flag.startsWith('--')) {
        doubles.push(flag);
      } else if (flag.startsWith('-')) {
        singles += flag.slice(1);
      }
    }
    if (singles) {
      return [... flagsWithValues, ... doubles, '-' + singles].join(' ');
    } else {
      return [... flagsWithValues, ... doubles].join(' ');
    }
  }
}

function createGrepCommand(searchText: string, absoluteFilePath: string, extraFlags?: string,
                                  escapeDoubleQuotes: boolean = true, startFromLine?: number): { line: string, flags: ShellFlags } {
  let flags: ShellFlags = ShellFlags.parseFlags(extraFlags);

  if (escapeDoubleQuotes && absoluteFilePath.endsWith('.json')) {
    searchText = searchText.replace(/"/g, `\\"`); // double quotes, assuming searching within a JSON string value
  }

  searchText = shellEscapeArg(searchText);

  let hasRegexFlag: boolean = flags.has('-E') || flags.has('-P') || flags.has('-G');
  if (!hasRegexFlag) {
    flags.set('-F');
  } else {
    searchText = searchText.replace(/\\n/g, '(\\\\\\\\n)');
  }
  if (isset(startFromLine)) {
    flags.remove('-H');
    flags.remove('--with-filename');
  }

  // Command format:
  //   {envVars} grep {flags} -- {searchText} {file}

  let env = `LC_ALL=en_US.utf8 `;
  let grepCmd = `${env}grep ${flags.stringify()} -- ${searchText}`;

  if (isset(startFromLine)) {
    // In order to grep on standard input (i.e. grep from the output of tail), the file of the grep command must be "-"
    //
    // From https://man7.org/linux/man-pages/man1/grep.1.html
    // >  A FILE of “-” stands for standard input.  If no FILE is given,
    // >       recursive searches examine the working directory, and
    // >       non-recursive searches read standard input.
    return { line: `tail -n +${startFromLine} ${absoluteFilePath} | ${grepCmd} -`, flags: flags };
  } else {
    return { line: `${grepCmd} ${absoluteFilePath}`, flags: flags };
  }
}

export async function getLineNumberForLineText(lineText: string,
                                               absoluteFilePath: string) {
  const matches = await grep(lineText, absoluteFilePath, '-n', false);
  for (let match of matches) {
    if (!match)
      continue;

    let lineNum = toInt(match.split(':', 2)[0]);
    if (isNaN(lineNum))
      continue;

    let matchText = splitLimit(match, ':', 2)[1];
    if (matchText === lineText) {
      return lineNum;
    }
  }
  return -1;
}

export async function grep(searchText: string,
                           absoluteFilePath: string,
                           flags?: string,
                           escapeDoubleQuotes: boolean = true,
                           startFromLine?: number): Promise<string[]> {
  try {
    const cmd = createGrepCommand(searchText, absoluteFilePath, flags, escapeDoubleQuotes, startFromLine);
    //console.log('Command:', cmd.line);

    // noinspection JSUnusedLocalSymbols
    const { stdout, stderr } = await execPromise(cmd.line, {
      env: { PATH: process.env.SHELL_PATH },
      shell: process.env.SHELL_EXEC,
    });

    const hasLineNumFlag = cmd.flags.has('-n') || cmd.flags.has('--line-number');
    return stdout.split(/\n/)
      .map(s => {
        s = s.trim();
        if (hasLineNumFlag && isset(startFromLine)) {
          s = s.replace(/^(\d+):/, (fm, stdoutLineNum) => (parseInt(stdoutLineNum) + startFromLine - 1) + ':');
        }
        return s;
      })
      .filter(x => !!x);
  } catch (err) {
    if (err && err.code === 1) {
      return []; // exit code of 1 is no matches found - not an error for our use case
    } else if (err && err.code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER') {
      throw 'Max buffer reached (too many results).';
    } else {
      console.error('\x1b[4m\x1b[1mshell error:\x1b[0m\n', err);
      const parsedFlags = ShellFlags.parseFlags(flags);
      const hasRegexFlag: boolean = parsedFlags.has('-E') || parsedFlags.has('-P') || parsedFlags.has('-G');
      if (hasRegexFlag) {
        try {
          new RegExp(searchText)
        } catch (e) {
          throw e?.message || 'Search error occurred.';
        }
      }
      throw 'Search error occurred.';
    }
  }
}

export async function grepStream(searchText: string,
                                 absoluteFilePath: string,
                                 stream: (line: string, kill?: () => void) => Promise<void>|void,
                                 flags?: string): Promise<number|Error> {
  const cmd = createGrepCommand(searchText, absoluteFilePath, flags);
  return await passthru(cmd.line, stream);
}

export async function grepIdStartsWith<T = number | string>(idProp: string,
                                       idPrefix: number | string,
                                       absoluteFilePath: string): Promise<T[]> {
  let isInt = typeof idPrefix === 'number';
  let grepSearchText = `"${idProp}": ${isInt ? idPrefix : '"' + idPrefix}`;
  let lines = await grep(grepSearchText, absoluteFilePath, '-i', false);
  let out = [];
  for (let line of lines) {
    let parts = /":\s+"?([^",$]+)/.exec(line);
    out.push(isInt ? parseInt(parts[1]) : parts[1]);
  }
  return out;
}

export function getTextAtLine(lineNum: number, absoluteFilePath: string): string {
  try {
    const cmd = `sed '${lineNum}q;d' ${absoluteFilePath}`;
    // noinspection JSUnusedLocalSymbols
    const stdout: string = execSync(cmd, {
      env: { PATH: process.env.SHELL_PATH },
      shell: process.env.SHELL_EXEC,
    }).toString();
    return stdout.trim();
  } catch (err) {
    console.error('\x1b[4m\x1b[1mshell error:\x1b[0m\n', err);
    throw 'Search error occurred.';
  }
}

export function findFiles(fileSearch: string, absoluteFilePath: string): string[] {
  try {
    absoluteFilePath = absoluteFilePath.replace(/\\/g, '/');
    const cmd = `find ${shellEscapeArg(absoluteFilePath)} -iname ${shellEscapeArg(fileSearch, '*', '*')} -print`;
    // noinspection JSUnusedLocalSymbols
    const stdout: string = execSync(cmd, {
      env: { PATH: process.env.SHELL_PATH },
      shell: process.env.SHELL_EXEC,
    }).toString();
    return stdout.trim().split('\n').map(f => {
      if (f.startsWith(absoluteFilePath)) {
        f = f.slice(absoluteFilePath.length);
      }
      if (f.startsWith('/')) {
        f = f.slice(1);
      }
      return f;
    });
  } catch (err) {
    console.error('\x1b[4m\x1b[1mshell error:\x1b[0m\n', err);
    throw 'Search error occurred.';
  }
}

export interface MediaSearchResult {
  fileHash: string,
  matches: { name: string, hash: number, distance: number }[]
}

export interface LangDetectResult {
  isReliable: boolean,
  details: {langName: string, langCode: string, confidence: number}[]
}

export function langDetect(text: string): LangDetectResult {
  try {
    const pyFile = path.resolve(PIPELINE_DIR, './detect_language.py').replace(/\\/g, '/');
    const cmd = `${process.env.PYTHON_COMMAND} ${pyFile} ${shellEscapeArg(text)}`;

    const stdout: string = execSync(cmd, {
      env: {
        PATH: process.env.SHELL_PATH,
      },
      shell: process.env.SHELL_EXEC,
    }).toString();

    return JSON.parse(stdout);
  } catch (err) {
    console.error('\x1b[4m\x1b[1mshell error:\x1b[0m\n', err);
    throw 'Shell error occurred.';
  }
}

export function mediaSearch(imageName: string, maxHammingDistance: number): MediaSearchResult {
  try {
    const pyFile = path.resolve(PIPELINE_DIR, './search_image_hashes.py').replace(/\\/g, '/');
    const cmd = `${process.env.PYTHON_COMMAND} ${pyFile} ${maxHammingDistance} ${shellEscapeArg(imageName)}`;

    const stdout: string = execSync(cmd, {
      env: {
        PATH: process.env.SHELL_PATH,
      },
      shell: process.env.SHELL_EXEC,
    }).toString();

    const lines = stdout.trim().split('\n').map(f => {
      return f.trim();
    });

    const fileHash = lines.shift();
    return {
      fileHash,
      matches: sort(lines.map(line => {
        let lineSplit = line.split('|');
        return {
          name: lineSplit[0],
          hash: parseInt(lineSplit[1]),
          distance: parseInt(lineSplit[2])
        }
      }), 'distance')
    };
  } catch (err) {
    console.error('\x1b[4m\x1b[1mshell error:\x1b[0m\n', err);
    throw 'Shell error occurred.';
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  let parsed = ShellFlags.parseFlags('--test-flag -abc -m 10 --another --foo bar -D -e');
  //console.log(parsed);

  let stringified = ShellFlags.stringifyFlags(parsed);
  //console.log(stringified);

  let i = 0;
  await grepStream('lantern rite', getGenshinDataFilePath('./TextMap/TextMapEN.json'),
    (line: string, kill: () => void) => {
      console.log(i, line);
      i++;
      if (i === 10) {
        kill();
      }
    }, '-i');

  console.log('grep done');
}