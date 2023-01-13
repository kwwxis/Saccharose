import '../../loadenv';
import { Control, getControl, normText } from '../script_util';
import { cached } from '../../util/cache';
import { GCGTalkDetailExcelConfigData } from '../../../shared/types/gcg-types';
import { getTextMapItem, getVoPrefix, loadEnglishTextMap, loadVoiceItems } from '../textmap';
import { AvatarExcelConfigData } from '../../../shared/types/general-types';
import { DialogueSectionResult } from '../dialogue/dialogue_util';
import { MetaProp } from '../../util/metaProp';
import { pathToFileURL } from 'url';
import util from 'util';
import { closeKnex } from '../../util/db';
import { Marker } from '../../../shared/util/highlightMarker';


export async function fetchGCGTalkDetail(ctrl: Control): Promise<GCGTalkDetailExcelConfigData[]> {
  return cached('GCGTalk_' + ctrl.outputLangCode, async () => {
    let json: any[] = await ctrl.readGenshinDataFile('./ExcelBinOutput/GCGTalkDetailExcelConfigData.json');

    let result: GCGTalkDetailExcelConfigData[] = [];
    for (let row of json) {
      let text: string[] = [];
      let textMapHash: number[] = [];

      for (let id of row[Object.keys(row).find(k => k.startsWith('OK'))]) {
        let checkText = getTextMapItem(ctrl.outputLangCode, id);
        if (checkText) {
          text.push(checkText);
          textMapHash.push(id);
        }
      }

      let voPrefix = getVoPrefix('Card', row.TalkDetailId, null, null, false);
      let SpeakerId: number = row[Object.keys(row).find(k => k.startsWith('CP'))].find(x => !!x);
      let avatar: AvatarExcelConfigData;
      if (SpeakerId) {
        avatar = await ctrl.selectAvatarById(SpeakerId);
      }

      if (!SpeakerId && !text) {
        continue;
      }

      result.push({
        TalkDetailId: row.TalkDetailId,
        SpeakerId: SpeakerId,
        Avatar: avatar,
        Text: text,
        TextMapHash: textMapHash,
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
    }

    const sect = result[detail.SpeakerId].dialogue;
    delete detail.Avatar;
    delete detail.SpeakerId;

    if (detail.Text.length === 1) {
      sect.wikitext += `\n`;
      sect.wikitext += `${detail.VoPrefix}${normText(detail.Text[0], ctrl.outputLangCode)}`;
    } else {
      let texts = [];
      if (detail.VoPrefix) {
        texts.push(detail.VoPrefix);
      }
      for (let text of detail.Text) {
        texts.push(normText(text, ctrl.outputLangCode));
      }
      sect.wikitextArray.push({
        wikitext: texts.join('\n')
      });
    }
  }
  return result;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    await loadEnglishTextMap();
    await loadVoiceItems();

    const ctrl = getControl();
    const details = await fetchGCGTalkDetail(getControl());
    console.log(util.inspect(details.filter(d => d.SpeakerId === 40000002), false, null, true));
    // console.log(generateGCGTalkDetailDialogue(ctrl, details));
    await closeKnex();
  })();
}