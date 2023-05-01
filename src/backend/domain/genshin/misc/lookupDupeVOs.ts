import '../../../loadenv';
import {GenshinControl, getGenshinControl} from "../genshinControl";
import {getTextMapItem, getVoPrefix, loadEnglishTextMap, loadVoiceItems} from "../textmap";
import { closeKnex } from '../../../util/db';
import { DialogExcelConfigData } from '../../../../shared/types/genshin/dialogue-types';
import {promises as fs} from 'fs';
import{schema, normalizeRawJson} from '../../../importer/import_db';
import { getGenshinDataFilePath } from '../../../loadenv';
import { pathToFileURL } from 'url';
import { normText } from '../genshinNormalizers';

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    await loadEnglishTextMap();
    await loadVoiceItems();
    let ctrl: GenshinControl = getGenshinControl();

    let filePath = getGenshinDataFilePath('./ExcelBinOutput/DialogExcelConfigData.json');
    let result: any[] = await fs.readFile(filePath, {encoding: 'utf8'}).then(data => JSON.parse(data));

    let out = '';

    for (let row of result) {
      let dialog: DialogExcelConfigData = normalizeRawJson(row, schema.DialogExcelConfigData);
      let text: string = normText(getTextMapItem('EN', dialog.TalkContentTextMapHash), 'EN');
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

        out += `\n:${voPrefix}'''${dialog.TalkRoleNameText}:''' ${text}`;
      }

    }

    console.log(out);

    await closeKnex();
  })();
}