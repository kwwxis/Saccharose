import '../../setup';
import {Control, getControl, normText} from "../script_util";
import {getTextMapItem, getVoPrefix, loadEnglishTextMap, loadVoiceItems} from "../textmap";
import { closeKnex } from '@db';
import { DialogExcelConfigData } from '@types';
import config from '@/config';
import {promises as fs} from 'fs';
import{schema, normalizeRawJson} from '../importer/import_run';

if (require.main === module) {
  (async () => {
    await loadEnglishTextMap();
    await loadVoiceItems();
    let ctrl: Control = getControl();

    let filePath = config.database.getGenshinDataFilePath('./ExcelBinOutput/DialogExcelConfigData.json');
    let result: any[] = await fs.readFile(filePath, {encoding: 'utf8'}).then(data => JSON.parse(data));

    let out = '';

    for (let row of result) {
      let dialog: DialogExcelConfigData = normalizeRawJson(row, schema.DialogExcelConfigData);
      let text: string = normText(getTextMapItem('EN', dialog.TalkContentTextMapHash));
      let voPrefix = getVoPrefix('Dialog', dialog.Id, text, dialog.TalkRole.Type);

      if (!voPrefix || !voPrefix.includes('<!--') || !text) {
        continue;
      }

      if (dialog.TalkRole.Type === 'TALK_ROLE_NPC' || dialog.TalkRole.Type === 'TALK_ROLE_GADGET') {
        dialog.TalkRoleNameText = getTextMapItem('EN', dialog.TalkRoleNameTextMapHash);

        if (!dialog.TalkRoleNameText && !!dialog.TalkRole) {
          let npc = await ctrl.getNpc(typeof dialog.TalkRole.Id === 'string' ? parseInt(dialog.TalkRole.Id) : dialog.TalkRole.Id);
          if (npc) {
            dialog.TalkRole.NameTextMapHash = npc.NameTextMapHash;
            dialog.TalkRole.NameText = npc.NameText;
          }

          dialog.TalkRoleNameText = getTextMapItem('EN', dialog.TalkRole.NameTextMapHash);
        }

        out += `\n${dialog.Id} :${voPrefix}'''${dialog.TalkRoleNameText}:''' ${text}`;
      }

    }

    console.log(out);

    closeKnex();
  })();
}