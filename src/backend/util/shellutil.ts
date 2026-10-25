import {
  ChildProcessWithoutNullStreams,
  ExecException,
  exec as _execAsync,
  execFile as _execFileAsync,
  spawn,
  ExecOptions,
} from 'child_process';
import { promisify } from 'util';
import { getGenshinDataFilePath, PIPELINE_DIR } from '../loadenv.ts';
import { pathToFileURL } from 'url';
import treeKill from 'tree-kill';
import { isEmpty, isPromise, isset } from '../../shared/util/genericUtil.ts';
import { toInt } from '../../shared/util/numberUtil.ts';
import path from 'path';
import { LangDetectResult } from '../../shared/types/common-types.ts';
import { Duration } from '../../shared/util/duration.ts';
import { NonSharedBuffer } from 'node:buffer';

async function exec(command: string, options: ExecOptions): Promise<string> {
  return new Promise((resolve, reject) => {
    _execAsync(command, options, (err: ExecException, stdout: string|NonSharedBuffer, _stderr: string|NonSharedBuffer) => {
      if (err) {
        return reject(err);
      } else {
        if (typeof stdout === 'string') {
          resolve(stdout);
        } else {
          // NonSharedBuffer is deprecated:
          //   "This is intended for internal use and will be removed once @types/node no longer supports TypeScript versions earlier than 5.7"
          // But is nonetheless on the type signature of the callback, so we have to handle it.
          resolve(stdout.toString('utf-8'));
        }
      }
    });
  });
}

/**
 * Error thrown when a shell command times out.
 */
export class ShellTimeoutError extends Error {
  constructor(message: string, readonly timeoutMs: number, readonly opInfo: string) {
    super(message);
  }
}

/**
 * Tracks the PIDs of still-running `detached: true` child processes spawned by `execLineStream`, so that they can
 * be force-killed if the Node process itself is shutting down (e.g. SIGINT/SIGTERM) before the command's own
 * `close`/timeout handling has had a chance to clean them up. Without this, a detached child (and anything it in
 * turn spawned, e.g. `bash` -> `rg`) could be orphaned and keep running indefinitely after a graceful shutdown.
 * This does not help with a hard crash (e.g. unhandled exception bypassing shutdown signals), only graceful exits.
 */
const activeDetachedChildPids: Set<number> = new Set<number>();

let shutdownHandlersRegistered: boolean = false;

