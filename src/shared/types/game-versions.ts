import { isEmpty } from '../util/genericUtil.ts';

export type GameVersion = {number: string, previous: string, showChangelog?: boolean};

// TODO: This needs to be updated with each new Genshin version!
export const GenshinVersions: GameVersion[] = [
  {number: '1.0', previous: null},
  {number: '1.1', previous: '1.0'},
  {number: '1.2', previous: '1.1'},
  {number: '1.3', previous: '1.2'},
  {number: '1.4', previous: '1.3'},
  {number: '1.5', previous: '1.4'},
  {number: '1.6', previous: '1.5'},

  {number: '2.0', previous: '1.6'},
  {number: '2.1', previous: '2.0'},
  {number: '2.2', previous: '2.1'},
  {number: '2.3', previous: '2.2'},
  {number: '2.4', previous: '2.3'},
  {number: '2.5', previous: '2.4'},
  {number: '2.6', previous: '2.5'},
  {number: '2.7', previous: '2.6'},
  {number: '2.8', previous: '2.7'},

  {number: '3.0', previous: '2.8'},
  {number: '3.1', previous: '3.0'},
  {number: '3.2', previous: '3.1'},
  {number: '3.3', previous: '3.2'},
  {number: '3.4', previous: '3.3'},
  {number: '3.5', previous: '3.4'},
  {number: '3.6', previous: '3.5'},
  {number: '3.7', previous: '3.6'},
  {number: '3.8', previous: '3.7'},

  {number: '4.0', previous: '3.8', showChangelog: true},
  {number: '4.1', previous: '4.0', showChangelog: true},
  {number: '4.2', previous: '4.1', showChangelog: true},
  {number: '4.3', previous: '4.2', showChangelog: true},
  {number: '4.4', previous: '4.3', showChangelog: true},
  {number: '4.5', previous: '4.4', showChangelog: true},
  {number: '4.6', previous: '4.5', showChangelog: true},
  {number: '4.7', previous: '4.6', showChangelog: true},
  {number: '4.8', previous: '4.7', showChangelog: true},
  {number: '5.0', previous: '4.8', showChangelog: true},
  {number: '5.1', previous: '5.0', showChangelog: true},
  {number: '5.2', previous: '5.1', showChangelog: true},
  {number: '5.3', previous: '5.2', showChangelog: true},
];

// TODO: This needs to be updated with each new Honkai Star Rail version!
export const StarRailVersions: GameVersion[] = [
  {number: '1.0', previous: null},
  {number: '1.1', previous: '1.0'},
  {number: '1.2', previous: '1.1'},
  {number: '1.3', previous: '1.2'},
  {number: '1.4', previous: '1.3'},
  {number: '1.5', previous: '1.4'},
  {number: '1.6', previous: '1.5'},
  {number: '2.0', previous: '1.6'},
  {number: '2.1', previous: '2.0'},
  {number: '2.2', previous: '2.1'},
  {number: '2.3', previous: '2.2'},
  {number: '2.4', previous: '2.3'},
  {number: '2.5', previous: '2.4'},
  {number: '2.6', previous: '2.5'},
  {number: '2.7', previous: '2.6'},
  {number: '3.0', previous: '2.7'},
];

// TODO: This needs to be updated with each new Zenless Zone Zero version!
export const ZenlessVersions: GameVersion[] = [
  {number: '0.1', previous: null},
  {number: '0.2', previous: '0.1'},
  {number: '0.3', previous: '0.2'},
  {number: '1.0', previous: '0.3'},
  {number: '1.1', previous: '1.0'},
  {number: '1.2', previous: '1.1'},
  {number: '1.3', previous: '1.2'},
  {number: '1.4', previous: '1.3'},
  {number: '1.5', previous: '1.4'},
];

// TODO: This needs to be updated with each new Wuthering Waves version!
export const WuwaVersions: GameVersion[] = [
  {number: '1.0', previous: null},
  {number: '1.1', previous: '1.0'},
  {number: '1.2', previous: '1.1'},
  {number: '1.3', previous: '1.2'},
  {number: '1.4', previous: '1.2'},
];

