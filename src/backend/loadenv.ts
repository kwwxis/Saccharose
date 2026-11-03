import '../shared/polyfills.ts';
import './env-types.ts';
import path, { dirname } from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { LangCode } from '../shared/types/lang-types.ts';
import util from 'util';
import { toBoolean } from '../shared/util/genericUtil.ts';
import { SiteMode } from '../shared/types/site/site-mode-type.ts';
import { ProcessEnv } from './env-types.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Is Server Run check
// --------------------------------------------------------------------------------------------------------------
let _isServerRun: boolean = false;

/**
 * If the application is running in server mode. To distinguish from runtimes ran through the CLI as one-off scripts.
 */
export function isServerRun(): boolean {
  return _isServerRun
}
export function setIsServerRun(isServerRun: boolean): void {
  _isServerRun = isServerRun;
}

// ENV Loading and Constant Export
// --------------------------------------------------------------------------------------------------------------
const envFile = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envFile, fast: true });

export const ENV: ProcessEnv = <any> process.env;

export const getNodeEnv = (): 'development'|'production' => <any> ENV.NODE_ENV;

// Shell Check
// --------------------------------------------------------------------------------------------------------------

/**
 * Shell executable names that this application's shell-based features (in `util/shellutil.ts`) are written
 * against. Those features rely on POSIX shell semantics specifically:
 *   - Single-quote argument escaping (`shellEscapeArg`), which is a POSIX/bash convention and provides no
 *     protection at all under e.g. `cmd.exe` (which doesn't treat `'` as a quote character).
 *   - `tail -n +N file | rg -` style pipes for paginated search.
 * Rather than try to generalize the implementation to support arbitrary shells, `SHELL_EXEC` is required to point
 * to one of these POSIX-compatible shells; anything else is rejected at startup.
 */
const POSIX_SHELL_NAMES = new Set(['bash', 'sh', 'dash', 'zsh', 'ash']);

function validateShellExec(): void {
  if (!ENV.SHELL_EXEC) {
    // Not configured - nothing to validate here; features that depend on it will fail on their own when invoked.
    return;
  }
  const baseName = path.basename(ENV.SHELL_EXEC).replace(/\.exe$/i, '').toLowerCase();
  if (!POSIX_SHELL_NAMES.has(baseName)) {
    console.error(
      `[loadenv] SHELL_EXEC is set to "${ENV.SHELL_EXEC}", which does not look like a POSIX-compatible shell ` +
      `(expected the executable name to be one of: ${[...POSIX_SHELL_NAMES].join(', ')}). This application's ` +
      `shell-based features are written specifically against POSIX shell semantics (single-quote argument ` +
      `escaping, "tail | rg" pipes) and are not safe or functional with other shells (e.g. cmd.exe, PowerShell). ` +
      `Refusing to start.`
    );
    process.exit(1);
  }
}

validateShellExec();

// Specific Paths and Constants
// --------------------------------------------------------------------------------------------------------------
export const COMPONENTS_ROOT = path.resolve(__dirname, './components');
export const PUBLIC_DIR = path.resolve(__dirname, '../../public');
export const PIPELINE_DIR = path.resolve(__dirname, '../pipeline');
export const REDIST_DIR = path.resolve(PUBLIC_DIR, './redist');
export const BACKEND_ROOT = __dirname;
export const SITE_TITLE = ENV.SITE_TITLE || 'Saccharose.wiki';
export const SITE_SHORT_TITLE = ENV.SITE_SHORT_TITLE || 'Saccharose';
export const WEB_ACCESS_LOG = ENV.WEB_ACCESS_LOG ? path.resolve(ENV.WEB_ACCESS_LOG) : null;

// Site Mode Flags
// --------------------------------------------------------------------------------------------------------------
const GENSHIN_DISABLED = toBoolean(ENV.GENSHIN_DISABLED);
const HSR_DISABLED = toBoolean(ENV.HSR_DISABLED);
const ZENLESS_DISABLED = toBoolean(ENV.ZENLESS_DISABLED);
const WUWA_DISABLED = toBoolean(ENV.WUWA_DISABLED);

export function isSiteModeEnabled(requestSiteMode: SiteMode) {
  return !isSiteModeDisabled(requestSiteMode);
}

