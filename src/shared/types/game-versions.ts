import { isEmpty } from '../util/genericUtil.ts';

export class GameVersion {
  number: string;
  prevNumber: string;

  label?: string;
  aliases?: string[];
  parent: GameVersions;

  showTextmapChangelog?: boolean;
  showExcelChangelog?: boolean;
  showNewMedia?: boolean;

  hasChangelogSummary?: boolean;
  noPriorChangelog?: boolean;

  constructor(init?: Partial<GameVersion>) {
    Object.assign(this, init);

    if (!this.label) {
      this.label = this.number;
    }
    if (!this.aliases) {
      this.aliases = [];
    }
  }

  toJSON() {
    return {
      number: this.number,
      prevNumber: this.prevNumber,
      label: this.label,
      aliases: this.aliases,
      showTextmapChangelog: this.showTextmapChangelog,
      showExcelChangelog: this.showExcelChangelog,
      showNewMedia: this.showNewMedia,
      hasChangelogSummary: this.hasChangelogSummary,
      noPriorChangelog: this.noPriorChangelog,
    };
  }

  get displayLabel(): string {
    if (this.number == this.label) {
      return this.number;
    } else {
      return `${this.label} (${this.number})`;
    }
  }

  cssFriendlyNumber(): string {
    return this.number.replace(/\./g, '-');
  }

  prev(): GameVersion {
    return this.parent.list.find(v => v.number === this.prevNumber);
  }

  next(): GameVersion {
    return this.parent.list.find(v => v.prevNumber === this.number);
  }
}

export class GameVersions {
  constructor(readonly list: GameVersion[], readonly isTopLevel: boolean = false) {
    if (this.isTopLevel) {
      list.forEach(v => v.parent = this);
    }
  }

  get size(): number {
    return this.list.length;
  }

  isEmpty(): boolean {
    return !this.size;
  }

  get reversedList(): GameVersion[] {
    return this.list.slice().reverse();
  }

  where(predicate: (v: GameVersion) => boolean): GameVersions {
    return new GameVersions(this.list.filter(predicate));
  }

  has(v: string|GameVersion): boolean {
    if (v instanceof GameVersion) {
      v = v.number;
    }
    return !!this.get(v);
  }

  get(s: string): GameVersion {
    if (!s) {
      return null;
    }

    s = s.trim().toLowerCase();

    for (let v of this.list) {
      if (v.number === s || v.label.toLowerCase() == s || v.aliases.some(a => a.toLowerCase() === s)) {
        return v;
      }
    }
    return null;
  }

  labelForNumber(s: string): string {
    let v: GameVersion = this.get(s);
    return v ? v.label : s;
  }