export function isGameVersion(o: any): o is GameVersion {
  return typeof o.number === 'string' && o.hasOwnProperty('previous');
}

// TODO: This needs to be updated with each new Genshin version!
export const CurrentGenshinVersion: GameVersion = GenshinVersions.find(v => v.number === '5.3');

// TODO: This needs to be updated with each new Honkai Star Rail version!
export const CurrentStarRailVersion: GameVersion = StarRailVersions.find(v => v.number === '3.0');

// TODO: This needs to be updated with each new Zenless Zone Zero version!
export const CurrentZenlessVersion: GameVersion = ZenlessVersions.find(v => v.number === '1.5');

// TODO: This needs to be updated with each new Wuthering Waves version!
export const CurrentWuwaVersion: GameVersion = WuwaVersions.find(v => v.number === '1.4');

if (!CurrentGenshinVersion) throw 'Fatal configuration error in setting current Genshin Version';
if (!CurrentStarRailVersion) throw 'Fatal configuration error in setting current Star Rail Version';
if (!CurrentZenlessVersion) throw 'Fatal configuration error in setting current Zenless Version';
if (!CurrentWuwaVersion) throw 'Fatal configuration error in setting current Wuthering Waves Version';

export class GameVersionFilter {
  private internalSet: Set<string>;

  constructor(readonly versions: GameVersion[]) {
    this.internalSet = new Set((versions || []).map(v => v.number));
  }

  get isEnabled(): boolean {
    return !!this.internalSet.size;
  }

  has(version: string|GameVersion) {
    if (!this.isEnabled)
      return true;
    return isGameVersion(version) ? this.internalSet.has(version.number) : this.internalSet.has(version);
  }

  static from(param: any, availableVersions: GameVersion[]): GameVersionFilter {
    return new GameVersionFilter(parseVersionFilters(param, availableVersions));
  }
}

export function parseVersionFilters(param: any, availableVersions: GameVersion[]): GameVersion[] {
  if (isEmpty(param)) {
    return [];
  }

  const initialVersions: string[] = String(param)
    .split(/[,;]/g)
    .map(s => s.trim())
    .filter(s => !!s);

  const versionMap: Map<string, GameVersion> = new Map();
  const previousToNextMap: Map<string, GameVersion> = new Map();
  availableVersions.forEach(v => {
    versionMap.set(v.number, v);
    previousToNextMap.set(v.previous, v);
  });

  const finalVersions: GameVersion[] = [];

  for (let version of initialVersions) {
    if (versionMap.has(version)) {
      finalVersions.push(versionMap.get(version));
    } else if (version.includes('-')) {
      let split: string[] = version.split('-');

      if (split.length !== 2)
        throw 'Invalid version range: ' + version;

      let lowerbound: GameVersion = versionMap.get(split[0].trim());
      let upperbound: GameVersion = versionMap.get(split[1].trim());

      if (!lowerbound)
        throw `Lowerbound of version range is an unknown or unsupported version: ${split[0].trim()} (in version range: ${version})`;
      if (!upperbound)
        throw `Upperbound of version range is an unknown or unsupported version: ${split[1].trim()} (in version range: ${version})`;

      let cursor: GameVersion = lowerbound;
      finalVersions.push(cursor);

      let foundUpperbound: boolean = false;
      while (cursor && (cursor = previousToNextMap.get(cursor.number))) {
        finalVersions.push(cursor);
        if (cursor.number === upperbound.number) {
          foundUpperbound = true;
          break;
        }
      }

      if (!foundUpperbound)
        throw `Upperbound must be a greater version than the lowerbound (in version range: ${version})`;
    } else if (version.endsWith('+')) {
      version = version.slice(0, -1).trim();

      if (!versionMap.has(version)) {
        throw 'Unknown or unsupported version: ' + version;
      }

      let cursor: GameVersion = versionMap.get(version);
      finalVersions.push(cursor);

      while (cursor && (cursor = previousToNextMap.get(cursor.number))) {
        finalVersions.push(cursor);
      }
    } else {
      throw 'Unknown or unsupported version: ' + version;
    }
  }

  return finalVersions;
}