export function isSiteModeDisabled(requestSiteMode: SiteMode) {
  switch (requestSiteMode) {
    case 'unset':
      return true;
    case 'genshin':
      return isServerRun() && GENSHIN_DISABLED;
    case 'hsr':
      return isServerRun() && HSR_DISABLED;
    case 'zenless':
      return isServerRun() && ZENLESS_DISABLED;
    case 'wuwa':
      return isServerRun() && WUWA_DISABLED;
  }
}

// Specific Image Paths and Constants
// --------------------------------------------------------------------------------------------------------------
const pathResolve = (...p: string[]) =>
  p.some(x => !x)
    ? null
    : path.resolve(... p).replaceAll('\\', '/');

export const IMAGEDIR_GENSHIN_STATIC = pathResolve(PUBLIC_DIR, './images/genshin/static');
export const IMAGEDIR_GENSHIN_EXT = pathResolve(ENV.EXT_GENSHIN_IMAGES);
export const IMAGEDIR_GENSHIN_ARCHIVE = pathResolve(ENV.EXT_GENSHIN_IMAGES_ARCHIVE);

export const IMAGEDIR_HSR_EXT = pathResolve(ENV.EXT_HSR_IMAGES);
export const IMAGEDIR_HSR_ARCHIVE = pathResolve(ENV.EXT_HSR_IMAGES_ARCHIVE);

export const IMAGEDIR_WUWA_EXT = pathResolve(ENV.EXT_WUWA_IMAGES);

export const getTextMapRelPath = (langCode: LangCode): string =>
  './TextMap/TextMap'+langCode+'.json';

export const getPlainTextMapRelPath = (langCode: LangCode, fileType: 'Text' | 'Hash'): string =>
  './TextMap/Plain/PlainTextMap'+langCode+'_'+fileType+'.dat';

// Get Data File Path Functions
// --------------------------------------------------------------------------------------------------------------
export function getGenshinDataFilePath(file?: string): string {
  if (!file) {
    return ENV.GENSHIN_DATA_ROOT.replaceAll('\\', '/');
  }
  if (file.includes('../') || file.includes('..\\')) {
    throw 'Access to parent directories disallowed.';
  }
  return path.resolve(ENV.GENSHIN_DATA_ROOT, file).replaceAll('\\', '/');
}

export function getStarRailDataFilePath(file?: string): string {
  if (!file) {
    return ENV.HSR_DATA_ROOT.replaceAll('\\', '/');
  }
  if (file.includes('../') || file.includes('..\\')) {
    throw 'Access to parent directories disallowed.';
  }
  return path.resolve(ENV.HSR_DATA_ROOT, file).replaceAll('\\', '/');
}

export function getZenlessDataFilePath(file?: string): string {
  if (!file) {
    return ENV.ZENLESS_DATA_ROOT.replaceAll('\\', '/');
  }
  if (file.includes('../') || file.includes('..\\')) {
    throw 'Access to parent directories disallowed.';
  }
  return path.resolve(ENV.ZENLESS_DATA_ROOT, file).replaceAll('\\', '/');
}

export function getWuwaDataFilePath(file?: string): string {
  if (!file) {
    return ENV.WUWA_DATA_ROOT.replaceAll('\\', '/');
  }
  if (file.includes('../') || file.includes('..\\')) {
    throw 'Access to parent directories disallowed.';
  }
  return path.resolve(ENV.WUWA_DATA_ROOT, file).replaceAll('\\', '/');
}

// Console Inspect Function
// --------------------------------------------------------------------------------------------------------------
function consoleInspect(... args: any[]): void {
  let newArgs: any[] = [];
  for (let arg of args) {
    if (typeof arg === 'undefined' || arg === null || typeof arg === 'number' || typeof arg === 'boolean' || typeof arg === 'string') {
      newArgs.push(arg);
    } else {
      newArgs.push(util.inspect(arg, false, null, true))
    }
  }
  console.log(... newArgs);
}

const globalAny: any = global;
globalAny.inspect = consoleInspect;
globalAny.ENV = ENV;

declare global {
  function inspect(... args: any[]): void;
  const ENV: ProcessEnv;
}
