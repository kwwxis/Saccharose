import '../../loadenv';
import { Control, getControl, normText } from '../script_util';
import { pathToFileURL } from 'url';
import { loadEnglishTextMap } from '../textmap';
import util from 'util';
import { closeKnex } from '../../util/db';
import { defaultMap } from '../../../shared/util/genericUtil';
import { fileFormatOptionsApply, fileFormatOptionsCheck } from '../../util/fileFormatOptions';
import {
  PushTipsCodexExcelConfigData,
  PushTipsCodexType,
  PushTipsConfigData,
  TutorialDetailExcelConfigData,
  TutorialExcelConfigData,
  TutorialsByType,
} from '../../../shared/types/tutorial-types';

export function pushTipCodexTypeName(type: PushTipsCodexType): string {
  switch (type) {
    case 'CODEX_ADVENTURE':
      return 'Adventure';
    case 'CODEX_ARANARA':
      return 'Aranara';
    case 'CODEX_ELEMENT':
      return 'Elemental Reactions';
    case 'CODEX_ENEMY':
      return 'Enemies';
    case 'CODEX_SYSTEM':
      return 'System';
    case 'CODEX_UNRECORDED':
      return 'Unrecorded';
    default:
      return '';
  }
}
function pushTipsIcon(iconName: string) {
  return 'Icon Tutorial '+iconName.split('_').pop() + '.png';
}

export const TUTORIAL_FILE_FORMAT_PARAMS: string[] = [
  'Id',
  'PushTip.PushTipsId',
  'PushTip.TutorialId',
  'PushTip.RewardId',
  'PushTip.PushTipsType',
  'PushTip.CodexType',
  'PushTip.TitleTextMapHash',
  'PushTip.SubtitleTextMapHash',
  'PushTip.TitleText',
  'PushTip.SubtitleText',
  'PushTip.GroupId',
  'PushTip.ShowIcon',
  'PushTip.TabIcon',
  'PushTip.Codex.Id',
  'PushTip.Codex.PushTipId',
  'PushTip.Codex.SortOrder',
  'DetailCount',
  'CurrentDetail.Id',
  'CurrentDetail.Index1based',
  'CurrentDetail.Index0based',
  'CurrentDetail.DescriptTextMapHash',
  'CurrentDetail.DescriptText'
];

export const TUTORIAL_DEFAULT_FILE_FORMAT_IMAGE = 'Tutorial {PushTip.TitleText.EN}{{If|DetailCount > 1| {CurrentDetail.Index1based}|}}.png';

export async function selectTutorials(ctrl: Control, codexTypeConstraint?: PushTipsCodexType): Promise<TutorialsByType> {
  let tutorials: TutorialExcelConfigData[] = await ctrl.readGenshinDataFile('./ExcelBinOutput/TutorialExcelConfigData.json');
  let tutorialDetails: TutorialDetailExcelConfigData[] = await ctrl.readGenshinDataFile('./ExcelBinOutput/TutorialDetailExcelConfigData.json');

  let pushTips: PushTipsConfigData[] = await ctrl.readGenshinDataFile('./ExcelBinOutput/PushTipsConfigData.json');
  let pushTipsCodex: PushTipsCodexExcelConfigData[] = await ctrl.readGenshinDataFile('./ExcelBinOutput/PushTipsCodexExcelConfigData.json');

  for (let pushTip of pushTips) {
    pushTip.Codex = pushTipsCodex.find(c => c.PushTipId === pushTip.PushTipsId);
  }

  let ret: TutorialsByType = defaultMap('Array');

  for (let tutorial of tutorials) {
    tutorial.PushTip = pushTips.find(p => p.TutorialId === tutorial.Id);
    tutorial.DetailList = tutorial.DetailIdList.map(id => tutorialDetails.find(d => d.Id === id));

    if (!tutorial.PushTip) {
      continue;
    }

    let codexType = pushTipCodexTypeName(tutorial.PushTip.CodexType);
    let tipsIcon = pushTipsIcon(tutorial.PushTip.TabIcon);

    if (codexTypeConstraint && tutorial.PushTip.CodexType !== codexTypeConstraint) {
      continue;
    }

    let text = `
{{Tutorial
|title    = ${tutorial.PushTip.TitleText || ''}
|subtitle = ${tutorial.PushTip.SubtitleText || ''}
|type     = ${codexType || ''}
|icon     = ${tipsIcon || ''}
|about    =`;
    for (let i = 0; i < tutorial.DetailList.length; i++) {
      let detail = tutorial.DetailList[i];
      let imageName = fileFormatOptionsApply(
        ctrl.state.Request,
        Object.assign(
          {CurrentDetail: Object.assign({Index1based: i+1, Index0based: i}, detail), DetailCount: tutorial.DetailList.length},
          tutorial
        ),
        'FileFormat.tutorial.image',
        TUTORIAL_DEFAULT_FILE_FORMAT_IMAGE
      );
      text += '\n|' + ('text' + (i+1)).padEnd(9, ' ') + '= ' + normText(detail.DescriptText, ctrl.outputLangCode);
      text += '\n|' + ('image' + (i+1)).padEnd(9, ' ') + '= ' + (imageName || '');
    }
    text += '\n|sort     = ' + (tutorial.PushTip?.Codex?.SortOrder || '');
    text += '\n}}';
    tutorial.Wikitext = fileFormatOptionsCheck(text);
    if (!codexType) {
      codexType = 'Uncategorized';
    }
    ret[codexType].push(tutorial);
  }

  return ret;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await loadEnglishTextMap();

  const ctrl = getControl();
  const ret = await selectTutorials(ctrl);
  console.log(util.inspect(ret, false, null, true));

  await closeKnex();
}