function registerShutdownCleanupOnce(): void {
  if (shutdownHandlersRegistered) {
    return;
  }
  shutdownHandlersRegistered = true;

  const killAllActiveChildren = () => {
    for (const pid of activeDetachedChildPids) {
      try {
        treeKill(pid);
      } catch {
        // Best-effort cleanup during shutdown - ignore errors (e.g. process already exited).
      }
    }
    activeDetachedChildPids.clear();
  };

  process.once('SIGINT', killAllActiveChildren);
  process.once('SIGTERM', killAllActiveChildren);
  process.once('exit', killAllActiveChildren);
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
 * @param timeout Max time allowed to run for.
 * @returns Promise that resolves with the exit code of the command, or rejects with an error if the command fails.
 */
export async function execLineStream(command: string,
                                     postInitialize: (childProcess: ChildProcessWithoutNullStreams) => void,
                                     onExit: (exitCode: number, childProcess: ChildProcessWithoutNullStreams, error?: Error) => void,
                                     stdoutLineStream?: (data: string, kill?: () => void) => Promise<void>|void,
                                     stderrLineStream?: (data: string, kill?: () => void) => Promise<void>|void,
                                     timeout?: Duration): Promise<number|Error> {
  const partial_line_buffer = {
    stdout: '',
    stderr: '',
  };

  let didKill: boolean = false;

  // Captures the first error thrown/rejected by a `stdoutLineStream`/`stderrLineStream` callback. Attaching a
  // `.catch` immediately (see `trackCallbackPromise`) avoids Node flagging these as unhandled promise rejections
  // before `close` gets a chance to deal with them, and lets `close` reject the overall promise instead of hanging
  // forever waiting for a `close` event that will still normally arrive.
  // Typed `any` rather than `Error` since a thrown/rejected value isn't guaranteed to be an `Error` instance.
  let callbackError: any = null;

  const callback_promises: Promise<void>[] = [];

  const trackCallbackPromise = (p: Promise<void>): void => {
    callback_promises.push(p.catch(err => {
      if (!callbackError) {
        callbackError = err;
      }
    }));
  };

  const create_chunk_listener = (buffer_name: 'stdout' | 'stderr', stream_method: (data: string, kill?: () => void) => Promise<void>|void, killFn: () => void, backpressureStream: NodeJS.ReadableStream) => {
    return async (chunk: string) => {
      if (didKill || callbackError) {
        return;
      }

      // The chunk is an arbitrary string from the output of the command, it can start at any point and end at any point.
      // However, we want to send data to the output method on a line-by-line basis.

      // Append any data left in the buffer to the start of the chunk, and then clear the buffer.
      // Note: this also correctly handles the case where the new chunk itself *starts* with a newline - e.g. if
      // the buffer holds "abc" (an incomplete line from the previous chunk) and the new chunk is "\nfoo", the
      // concatenated string "abc\nfoo" splits into ["abc", "foo"], correctly completing "abc" as a full line.
      chunk = partial_line_buffer[buffer_name] + chunk;
      partial_line_buffer[buffer_name] = '';

      if (!chunk.includes('\n')) {
        // If the chunk did not contain any new lines, that means there are no new lines to send to the output method.
        // So just save the entire chunk into the buffer and wait for the next chunk.
        partial_line_buffer[buffer_name] = chunk;
        return;
      }

      // Split the chunk into lines.
      let lines = chunk.split(/\n/g);

      if (chunk.endsWith('\n')) {
        // `String.split` leaves a trailing empty string when the chunk ends exactly on a line boundary (e.g.
        // "a\nb\n".split(/\n/) === ["a", "b", ""]). That trailing "" isn't a real line of output - discard it.
        lines.pop();
      } else {
        // The chunk ends mid-line; that means the chunk ends with an incomplete line, so we do not want to send
        // that line to the output method yet. Instead, we pop off that last line and put it into the partial line
        // buffer so that the line can be completed by the next chunk(s).
        partial_line_buffer[buffer_name] = lines.pop();
      }

      for (let line of lines) {
        if (didKill || callbackError) {
          return;
        }
        let ret = stream_method(line, killFn);
        if (isPromise(ret)) {
          // Apply real backpressure: pause the stream so no further chunks are delivered (and no further lines
          // dispatched) until this line's async processing has actually completed. Without this, a single chunk
          // containing many matched lines would fire off all of their (potentially DB-querying) async callbacks
          // concurrently/out-of-order rather than one at a time, and the underlying process would keep producing
          // output un-throttled regardless of how slow the consumer is.
          backpressureStream.pause();
          try {
            await ret;
          } catch (err: any) {
            if (!callbackError) {
              callbackError = err;
            }
            return;
          } finally {
            if (!didKill && !callbackError) {
              backpressureStream.resume();
            }
          }
        }
      }
    };
  };

  registerShutdownCleanupOnce();

  return new Promise((resolve, reject) => {
    //console.log('Command:', command);
    const child = spawn(command, {
      env: { PATH: ENV.SHELL_PATH },
      shell: ENV.SHELL_EXEC,
      detached: true,
    });

    if (typeof child.pid === 'number') {
      activeDetachedChildPids.add(child.pid);
    }

    if (postInitialize) {
      postInitialize(child);
    }

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');

    let errorObj: Error;
    let settled: boolean = false;

    const killFn = () => {
      // Pausing the stdout and sending the kill signal doesn't really seem to work.
      // so set didKill = true so the stream callback isn't called anymore even if the command is still running.
      child.stdout.pause();
      child.stderr.pause();
      treeKill(child.pid);
      didKill = true;
    };

    let killTimeoutId = null;
    if (timeout) {
      let timeoutMs: number = timeout.toMillis();
      killTimeoutId = setTimeout(() => {
        killFn();
        child.emit('error', new ShellTimeoutError(`Operation timed out after ${timeoutMs} milliseconds`, timeoutMs,
          `execLineStream: ` + command));
      }, timeoutMs);
    }

    const flush_partial_line_buffer = () => {
      // Once the shell stream closes, send any data still left in the partial line buffers to the output methods.

      if (didKill || callbackError) {
        return;
      }

      let ret1: Promise<void>|void, ret2: Promise<void>|void;

      if (stdoutLineStream && partial_line_buffer.stdout)
        ret1 = stdoutLineStream(partial_line_buffer.stdout, killFn);
      if (stderrLineStream && partial_line_buffer.stderr)
        ret2 = stderrLineStream(partial_line_buffer.stderr, killFn);

      if (isPromise(ret1))
        trackCallbackPromise(ret1);
      if (isPromise(ret2))
        trackCallbackPromise(ret2);

      partial_line_buffer.stdout = '';
      partial_line_buffer.stderr = '';
    };

    if (stdoutLineStream) {
      const listener = create_chunk_listener('stdout', stdoutLineStream, killFn, child.stdout);
      child.stdout.on('data', chunk => trackCallbackPromise(listener(chunk)));
    }

    if (stderrLineStream) {
      const listener = create_chunk_listener('stderr', stderrLineStream, killFn, child.stderr);
      child.stderr.on('data', chunk => trackCallbackPromise(listener(chunk)));
    }

    child.on('error', error => {
      console.error('\x1b[4m\x1b[1mshell error:\x1b[0m\n', error);
      errorObj = error;

      // If the process never actually started (e.g. the configured SHELL_EXEC wasn't found on disk), `child.pid`
      // is left undefined and no 'exit'/'close' event will ever follow this 'error' event (per Node's docs on
      // ChildProcess). Without this check, the returned promise would hang forever in that case. So in that
      // specific case, settle the promise right here instead of waiting for a 'close' that will never come.
      if (typeof child.pid !== 'number' && !settled) {
        settled = true;
        if (killTimeoutId)
          clearTimeout(killTimeoutId);
        if (onExit)
          onExit(-1, child, errorObj);
        reject(errorObj);
      }
    });

    child.on('close', exitCode => {
      if (typeof child.pid === 'number') {
        activeDetachedChildPids.delete(child.pid);
      }
      if (settled) {
        return;
      }
      settled = true;

      if (killTimeoutId)
        clearTimeout(killTimeoutId);
      flush_partial_line_buffer();

      Promise.all(callback_promises).then(() => {
        // `callback_promises` entries never themselves reject (see `trackCallbackPromise`), so `callbackError`
        // (if any) is checked explicitly here instead, taking priority since it reflects a bug/failure in the
        // consumer's own callback rather than the shell command itself.
        const finalError = callbackError || errorObj;
        if (finalError) {
          if (onExit)
            onExit(exitCode, child, finalError);
          reject(finalError);
        } else {
          if (onExit)
            onExit(exitCode, child);
          resolve(exitCode);
        }
      });
    });
  });
}

/**
 * Normalize control characters (null bytes, backspace, newline, carriage-return, form-feed, tab, vertical-tab) in
 * a grep search string so it matches how such characters are literally encoded (as escaped `\n`/`\r`/etc. text
 * sequences) in the plaintext map files being searched. This is independent of shell escaping - it's needed
 * regardless of whether the string ends up in a shell command string or passed directly as an argv entry.
 */
function normalizeGrepSearchText(s: string): string {
  s = s.replace(/\x00+/g, '');
  s = s.replace(/\x08+/g, '');

  s = s.replace(/\n/g, '\\\\n');
  s = s.replace(/\r/g, '\\\\r');
  s = s.replace(/\f/g, '\\\\f');
  s = s.replace(/\t/g, '\\\\t');
  s = s.replace(/\v/g, '\\\\v');

  return s;
}

/**
 * Escape a string to be used as the argument to a command.
 */
export function shellEscapeArg(s: string): string {
  s = normalizeGrepSearchText(s);
  return shellQuote(s);
}

/**
 * Quote (single-quote wrap, with proper escaping of embedded single quotes) a string for use as a single shell
 * argument, without any of the grep-specific control-character normalization that `shellEscapeArg` also applies
 * (which would be incorrect to apply to things like file paths - e.g. a literal tab character in a path should
 * stay a literal tab, not get rewritten to the two-character text `\t`).
 */
function shellQuote(s: string): string {
  s = s.replace(/'+/g, m => `'"${m}"'`);
  return `'` + s + `'`;
}

/**
 * Class to represent shell flags and their values, with methods to parse, stringify, and manipulate them.
 */
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

  /**
   * Convert the flags to an argv-style array (e.g. `['-n', '-i', '--mmap']`), suitable for passing directly to
   * `child_process.execFile`/`spawn` without shell interpretation (i.e. no shell quoting/escaping involved).
   */
  toArgv(): string[] {
    const argv: string[] = [];
    for (let [flag, value] of this.map.entries()) {
      argv.push(flag);
      if (value) {
        argv.push(value);
      }
    }
    return argv;
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

/**
 * Extra options for the grep command.
 */
export type GrepExtraOpts = {
  /**
   * Flags to pass to the grep command. Flags will be appropriately parsed, meaning both `-w -i` and `-wi` are
   * acceptable.
   */
  flags?: string,
  /**
   * If set, start from a specific line number in the file rather than from the first line.
   * Results will still be returned with the correct line number from the original beginning of the file, which is
   * implemented by using `tail` and then adding this number minus one to the line number of each result.
   */
  startFromLine?: number
}

/**
 * Creates the grep command string with the given search text, file path, and extra options.
 * Handles escaping as necessary.
 *
 * @param searchText The text to search for.
 * @param absoluteFilePath The absolute path to the file to search in.
 * @param extraOpts The extra options.
 */
function createGrepCommand(searchText: string, absoluteFilePath: string, extraOpts: GrepExtraOpts): {
  line: string,
  argv: string[],
  flags: ShellFlags,
  hasLineNumFlag: boolean
} {
  let flags: ShellFlags = ShellFlags.parseFlags(extraOpts.flags);

  // `rawSearchText` is the normalized (but not shell-escaped) search text, usable as a standalone argv entry when
  // no shell is involved. `searchText` is reassigned below to the shell-quoted form, used when building the shell
  // command string.
  let rawSearchText = normalizeGrepSearchText(searchText);
  searchText = shellEscapeArg(searchText);

  let hasRegexFlag: boolean = flags.has('-P') || flags.has('-e');
  if (!hasRegexFlag) {
    flags.set('-F');
  } else {
    // This additional backslash-doubling (on top of what shellEscapeArg/normalizeGrepSearchText already did) is
    // specific to how the resulting pattern needs to look after passing through a real shell's parsing, so it's
    // only valid for the shell command string form - not for the argv form, which isn't shell-parsed at all.
    searchText = searchText.replace(/\\n/g, '(\\\\\\\\n)');
  }

  flags.set('--mmap');
  flags.set('--no-heading');

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

  // Note: `--path-separator` value differs depending on invocation method. When going through a shell on Windows
  // (e.g. MSYS/Git-Bash), a single `/` gets auto-expanded to `//` by the shell itself before `rg` ever sees it, so
  // the flag value must be pre-doubled to compensate. When invoking `rg` directly via argv (no shell involved),
  // no such expansion happens, so the literal single-byte separator must be used as-is.
  const pathSepLine = process.platform === 'win32' ? '//' : '/';
  const pathSepArgv = '/';

  let grepCmd = `rg ${flags.stringify()} --path-separator ${pathSepLine} -- ${searchText}`;

  if (isset(extraOpts.startFromLine)) {
    /*
    To grep on standard input (i.e., grep from the output of tail), the file of the grep command must be "-"

    From https://man7.org/linux/man-pages/man1/grep.1.html
    > A FILE of “-” stands for standard input.  If no FILE is given,
    > recursive searches examine the working directory, and
    > non-recursive searches read standard input.
    */
    // Requires piping `tail | rg -`, which needs a real shell, so no argv-only (shell-less) form is possible here.
    return { line: `tail -n +${extraOpts.startFromLine} ${absoluteFilePath} | ${grepCmd} -`, argv: null, flags, hasLineNumFlag };
  } else {
    return {
      line: `${grepCmd} ${absoluteFilePath}`,
      // Only use the argv (shell-less) form for fixed-string mode: the regex-mode backslash-doubling above is
      // specific to the shell command string form, so the argv form isn't guaranteed equivalent when regex flags
      // (`-P`/`-e`) are present - in that case `argv` is left `null` so the caller falls back to the shell form.
      argv: !hasRegexFlag ? ['--path-separator', pathSepArgv, ...flags.toArgv(), '--', rawSearchText, absoluteFilePath] : null,
      flags,
      hasLineNumFlag,
    };
  }
}

/**
 * Whether `rg` can be invoked directly (without going through the configured shell). This is lazily determined
 * on first use and cached for the lifetime of the process. If `rg` isn't directly resolvable (e.g. it's only
 * resolvable via the shell-specific `SHELL_PATH`, such as a custom bash `PATH` setup), this will be `false` and
 * every grep call will fall back to going through the configured shell as before.
 */
let directRgSupported: boolean | null = null;

const execFileAsync = promisify(_execFileAsync);

/**
 * Attempt to run `rg` directly via `execFile` (i.e. without spawning an intermediate shell). This avoids the
 * overhead of starting a shell (e.g. the configured `SHELL_EXEC`) purely to then spawn `rg` from within it, which
 * can be significant (especially MSYS/Git-Bash on Windows). Falls back to `null` (caller should use the
 * shell-based path instead) if `rg` isn't directly resolvable via the process's native PATH.
 */
async function tryDirectGrep(argv: string[]): Promise<string | null> {
  if (directRgSupported === false) {
    return null;
  }
  try {
    const { stdout } = await execFileAsync('rg', argv, { encoding: 'utf8' });
    directRgSupported = true;
    return stdout;
  } catch (err: any) {
    if (err && err.code === 'ENOENT') {
      // `rg` isn't resolvable without going through the shell's PATH setup - don't try the direct path again.
      directRgSupported = false;
      return null;
    }
    // Re-throw anything else (e.g. exit code 1 for no matches, maxBuffer overflow) so the caller's existing
    // error-handling logic (shared with the shell-based path) can process it.
    throw err;
  }
}

/**
 * Necessary post-processing of a grep output line to adjust the line number if the grep command was run on a tail of the file.
 * @param s
 * @param hasLineNumFlag
 * @param startFromLine
 */
function postProcessGrepLine(s: string, hasLineNumFlag: boolean, startFromLine: number) {
  s = s.trim();
  if (hasLineNumFlag && isset(startFromLine)) {
    s = s.replace(/^(\d+):/, (_fm, stdoutLineNum) => (toInt(stdoutLineNum) + startFromLine - 1) + ':');
  }
  return s;
}

/**
 * Grep the file for the given search text and returns all the matching lines in one array.
 *
 * Note: this intentionally does not attempt to reject/sanitize user-supplied regex patterns against ReDoS
 * (catastrophic backtracking) when `-P`/`-e` is used. `rg`'s PCRE2 regex engine is used for legitimate, often
 * fairly complex multi-language search patterns, and overly-restrictive pattern validation would reject valid
 * use cases far more often than it would catch a real attack. If this ever becomes a concern in practice, bound
 * the worst case with a wall-clock timeout on the underlying process (as `grepStream`'s `timeout` param already
 * does for the streaming variant) rather than trying to statically validate the pattern.
 *
 * @param searchText The text to search for. Format may depend on the flags provided in extraOpts.
 * @param absoluteFilePath The absolute path to the file to search in.
 * @param extraOpts Extra options for the grep command, such as flags and the line number to start from.
 * @returns Promise that resolves with an array of matching lines, or rejects with an error if the command fails.
 */
export async function grep(searchText: string,
                           absoluteFilePath: string,
                           extraOpts: GrepExtraOpts): Promise<string[]> {
  try {
    const cmd = createGrepCommand(searchText, absoluteFilePath, extraOpts);
    // console.log('Command:', cmd.line);

    let stdout: string = null;

    if (cmd.argv) {
      // Fast path: no pipe needed (i.e. no `startFromLine`), so try invoking `rg` directly, bypassing the
      // overhead of spawning an intermediate shell (e.g. `SHELL_EXEC`) just to launch `rg` from within it.
      stdout = await tryDirectGrep(cmd.argv);
    }

    if (stdout === null) {
      // Either the fast path wasn't applicable (pipe needed), or `rg` isn't directly resolvable in this
      // environment - fall back to going through the configured shell, same as before.
      stdout = await exec(cmd.line, {
        env: { PATH: ENV.SHELL_PATH },
        shell: ENV.SHELL_EXEC,
        // Bump beyond Node's 1MB default: result count is normally bounded by a `-m` flag set by callers, but not
        // all callers set one (e.g. companion_dialogue.ts), so use a larger-but-still-bounded buffer instead of
        // an unbounded one, to avoid spuriously failing on legitimately large (but not pathological) result sets.
        maxBuffer: 16 * 1024 * 1024,
      });
    }

    return stdout.split(/\n/)
      .map(s => postProcessGrepLine(s, cmd.hasLineNumFlag, extraOpts.startFromLine))
      .filter(x => !!x);
  } catch (err: any) {
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
        } catch (e: any) {
          throw e?.message || 'Search error occurred.';
        }
      }
      throw 'Search error occurred.';
    }
  }
}

