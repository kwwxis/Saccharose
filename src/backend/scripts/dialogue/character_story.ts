import '../../loadenv';
import { closeKnex } from '../../util/db';
import { Control, getControl, grep, nameNormMap, normText } from '../../scripts/script_util';
import config from '../../config';
import {promises as fs} from 'fs';
import { AvatarExcelConfigData, FetterStoryExcelConfigData } from '../../util/types';
import {cached} from '../../util/cache';
import { getTextMapItem, loadTextMaps } from '../textmap';
import util from 'util';
import { escapeHtml } from '../../../shared/functions';

export type AvatarAndFetterStoryExcelConfigData = {avatar: AvatarExcelConfigData, fetters: FetterStoryExcelConfigData[]};
export type GroupedFetterStoryExcelConfigData = {[avatarId: number]: AvatarAndFetterStoryExcelConfigData};

const sep = '</p><!--\n              --><p>';

export async function fetchCharacterStories(ctrl: Control): Promise<GroupedFetterStoryExcelConfigData> {
  const fetters = await cached('FetterStoryExcelConfigData_'+ctrl.outputLangCode, async () => {
    let json: any[] = await fs.readFile(config.database.getGenshinDataFilePath('./ExcelBinOutput/FetterStoryExcelConfigData.json'), {encoding: 'utf8'})
      .then(data => JSON.parse(data));
    let records: FetterStoryExcelConfigData[] = await ctrl.commonLoad(json);
    for (let fetter of records) {
      if (fetter.openConds && fetter.openConds[0] && fetter.openConds[0].condType === 'FETTER_COND_FETTER_LEVEL') {
        fetter.friendship = fetter.openConds[0].paramList[0];
      }
      fetter.storyContextHtml = '<p>'+fetter.storyContextText.split('\\n').map(s => escapeHtml(normText(s), true)).join(sep)+'</p>';
    }
    return records;
  });

  const groupedFetters = await cached('GroupedFetterStoryExcelConfigData_'+ctrl.outputLangCode, async () => {
    let out: GroupedFetterStoryExcelConfigData = {};
    for (let fetter of fetters) {
      if (!out.hasOwnProperty(fetter.avatarId)) {
        out[fetter.avatarId] = {avatar: await ctrl.selectAvatarById(fetter.avatarId), fetters: []};
      }
      out[fetter.avatarId].fetters.push(fetter);
    }
    return out;
  });

  return groupedFetters;
}

export async function fetchCharacterStoryByAvatarId(ctrl: Control, avatarId: number): Promise<AvatarAndFetterStoryExcelConfigData> {
  let storiesByAvatar = await fetchCharacterStories(ctrl);
  let story = storiesByAvatar[avatarId];
  return story;
}

export async function fetchCharacterStoryByAvatarName(ctrl: Control, avatarName: string): Promise<AvatarAndFetterStoryExcelConfigData> {
  let avatarNameNorm = avatarName.replaceAll(/_/g, ' ').toLowerCase().trim();
  let storiesByAvatar = await fetchCharacterStories(ctrl);
  let story = Object.values(storiesByAvatar).find(x => x.avatar.NameText.toLowerCase() == avatarNameNorm);
  return story;
}

if (require.main === module) {
  (async () => {
    await loadTextMaps();
    const res = await fetchCharacterStories(getControl());
    console.log(util.inspect(res, false, null, true));
    closeKnex();
  })();
}