  fromFilterString(param: any): GameVersions {
    if (isEmpty(param)) {
      return new GameVersions([]);
    }

    const initialVersions: string[] = String(param)
      .split(/[,;]/g)
      .map(s => s.trim())
      .filter(s => !!s);

    const finalVersions: GameVersion[] = [];

    for (let version of initialVersions) {
      if (this.has(version)) {
        finalVersions.push(this.get(version));
      } else if (version.includes('-')) {
        let split: string[] = version.split('-');

        if (split.length !== 2)
          throw 'Invalid version range: ' + version;

        let lowerbound: GameVersion = this.get(split[0].trim());
        let upperbound: GameVersion = this.get(split[1].trim());

        if (!lowerbound)
          throw `Lowerbound of version range is an unknown or unsupported version: ${split[0].trim()} (in version range: ${version})`;
        if (!upperbound)
          throw `Upperbound of version range is an unknown or unsupported version: ${split[1].trim()} (in version range: ${version})`;

        let cursor: GameVersion = lowerbound;
        finalVersions.push(cursor);

        let foundUpperbound: boolean = false;
        while (cursor && (cursor = cursor.next())) {
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

        if (!this.has(version)) {
          throw 'Unknown or unsupported version: ' + version;
        }

        let cursor: GameVersion = this.get(version);
        finalVersions.push(cursor);

        while (cursor && (cursor = cursor.next())) {
          finalVersions.push(cursor);
        }
      } else {
        throw new Error('Unknown or unsupported version: ' + version);
      }
    }

    return new GameVersions(finalVersions);
  }
}

// TODO: This needs to be updated with each new Genshin version!
export const GenshinVersions: GameVersions = new GameVersions([
  new GameVersion({number: '1.0', prevNumber: null, showNewMedia: true, noPriorChangelog: true}),
  new GameVersion({number: '1.1', prevNumber: '1.0', showNewMedia: true}),
  new GameVersion({number: '1.2', prevNumber: '1.1'}),
  new GameVersion({number: '1.3', prevNumber: '1.2'}),
  new GameVersion({number: '1.4', prevNumber: '1.3', showTextmapChangelog: false, noPriorChangelog: true}),
  new GameVersion({number: '1.5', prevNumber: '1.4', showTextmapChangelog: true, showNewMedia: true}),
  new GameVersion({number: '1.6', prevNumber: '1.5', showTextmapChangelog: true, showNewMedia: true}),

  new GameVersion({number: '2.0', prevNumber: '1.6', showTextmapChangelog: true, showNewMedia: true}),
  new GameVersion({number: '2.1', prevNumber: '2.0', showTextmapChangelog: true, showNewMedia: true}),
  new GameVersion({number: '2.2', prevNumber: '2.1', showTextmapChangelog: true, showNewMedia: true}),
  new GameVersion({number: '2.3', prevNumber: '2.2', showTextmapChangelog: true, showNewMedia: true}),
  new GameVersion({number: '2.4', prevNumber: '2.3', showTextmapChangelog: true, showNewMedia: true}),
  new GameVersion({number: '2.5', prevNumber: '2.4', showTextmapChangelog: true, showNewMedia: true}),
  new GameVersion({number: '2.6', prevNumber: '2.5', showTextmapChangelog: true, showNewMedia: true}),
  new GameVersion({number: '2.7', prevNumber: '2.6', showTextmapChangelog: true, showNewMedia: true}),
  new GameVersion({number: '2.8', prevNumber: '2.7', showTextmapChangelog: true, showNewMedia: true}),

  new GameVersion({number: '3.0', prevNumber: '2.8', showTextmapChangelog: true, showNewMedia: true}),
  new GameVersion({number: '3.1', prevNumber: '3.0', showTextmapChangelog: true, showNewMedia: true}),
  new GameVersion({number: '3.2', prevNumber: '3.1', showTextmapChangelog: true, showNewMedia: true}),
  new GameVersion({number: '3.3', prevNumber: '3.2', showTextmapChangelog: true, showNewMedia: true}),
  new GameVersion({number: '3.4', prevNumber: '3.3', showTextmapChangelog: true, showNewMedia: true}),
  new GameVersion({number: '3.5', prevNumber: '3.4', showTextmapChangelog: true, showNewMedia: true}),
  new GameVersion({number: '3.6', prevNumber: '3.5', showTextmapChangelog: true, showNewMedia: true}),
  new GameVersion({number: '3.7', prevNumber: '3.6', showTextmapChangelog: true, showNewMedia: true}),
  new GameVersion({number: '3.8', prevNumber: '3.7', showTextmapChangelog: true, showNewMedia: true}),

  new GameVersion({number: '4.0', prevNumber: '3.8', showTextmapChangelog: true, showExcelChangelog: true, showNewMedia: true, hasChangelogSummary: true}),
  new GameVersion({number: '4.1', prevNumber: '4.0', showTextmapChangelog: true, showExcelChangelog: true, showNewMedia: true, hasChangelogSummary: true}),
  new GameVersion({number: '4.2', prevNumber: '4.1', showTextmapChangelog: true, showExcelChangelog: true, showNewMedia: true, hasChangelogSummary: true}),
  new GameVersion({number: '4.3', prevNumber: '4.2', showTextmapChangelog: true, showExcelChangelog: true, showNewMedia: true, hasChangelogSummary: true}),
  new GameVersion({number: '4.4', prevNumber: '4.3', showTextmapChangelog: true, showExcelChangelog: true, showNewMedia: true, hasChangelogSummary: true}),
  new GameVersion({number: '4.5', prevNumber: '4.4', showTextmapChangelog: true, showExcelChangelog: true, showNewMedia: true, hasChangelogSummary: true}),
  new GameVersion({number: '4.6', prevNumber: '4.5', showTextmapChangelog: true, showExcelChangelog: true, showNewMedia: true, hasChangelogSummary: true}),
  new GameVersion({number: '4.7', prevNumber: '4.6', showTextmapChangelog: true, showExcelChangelog: true, showNewMedia: true, hasChangelogSummary: true}),
  new GameVersion({number: '4.8', prevNumber: '4.7', showTextmapChangelog: true, showExcelChangelog: true, showNewMedia: true, hasChangelogSummary: true}),
  new GameVersion({number: '5.0', prevNumber: '4.8', showTextmapChangelog: true, showExcelChangelog: true, showNewMedia: true, hasChangelogSummary: true}),
  new GameVersion({number: '5.1', prevNumber: '5.0', showTextmapChangelog: true, showExcelChangelog: true, showNewMedia: true, hasChangelogSummary: true}),
  new GameVersion({number: '5.2', prevNumber: '5.1', showTextmapChangelog: true, showExcelChangelog: true, showNewMedia: true, hasChangelogSummary: true}),
  new GameVersion({number: '5.3', prevNumber: '5.2', showTextmapChangelog: true, showExcelChangelog: true, showNewMedia: true, hasChangelogSummary: true}),
  new GameVersion({number: '5.4', prevNumber: '5.3', showTextmapChangelog: true, showExcelChangelog: true, showNewMedia: true, hasChangelogSummary: true}),
  new GameVersion({number: '5.5', prevNumber: '5.4', showTextmapChangelog: true, showExcelChangelog: true, showNewMedia: true, hasChangelogSummary: true}),
  new GameVersion({number: '5.6', prevNumber: '5.5', showTextmapChangelog: true, showExcelChangelog: true, showNewMedia: true, hasChangelogSummary: true}),
  new GameVersion({number: '5.7', prevNumber: '5.6', showTextmapChangelog: true, showExcelChangelog: true, showNewMedia: true, hasChangelogSummary: true}),
  new GameVersion({number: '5.8', prevNumber: '5.7', showTextmapChangelog: true, showExcelChangelog: true, showNewMedia: true, hasChangelogSummary: true}),
  new GameVersion({number: '6.0', prevNumber: '5.8', label: 'Luna I', aliases: ['Luna 1', 'L1'], showTextmapChangelog: true, showExcelChangelog: true, showNewMedia: true, hasChangelogSummary: true}),
], true);

// TODO: This needs to be updated with each new Honkai Star Rail version!
export const StarRailVersions: GameVersions = new GameVersions([
  new GameVersion({number: '1.0', prevNumber: null, showTextmapChangelog: true, noPriorChangelog: true, showNewMedia: true}),
  new GameVersion({number: '1.1', prevNumber: '1.0', showTextmapChangelog: true, showNewMedia: true}),
  new GameVersion({number: '1.2', prevNumber: '1.1', showTextmapChangelog: true, showNewMedia: true}),
  new GameVersion({number: '1.3', prevNumber: '1.2', showTextmapChangelog: true}),
  new GameVersion({number: '1.4', prevNumber: '1.3', showTextmapChangelog: true, showNewMedia: true}),
  new GameVersion({number: '1.5', prevNumber: '1.4', showTextmapChangelog: true, showNewMedia: true}),
  new GameVersion({number: '1.6', prevNumber: '1.5', showTextmapChangelog: true, showNewMedia: true}),
  new GameVersion({number: '2.0', prevNumber: '1.6', showTextmapChangelog: true}),
  new GameVersion({number: '2.1', prevNumber: '2.0', showTextmapChangelog: true}),
  new GameVersion({number: '2.2', prevNumber: '2.1', showTextmapChangelog: true, showNewMedia: true}),
  new GameVersion({number: '2.3', prevNumber: '2.2', showTextmapChangelog: true, showNewMedia: true}),
  new GameVersion({number: '2.4', prevNumber: '2.3', showTextmapChangelog: true, showNewMedia: true}),
  new GameVersion({number: '2.5', prevNumber: '2.4', showTextmapChangelog: true, showNewMedia: true}),
  new GameVersion({number: '2.6', prevNumber: '2.5', showTextmapChangelog: true, showNewMedia: true}),
  new GameVersion({number: '2.7', prevNumber: '2.6', showTextmapChangelog: true, showNewMedia: true}),
  new GameVersion({number: '3.0', prevNumber: '2.7', showTextmapChangelog: true, showNewMedia: true}),
  new GameVersion({number: '3.1', prevNumber: '3.0', showTextmapChangelog: false, showNewMedia: true, noPriorChangelog: true}),
  new GameVersion({number: '3.2', prevNumber: '3.1', showTextmapChangelog: true, showNewMedia: true}),
  new GameVersion({number: '3.3', prevNumber: '3.2', showTextmapChangelog: true, showNewMedia: true}),
  new GameVersion({number: '3.4', prevNumber: '3.3', showTextmapChangelog: true, showNewMedia: true}),
  new GameVersion({number: '3.5', prevNumber: '3.4', showTextmapChangelog: true, showNewMedia: true}),
  new GameVersion({number: '3.6', prevNumber: '3.5', showTextmapChangelog: true}),
], true);

// TODO: This needs to be updated with each new Zenless Zone Zero version!
export const ZenlessVersions: GameVersions = new GameVersions([
  new GameVersion({number: '1.0', prevNumber: '0.0', showTextmapChangelog: true, noPriorChangelog: true}),
  new GameVersion({number: '1.1', prevNumber: '1.0', showTextmapChangelog: true}),
  new GameVersion({number: '1.2', prevNumber: '1.1', showTextmapChangelog: true}),
  new GameVersion({number: '1.3', prevNumber: '1.2', showTextmapChangelog: true}),
  new GameVersion({number: '1.4', prevNumber: '1.3', showTextmapChangelog: true}),
  new GameVersion({number: '1.5', prevNumber: '1.4', showTextmapChangelog: true}),
  new GameVersion({number: '1.6', prevNumber: '1.5', showTextmapChangelog: true}),
  new GameVersion({number: '1.7', prevNumber: '1.6', showTextmapChangelog: true}),
  new GameVersion({number: '2.0', prevNumber: '1.7', showTextmapChangelog: true}),
  new GameVersion({number: '2.1', prevNumber: '2.0', showTextmapChangelog: true}),
  new GameVersion({number: '2.2', prevNumber: '2.1', showTextmapChangelog: true}),
], true);

// TODO: This needs to be updated with each new Wuthering Waves version!
export const WuwaVersions: GameVersions = new GameVersions([
  new GameVersion({number: '1.0', prevNumber: null, showTextmapChangelog: true, noPriorChangelog: true}),
  new GameVersion({number: '1.1', prevNumber: '1.0', showTextmapChangelog: true}),
  new GameVersion({number: '1.2', prevNumber: '1.1', showTextmapChangelog: true}),
  new GameVersion({number: '1.3', prevNumber: '1.2', showTextmapChangelog: true}),
  new GameVersion({number: '1.4', prevNumber: '1.3', showTextmapChangelog: true}),
  new GameVersion({number: '2.0', prevNumber: '1.4', showTextmapChangelog: true}),
  new GameVersion({number: '2.1', prevNumber: '2.0', showTextmapChangelog: true}),
  new GameVersion({number: '2.2', prevNumber: '2.1', showTextmapChangelog: true}),
  new GameVersion({number: '2.3', prevNumber: '2.2', showTextmapChangelog: true}),
  new GameVersion({number: '2.4', prevNumber: '2.3', showTextmapChangelog: true}),
  new GameVersion({number: '2.5', prevNumber: '2.4', showTextmapChangelog: true}),
  new GameVersion({number: '2.6', prevNumber: '2.5', showTextmapChangelog: true}),
], true);

// TODO: This needs to be updated with each new Genshin version!
export const CurrentGenshinVersion: GameVersion = GenshinVersions.get('6.0');

// TODO: This needs to be updated with each new Honkai Star Rail version!
export const CurrentStarRailVersion: GameVersion = StarRailVersions.get('3.6');

// TODO: This needs to be updated with each new Zenless Zone Zero version!
export const CurrentZenlessVersion: GameVersion = ZenlessVersions.get('2.2');

// TODO: This needs to be updated with each new Wuthering Waves version!
export const CurrentWuwaVersion: GameVersion = WuwaVersions.get('2.6');

if (!CurrentGenshinVersion) throw 'Fatal configuration error in setting current Genshin Version';
if (!CurrentStarRailVersion) throw 'Fatal configuration error in setting current Star Rail Version';
if (!CurrentZenlessVersion) throw 'Fatal configuration error in setting current Zenless Version';
if (!CurrentWuwaVersion) throw 'Fatal configuration error in setting current Wuthering Waves Version';
