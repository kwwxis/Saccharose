import '../../loadenv';
import {Control, getControl, normText} from "../script_util";
import { pathToFileURL } from 'url';
import { loadEnglishTextMap } from '../textmap';
import util from 'util';
import { closeKnex } from '../../util/db';
import { defaultMap } from '../../../shared/util/genericUtil';

export type PushTipsCodexType = 'CODEX_ADVENTURE' | 'CODEX_ARANARA' | 'CODEX_ELEMENT' | 'CODEX_ENEMY' | 'CODEX_SYSTEM' | 'CODEX_UNRECORDED';
function pushTipCodexTypeName(type: PushTipsCodexType) {
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
    default:
      return '';
  }
}
function pushTipsIcon(iconName: string) {
  return 'Icon Tutorial '+iconName.split('_').pop() + '.png';
}

export interface PushTipsConfigData {
  PushTipsId: number,
  TutorialId: number,
  RewardId: number,

  PushTipsType: 'PUSH_TIPS_MONSTER' | 'PUSH_TIPS_TUTORIAL',
  CodexType?: PushTipsCodexType,

  TitleTextMapHash: number,
  SubtitleTextMapHash: number,
  TitleText: string,
  TitleTextEN: string,
  SubtitleText: string,

  ShowImmediately: boolean,
  GroupId: number,
  ShowIcon?: string,
  TabIcon: string,

  Codex?: PushTipsCodexExcelConfigData,
}
export interface PushTipsCodexExcelConfigData {
  Id: number,
  PushTipId: number,
  SortOrder: number,
}

export interface TutorialExcelConfigData {
  Id: number,
  DetailIdList: number[],
  MobileDetailIdList: number[],
  JoypadDetailIdList: number[],
  PauseGame: boolean,
  IsMultiPlatform: boolean,

  DetailList?: TutorialDetailExcelConfigData[],
  PushTip?: PushTipsConfigData,
  Wikitext?: string,
}
export interface TutorialCatalogExcelConfigData {
  Id: number,
  PushTipsId: number,
  TitleTextMapHash: number,
  TitleText: string,
  TitleTextEN: string,
}
export interface TutorialDetailExcelConfigData {
  Id: number,
  ImageNameList: string[],
  DescriptTextMapHash: number,
  DescriptText: string,
}

export type TutorialsByType = {[type: string]: TutorialExcelConfigData[]};

export async function selectTutorials(ctrl: Control): Promise<TutorialsByType> {
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

    let text = `
{{Tutorial
|title    = ${tutorial.PushTip.TitleText}
|subtitle = ${tutorial.PushTip.SubtitleText}
|type     = ${codexType}
|icon     = ${tipsIcon}
|about    =`;
    for (let i = 0; i < tutorial.DetailList.length; i++) {
      let detail = tutorial.DetailList[i];
      let imageName = (tutorial.DetailList.length === 1) ? 'Tutorial ' + tutorial.PushTip.TitleText + '.png' : 'Tutorial ' + tutorial.PushTip.TitleText + ' ' + (i+1) + '.png';
      text += '\n|' + ('text' + (i+1)).padEnd(9, ' ') + '= ' + normText(detail.DescriptText, ctrl.outputLangCode);
      text += '\n|' + ('image' + (i+1)).padEnd(9, ' ') + '= ' + imageName;
    }
    text += '\n|sort     = ' + tutorial.PushTip?.Codex?.SortOrder;
    text += '\n}}';
    tutorial.Wikitext = text.trim();
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