/**
 * Grep the file and stream the results line by line to the provided stream callback.
 * This is useful in cases where there may be too many lines to hold in memory at once.
 *
 * @param searchText The text to search for. Format may depend on the flags provided in extraOpts.
 * @param absoluteFilePath The absolute path to the file to search in.
 * @param timeout The maximum time to allow the command to run for.
 * @param stream The callback to stream the results to. The callback is called with each line of the output, and
 * an optional kill function that can be called to stop the command.
 * @param extraOpts Extra options for the grep command, such as flags and the line number to start from.
 * @returns A promise that resolves with the exit code of the command once all lines have been streamed,
 * or rejects with an error if the command fails.
 */
export async function grepStream(searchText: string,
                                 absoluteFilePath: string,
                                 timeout: Duration,
                                 stream: (line: string, kill?: () => void) => Promise<void>|void,
                                 extraOpts: GrepExtraOpts): Promise<number|Error> {
  const cmd = createGrepCommand(searchText, absoluteFilePath, extraOpts);
  // console.log('Command:', cmd.line);

  return await execLineStream(cmd.line,
    null,
    null,
    (line: string, kill?: () => void) => {
      line = postProcessGrepLine(line, cmd.hasLineNumFlag, extraOpts.startFromLine);
      return stream(line, kill);
    },
    null,
    timeout,
  );
}

