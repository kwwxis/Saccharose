import '../../../loadenv.ts';
import { GenshinControl, getGenshinControl, loadGenshinVoiceItems } from '../genshinControl.ts';
import { closeKnex } from '../../../util/db.ts';
import { DialogExcelConfigData } from '../../../../shared/types/genshin/dialogue-types.ts';
import {promises as fs} from 'fs';
import{normalizeRawJson} from '../../../importer/import_db.ts';
import { getGenshinDataFilePath } from '../../../loadenv.ts';
import { pathToFileURL } from 'url';
import { genshinSchema } from '../../../importer/genshin/genshin.schema.ts';
import { toInt } from '../../../../shared/util/numberUtil.ts';

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    await loadGenshinVoiceItems();
    let ctrl: GenshinControl = getGenshinControl();

    let filePath = getGenshinDataFilePath('./ExcelBinOutput/DialogExcelConfigData.json');
    let result: any[] = await fs.readFile(filePath, {encoding: 'utf8'}).then(data => JSON.parse(data));

    let out = '';

    for (let row of result) {
      let dialog: DialogExcelConfigData = normalizeRawJson(row, genshinSchema.DialogExcelConfigData);
      let text: string = ctrl.normText(await ctrl.getTextMapItem('EN', dialog.TalkContentTextMapHash), 'EN');
      let voPrefix = ctrl.voice.getVoPrefix('Dialog', dialog.Id, text, dialog.TalkRole.Type);

      if (!voPrefix || !voPrefix.includes('<!--') || !text) {
        continue;
      }

      if (dialog.TalkRole.Type === 'TALK_ROLE_NPC' || dialog.TalkRole.Type === 'TALK_ROLE_GADGET') {
        dialog.TalkRoleNameText = await ctrl.getTextMapItem('EN', dialog.TalkRoleNameTextMapHash);

        if (!dialog.TalkRoleNameText && !!dialog.TalkRole) {
          let npc = await ctrl.getNpc(typeof dialog.TalkRole.Id === 'string' ? toInt(dialog.TalkRole.Id) : dialog.TalkRole.Id);
          if (npc) {
            dialog.TalkRole.NameTextMapHash = npc.NameTextMapHash;
            dialog.TalkRole.NameText = npc.NameText;
          }

          dialog.TalkRoleNameText = await ctrl.getTextMapItem('EN', dialog.TalkRole.NameTextMapHash);
        }

        out += `\n:${voPrefix}'''${dialog.TalkRoleNameText}:''' ${text}`;
      }

    }

    console.log(out);

    await closeKnex();
  })();
}
