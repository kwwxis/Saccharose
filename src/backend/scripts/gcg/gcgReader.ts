import '../../loadenv';
import { Control, getControl, normText } from '../script_util';
import { cached } from '../../util/cache';
import { GCGTalkDetailExcelConfigData } from '../../../shared/types/gcg-types';
import { getTextMapItem, getVoPrefix, loadEnglishTextMap, loadVoiceItems } from '../textmap';
import { AvatarExcelConfigData } from '../../../shared/types/general-types';
import { DialogueSectionResult } from '../dialogue/dialogue_util';
import { MetaProp } from '../../util/metaProp';


export async function fetchGCGTalkDetail(ctrl: Control): Promise<GCGTalkDetailExcelConfigData[]> {
  return cached('GCGTalk_' + ctrl.outputLangCode, async () => {
    let json: any[] = await ctrl.readGenshinDataFile('./ExcelBinOutput/GCGTalkDetailExcelConfigData.json');

    let result: GCGTalkDetailExcelConfigData[] = [];
    for (let row of json) {
      let text: string;
      let textMapId: number;

      for (let id of row[Object.keys(row).find(k => k.startsWith('OK'))]) {
        text = getTextMapItem(ctrl.outputLangCode, id);
        textMapId = id;
        if (text) {
          break;
        }
      }

      let voPrefix = getVoPrefix('Card', row.TalkDetailId, null, null, false);
      let SpeakerId: number = row[Object.keys(row).find(k => k.startsWith('CP'))].find(x => !!x);
      let avatar: AvatarExcelConfigData;
      if (SpeakerId) {
        avatar = await ctrl.selectAvatarById(SpeakerId);
      }

      if (!SpeakerId && !text && !voPrefix) {
        continue;
      }

      result.push({
        TalkDetailId: row.TalkDetailId,
        SpeakerId: SpeakerId,
        Avatar: avatar,
        Text: text,
        TextMapHash: textMapId,
        VoPrefix: voPrefix,
      })
    }
    return result;
  });
}

export async function generateGCGTutorialDialogue(ctrl: Control): Promise<DialogueSectionResult> {
  return cached('GCGTutorialText_' + ctrl.outputLangCode, async () => {
    let json: any[] = await ctrl.readGenshinDataFile('./ExcelBinOutput/GCGTutorialTextExcelConfigData.json');
    let sect = new DialogueSectionResult(null, 'TCG Tutorial Text');
    sect.wikitext = '';
    sect.showGutter = true;

    for (let row of json) {
      let voiceId = row[Object.keys(row).find(k => k.startsWith('LF'))];
      let textMapHash = row[Object.keys(row).find(k => k.startsWith('AF'))];
      let text = getTextMapItem(ctrl.outputLangCode, textMapHash);
      text = normText(text, ctrl.outputLangCode);

      let voPrefix = getVoPrefix('Card', voiceId, null, null, false);

      sect.wikitext += `${voPrefix}${text}`;
      sect.wikitext += `\n`;
    }

    sect.wikitext = sect.wikitext.trim();

    return sect;
  });
}

export type GCGTalkDetailDialogue = {[SpeakerId: number]: {dialogue: DialogueSectionResult, avatar?: AvatarExcelConfigData, speakerId: number}};

export async function generateGCGTalkDetailDialogue(ctrl: Control, details: GCGTalkDetailExcelConfigData[]): Promise<GCGTalkDetailDialogue> {
  let result: GCGTalkDetailDialogue = {};
  for (let detail of details) {

    if (!result[detail.SpeakerId]) {
      result[detail.SpeakerId] = {
        dialogue: new DialogueSectionResult('TalkDetail_'+detail.TalkDetailId, detail?.Avatar?.NameText || String(detail.SpeakerId)),
        avatar: detail.Avatar,
        speakerId: detail.SpeakerId,
      }
      result[detail.SpeakerId].dialogue.metadata.push(new MetaProp('Speaker ID', detail.SpeakerId));
      result[detail.SpeakerId].dialogue.wikitext = '';
      result[detail.SpeakerId].dialogue.showGutter = true;
    } else {
      result[detail.SpeakerId].dialogue.wikitext += '\n';
    }

    const sect = result[detail.SpeakerId].dialogue;
    delete detail.Avatar;
    delete detail.SpeakerId;

    sect.wikitext += `${detail.VoPrefix}${normText(detail.Text, ctrl.outputLangCode)}`;
  }
  return result;
}

if (require.main === module) {
  (async () => {
    await loadEnglishTextMap();
    await loadVoiceItems();

    const ctrl = getControl();
    const details = await fetchGCGTalkDetail(getControl());
    console.log(generateGCGTalkDetailDialogue(ctrl, details));
  })();
}