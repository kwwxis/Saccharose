import '../../../loadenv.ts';
import { GenshinControl, getGenshinControl } from '../genshinControl.ts';
import { pathToFileURL } from 'url';
import util from 'util';
import { closeKnex } from '../../../util/db.ts';
import { defaultMap } from '../../../../shared/util/genericUtil.ts';
import { fileFormatOptionsApply, fileFormatOptionsCheck } from '../../../util/fileFormatOptions.ts';
import {
  NewActivityPushTipsConfigData,
  PushTipsCodexExcelConfigData,
  PushTipsCodexType,
  PushTipsConfigData,
  TutorialDetailExcelConfigData,
  TutorialExcelConfigData,
  TutorialsByType,
} from '../../../../shared/types/genshin/tutorial-types.ts';
import { isInt, toInt } from '../../../../shared/util/numberUtil.ts';
import { escapeRegExp } from '../../../../shared/util/stringUtil.ts';
import { Marker } from '../../../../shared/util/highlightMarker.ts';
export function pushTipCodexTypeName(type: PushTipsCodexType): string {
  if (!type) {
    return 'Non-PushTip';
  }
  switch (type) {
    case 'CODEX_ADVENTURE':
      return 'Adventure';
    case 'CODEX_ARANARA':
      return 'Aranara';
    case 'CODEX_ELEMENT':
      return 'Elements';
    case 'CODEX_ENEMY':
      return 'Enemies';
    case 'CODEX_SYSTEM':
      return 'System';
    case 'CODEX_UNRECORDED':
      return 'Unrecorded';
    case 'CODEX_NEWACTIVITY':
      return 'Event';
    case 'CODEX_NONPUSH':
      return 'Non-PushTip';
    default:
      return '';
  }
}
function pushTipsIcon(iconName: string) {
  return iconName ? 'Icon Tutorial '+iconName.split('_').pop() + '.png' : '';
}