// noinspection JSUnusedGlobalSymbols
/**
 * Get the text at a specific line number in a file.
 * @param lineNum The line number to get the text from (1-based).
 * @param absoluteFilePath The absolute path to the file to get the text from.
 * @returns A promise that resolves with the text at the specified line number, or rejects with an error if the command fails.
 */
export async function getTextAtLine(lineNum: number, absoluteFilePath: string): Promise<string> {
  try {
    const cmd = `sed '${lineNum}q;d' ${shellQuote(absoluteFilePath)}`;

    const stdout: string = await exec(cmd, {
      env: { PATH: ENV.SHELL_PATH },
      shell: ENV.SHELL_EXEC,
    });

    return stdout.trim();
  } catch (err) {
    console.error('\x1b[4m\x1b[1mshell error:\x1b[0m\n', err);
    throw 'Search error occurred.';
  }
}

/**
 * Find files in a directory that match a specific search pattern.
 * @param fileSearch The iname search pattern to match files against (e.g., '*.json'). This uses standard shell globbing
 * patterns, only supporting syntax like `*`, `?`, and `[]`. The search is case-insensitive.
 * @param absoluteFilePath The absolute path to the directory to search in.
 * @param noAppendWildcards By default, the `*` wildcard is appended to the start and end of the search pattern, if not
 * already present. If this parameter is set to `true`, the search pattern will be used as-is without appending these wildcards.
 * @returns A promise that resolves with an array of file paths that match the search pattern, or rejects with an error if the command fails.
 */
