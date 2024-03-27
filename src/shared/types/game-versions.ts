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
];

// TODO: This needs to be updated with each new Zenless Zone Zero version!
export const ZenlessVersions: GameVersion[] = [
  {number: '0.13', previous: null},
  {number: '0.2.0', previous: '0.13'},
];

// TODO: This needs to be updated with each new Genshin version!
export const CurrentGenshinVersion: GameVersion = GenshinVersions.find(v => v.number === '4.5');

// TODO: This needs to be updated with each new Honkai Star Rail version!
export const CurrentStarRailVersion: GameVersion = StarRailVersions.find(v => v.number === '2.1');

// TODO: This needs to be updated with each new Zenless Zone Zero version!
export const CurrentZenlessVersion: GameVersion = ZenlessVersions.find(v => v.number === '0.2.0');

if (!CurrentGenshinVersion) throw 'Fatal configuration error in setting current Genshin Version';
if (!CurrentStarRailVersion) throw 'Fatal configuration error in setting current Star Rail Version';
if (!CurrentZenlessVersion) throw 'Fatal configuration error in setting current Zenless Version';