export const TUTORIAL_FILE_FORMAT_PARAMS: string[] = [
  'Id',
  'PushTip.PushTipsId',
  'PushTip.TutorialId',
  'PushTip.CodexType',
  'PushTip.TitleTextMapHash',
  'PushTip.SubtitleTextMapHash',
  'PushTip.TitleText',
  'PushTip.SubtitleText',
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

export const TUTORIAL_DEFAULT_FILE_FORMAT_IMAGE =
  'Tutorial {{Var|PushTip.TitleText.EN|{Id}}}{{If|DetailCount > 1| {CurrentDetail.Index1based}|}}.png';

/**
 * Searches tutorials, returning a list of tutorial IDs.
 */
export async function searchTutorials(ctrl: GenshinControl, searchText: string): Promise<number[]> {
  const ids = [];

  if (isInt(searchText)) {
    ids.push(toInt(searchText));
  }

  await ctrl.streamTextMapMatchesWithIndex(ctrl.inputLangCode, searchText, 'Tutorial', (id) => {
    ids.push(id);
  }, ctrl.searchModeFlags);

  return ids;
}

export async function selectTutorials(ctrl: GenshinControl,
                                      codexTypeConstraint?: PushTipsCodexType,
                                      tutorialIdConstraint?: number[],
                                      highlightQuery?: string): Promise<TutorialsByType> {
  if (tutorialIdConstraint && tutorialIdConstraint.length === 0) {
    return {};
  }

  let tutorials: TutorialExcelConfigData[] = await ctrl.readDataFile('./ExcelBinOutput/TutorialExcelConfigData.json');
  let tutorialDetails: TutorialDetailExcelConfigData[] = await ctrl.readDataFile('./ExcelBinOutput/TutorialDetailExcelConfigData.json');

  let pushTips: PushTipsConfigData[] = await ctrl.readDataFile('./ExcelBinOutput/PushTipsConfigData.json');
  let pushTipsCodex: PushTipsCodexExcelConfigData[] = await ctrl.readDataFile('./ExcelBinOutput/PushTipsCodexExcelConfigData.json');

  let eventPushTips: NewActivityPushTipsConfigData[] = await ctrl.readDataFile('./ExcelBinOutput/NewActivityPushTipsConfigData.json');

  for (let pushTip of pushTips) {
    pushTip.Codex = pushTipsCodex.find(c => c.PushTipId === pushTip.PushTipsId);
  }

  let ret: TutorialsByType = defaultMap('Array');

  for (let tutorial of tutorials) {
    if (tutorialIdConstraint && !tutorialIdConstraint.includes(tutorial.Id)) {
      continue;

    }
    tutorial.PushTip = pushTips.find(p => p.TutorialId === tutorial.Id);

    if (!tutorial.PushTip) {
      tutorial.PushTip = eventPushTips.find(p => p.TutorialId === tutorial.Id);
      if (tutorial.PushTip) {
        tutorial.PushTip.CodexType = 'CODEX_NEWACTIVITY';
      }
    }
    if (tutorial.PushTip) {
      tutorial.CodexType = tutorial.PushTip.CodexType;
    } else {
      tutorial.CodexType = 'CODEX_NONPUSH';
    }

    tutorial.DetailList = tutorial.DetailIdList
      .map(id => tutorialDetails.find(d => d.Id === id))
      .filter(x => !!x);
    tutorial.Images = [];

    let codexTypeName = pushTipCodexTypeName(tutorial.CodexType);
    let tipsIcon = pushTipsIcon(tutorial.PushTip?.TabIcon);

    if (codexTypeConstraint && tutorial.CodexType !== codexTypeConstraint) {
      continue;
    }

    let text = `{{Tutorial`;

    if (tutorial.CodexType === 'CODEX_NONPUSH') {
      text += `\n|title    = `;
    } else {
      text += `\n|title    = ${tutorial.PushTip?.TitleText || ''}`;
      text += `\n|subtitle = ${tutorial.PushTip?.SubtitleText || ''}`;
      if (tutorial.CodexType !== 'CODEX_NEWACTIVITY') {
        text += `\n|type     = ${codexTypeName || ''}`;
      }
      text += `\n|icon     = ${tipsIcon || ''}`;
    }
    if (tutorial.CodexType === 'CODEX_NEWACTIVITY') {
      text += `\n|about    = ` + await ctrl.selectNewActivityName((<NewActivityPushTipsConfigData> tutorial.PushTip).ActivityId);
    } else {
      text += `\n|about    = `;
    }

    for (let i = 0; i < tutorial.DetailList.length; i++) {
      let detail = tutorial.DetailList[i];
      let imageName = await fileFormatOptionsApply(
        ctrl,
        Object.assign(
          {CurrentDetail: Object.assign({Index1based: i+1, Index0based: i}, detail), DetailCount: tutorial.DetailList.length},
          tutorial
        ),
        'FileFormat.tutorial.image',
        TUTORIAL_DEFAULT_FILE_FORMAT_IMAGE
      );
      text += '\n|' + ('text' + (i+1)).padEnd(9, ' ') + '= ' + ctrl.normText(detail.DescriptText, ctrl.outputLangCode);
      text += '\n|' + ('image' + (i+1)).padEnd(9, ' ') + '= ' + (imageName || '');
      for (let originalName of detail.ImageNameList) {
        tutorial.Images.push({ originalName, downloadName: imageName });
      }
    }
    if (tutorial.CodexType !== 'CODEX_NONPUSH' && tutorial.CodexType !== 'CODEX_NEWACTIVITY') {
      text += '\n|sort     = ' + (tutorial.PushTip?.Codex?.SortOrder || '');
    }
    text += '\n}}';
    tutorial.Wikitext = fileFormatOptionsCheck(text);

    if (highlightQuery && ctrl.inputLangCode === ctrl.outputLangCode) {
      let reFlags: string = ctrl.searchModeFlags.includes('i') ? 'gi' : 'g';
      let isRegexQuery: boolean = ctrl.searchMode === 'R' || ctrl.searchMode === 'RI';
      let re = new RegExp(isRegexQuery ? highlightQuery : escapeRegExp(highlightQuery), reFlags);

      let inMarkableLine: boolean  = false;

      tutorial.WikitextMarkers = Marker.create(re, tutorial.Wikitext, (line) => {
        if (line.startsWith('|title') || line.startsWith('|text')) {
          inMarkableLine = true;
        } else if (line.startsWith('|')) {
          inMarkableLine = false;
        }
        return {skip: !inMarkableLine};
      });
    }

    if (!codexTypeName) {
      codexTypeName = 'Uncategorized';
    }
    ret[codexTypeName].push(tutorial);
  }

  return ret;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const ctrl = getGenshinControl();
  const ret = await selectTutorials(ctrl);
  console.log(util.inspect(ret, false, null, true));

  await closeKnex();
}