export async function findFiles(fileSearch: string, absoluteFilePath: string, noAppendWildcards: boolean = false): Promise<string[]> {
  try {
    absoluteFilePath = absoluteFilePath.replace(/\\/g, '/');
    if (!noAppendWildcards) {
      let prefix = '';
      let suffix = '';
      if (!fileSearch.startsWith('*')) {
        prefix = '*';
      }
      if (!fileSearch.endsWith('*')) {
        suffix = '*';
      }
      fileSearch = prefix + fileSearch + suffix;
    }
    const cmd = `find ${shellEscapeArg(absoluteFilePath)} -iname ${shellEscapeArg(fileSearch)} -print`;

    const stdout: string = await exec(cmd, {
      env: { PATH: ENV.SHELL_PATH },
      shell: ENV.SHELL_EXEC,
      // `find` over a whole directory tree isn't bounded by anything like `-m`, so give it more headroom than
      // the 1MB default before failing on legitimately large (but not pathological) directory listings.
      maxBuffer: 16 * 1024 * 1024,
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

/**
 * Detect the language of the given text.
 * @param text The text to detect the language of.
 * @returns A promise that resolves with the language detection result, or rejects with an error if the command fails.
 */
export async function langDetect(text: string): Promise<LangDetectResult> {
  try {
    if (isEmpty(ENV.PYTHON_COMMAND)) {
      return { isReliable: false, details: [] };
    }
    const pyFile = path.resolve(PIPELINE_DIR, './detect_language.py').replace(/\\/g, '/');
    const cmd = `${ENV.PYTHON_COMMAND} ${pyFile} ${shellEscapeArg(text)}`;

    const stdout: string = await exec(cmd, {
      env: {
        PATH: ENV.SHELL_PATH,
      },
      shell: ENV.SHELL_EXEC,
    });

    return JSON.parse(stdout);
  } catch (err) {
    console.error('\x1b[4m\x1b[1mshell error:\x1b[0m\n', err);
    throw 'Shell error occurred.';
  }
}

// Experimental test code:
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  let parsed = ShellFlags.parseFlags('null --test-flag -abc -m 10 --another --foo bar -D -en');
  // console.log(parsed);

  let stringified = ShellFlags.stringifyFlags(parsed);
  //console.log(stringified);

  let i = 0;
  await grepStream('lantern rite', getGenshinDataFilePath('./TextMap/TextMapEN.json'), null,
    (line: string, kill: () => void) => {
      console.log(i, line);
      i++;
      if (i === 10) {
        kill();
      }
    }, { flags: '-in', startFromLine: 4270 });

  console.log('grep done');
}
