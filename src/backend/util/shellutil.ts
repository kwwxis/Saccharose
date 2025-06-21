import { ChildProcessWithoutNullStreams, ExecException, exec as _execAsync, spawn, ExecOptions } from 'child_process';
import { getGenshinDataFilePath, PIPELINE_DIR } from '../loadenv.ts';
import { pathToFileURL } from 'url';
import treeKill from 'tree-kill';
import { isPromise, isset } from '../../shared/util/genericUtil.ts';
import { toInt } from '../../shared/util/numberUtil.ts';
import { splitLimit } from '../../shared/util/stringUtil.ts';
import path from 'path';
import { LangDetectResult } from '../../shared/types/common-types.ts';

async function exec(command: string, options: ExecOptions): Promise<string> {
  return new Promise((resolve, reject) => {
    _execAsync(command, options, (err: ExecException, stdout: string, _stderr: string) => {
      if (err) {
        return reject(err);
      } else {
        return resolve(stdout);
      }
    });
  });
}

/**
 * Streams the output of the command on a line-by-line basis.
 *
 * Since this is a stream, it should not run into out-of-memory issues unless there is an extremely long line in
 * the command output.
 *
 * @param command The command to execute in the bash shell.
 * @param postInitialize Callback called with the child process instance after it is instantiated.
 * @param onExit Callback called on exit.
 * @param stdoutLineStream Stream method for stdout.
 * @param stderrLineStream Stream method for stderr.
 */
export async function passthru(command: string,
                               postInitialize: (childProcess: ChildProcessWithoutNullStreams) => void,
                               onExit: (exitCode: number, childProcess: ChildProcessWithoutNullStreams) => void,
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

    if (postInitialize) {
      postInitialize(child);
    }

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

    child.on('close', _exitCode => {
      flush_partial_line_buffer();
    });

    child.on('exit', exitCode => {
      if (onExit) {
        onExit(exitCode, child);
      }
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
    if (!flags || typeof flags !== 'string' || !flags.trim().length) {
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

export type GrepExtraOpts = {
  flags?: string,
  escapeDoubleQuotes?: boolean,
  startFromLine?: number
}

function createGrepCommand(searchText: string, absoluteFilePath: string, extraOpts: GrepExtraOpts): {
  line: string,
  flags: ShellFlags,
  hasLineNumFlag: boolean
} {
  let flags: ShellFlags = ShellFlags.parseFlags(extraOpts.flags);

  if (extraOpts.escapeDoubleQuotes && absoluteFilePath.endsWith('.json')) {
    searchText = searchText.replace(/"/g, `\\"`); // double quotes, assuming searching within a JSON string value
  }

  searchText = shellEscapeArg(searchText);

  let hasRegexFlag: boolean = flags.has('-P') || flags.has('-e');
  if (!hasRegexFlag) {
    flags.set('-F');
  } else {
    searchText = searchText.replace(/\\n/g, '(\\\\\\\\n)');
  }

  flags.set('--no-heading');
  flags.set('--path-separator', process.platform === 'win32' ? '//' : '/');

  if (isset(extraOpts.startFromLine)) {
    flags.remove('-H');
    flags.remove('--with-filename');
    flags.set('--no-filename');
  }

  // Command format:
  //   grep {flags} -- {searchText} {file}

  const hasLineNumFlag = flags.has('-n') || flags.has('--line-number');
  if (!hasLineNumFlag) {
    if (!flags.has('--no-line-number') && !flags.has('-N')) {
      flags.set('-N');
    }
  }

  let grepCmd = `rg ${flags.stringify()} -- ${searchText}`;

  if (isset(extraOpts.startFromLine)) {
    // In order to grep on standard input (i.e. grep from the output of tail), the file of the grep command must be "-"
    //
    // From https://man7.org/linux/man-pages/man1/grep.1.html
    // >  A FILE of “-” stands for standard input.  If no FILE is given,
    // >       recursive searches examine the working directory, and
    // >       non-recursive searches read standard input.
    return { line: `tail -n +${extraOpts.startFromLine} ${absoluteFilePath} | ${grepCmd} -`, flags, hasLineNumFlag };
  } else {
    return { line: `${grepCmd} ${absoluteFilePath}`, flags, hasLineNumFlag };
  }
}

export async function getLineNumberForLineText(lineText: string,
                                               absoluteFilePath: string) {
  const matches = await grep(lineText, absoluteFilePath, {
    flags: '-n',
    escapeDoubleQuotes: false
  });
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

function postProcessGrepLine(s: string, hasLineNumFlag: boolean, startFromLine: number) {
  s = s.trim();
  if (hasLineNumFlag && isset(startFromLine)) {
    s = s.replace(/^(\d+):/, (_fm, stdoutLineNum) => (toInt(stdoutLineNum) + startFromLine - 1) + ':');
  }
  return s;
}

export async function grep(searchText: string,
                           absoluteFilePath: string,
                           extraOpts: GrepExtraOpts): Promise<string[]> {
  try {
    const cmd = createGrepCommand(searchText, absoluteFilePath, extraOpts);
    // console.log('Command:', cmd.line);

    const stdout = await exec(cmd.line, {
      env: { PATH: process.env.SHELL_PATH },
      shell: process.env.SHELL_EXEC,
    });

    return stdout.split(/\n/)
      .map(s => postProcessGrepLine(s, cmd.hasLineNumFlag, extraOpts.startFromLine))
      .filter(x => !!x);
  } catch (err) {
    if (err && err.code === 1) {
      return []; // exit code of 1 is no matches found - not an error for our use case
    } else if (err && err.code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER') {
      throw 'Max buffer reached (too many results).';
    } else {
      console.error('\x1b[4m\x1b[1mshell error:\x1b[0m\n', err);
      const parsedFlags = ShellFlags.parseFlags(extraOpts.flags);
      const hasRegexFlag: boolean = parsedFlags.has('-P') || parsedFlags.has('-e');
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
                                 extraOpts: GrepExtraOpts): Promise<number|Error> {
  const cmd = createGrepCommand(searchText, absoluteFilePath, extraOpts);
  // console.log('Command:', cmd.line);

  return await passthru(cmd.line, null, null, (line: string, kill?: () => void) => {
    line = postProcessGrepLine(line, cmd.hasLineNumFlag, extraOpts.startFromLine);
    return stream(line, kill);
  });
}

export async function grepIdStartsWith<T = number | string>(idProp: string,
                                       idPrefix: number | string,
                                       absoluteFilePath: string): Promise<T[]> {
  let isInt = typeof idPrefix === 'number';
  let grepSearchText = `"${idProp}": ${isInt ? idPrefix : '"' + idPrefix}`;
  let lines = await grep(grepSearchText, absoluteFilePath, {
    flags: '-i',
    escapeDoubleQuotes: false
  });
  let out = [];
  for (let line of lines) {
    let parts = /":\s+"?([^",$]+)/.exec(line);
    out.push(isInt ? toInt(parts[1]) : parts[1]);
  }
  return out;
}

// noinspection JSUnusedGlobalSymbols
export async function getTextAtLine(lineNum: number, absoluteFilePath: string): Promise<string> {
  try {
    const cmd = `sed '${lineNum}q;d' ${absoluteFilePath}`;

    const stdout: string = await exec(cmd, {
      env: { PATH: process.env.SHELL_PATH },
      shell: process.env.SHELL_EXEC,
    });

    return stdout.trim();
  } catch (err) {
    console.error('\x1b[4m\x1b[1mshell error:\x1b[0m\n', err);
    throw 'Search error occurred.';
  }
}

export async function findFiles(fileSearch: string, absoluteFilePath: string): Promise<string[]> {
  try {
    absoluteFilePath = absoluteFilePath.replace(/\\/g, '/');
    const cmd = `find ${shellEscapeArg(absoluteFilePath)} -iname ${shellEscapeArg(fileSearch, '*', '*')} -print`;

    const stdout: string = await exec(cmd, {
      env: { PATH: process.env.SHELL_PATH },
      shell: process.env.SHELL_EXEC,
    });

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

export async function langDetect(text: string): Promise<LangDetectResult> {
  try {
    const pyFile = path.resolve(PIPELINE_DIR, './detect_language.py').replace(/\\/g, '/');
    const cmd = `${process.env.PYTHON_COMMAND} ${pyFile} ${shellEscapeArg(text)}`;

    const stdout: string = await exec(cmd, {
      env: {
        PATH: process.env.SHELL_PATH,
      },
      shell: process.env.SHELL_EXEC,
    });

    return JSON.parse(stdout);
  } catch (err) {
    console.error('\x1b[4m\x1b[1mshell error:\x1b[0m\n', err);
    throw 'Shell error occurred.';
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  let parsed = ShellFlags.parseFlags('null --test-flag -abc -m 10 --another --foo bar -D -en');
  // console.log(parsed);

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
    }, { flags: '-in', startFromLine: 4270 });

  console.log('grep done');
}
