import '../../../loadenv';
import { closeKnex } from '../../../util/db';
import { GenshinControl, getGenshinControl } from '../genshinControl';
import { cached } from '../../../util/cache';
import { isInt } from '../../../../shared/util/numberUtil';
import { ReminderExcelConfigData } from '../../../../shared/types/genshin/dialogue-types';
import { DialogueSectionResult } from './dialogue_util';
import { MetaProp } from '../../../util/metaProp';
import { pathToFileURL } from 'url';

export async function reminderGenerateAll(ctrl: GenshinControl): Promise<DialogueSectionResult> {
  let sect = new DialogueSectionResult(null, 'All Reminders');
  sect.showGutter = true;

  sect.wikitext = await cached('AllRemindersWikitext_'+ctrl.outputLangCode, async () => {
    let out = '';
    let reminders = await ctrl.selectAllReminders();
    for (let reminder of reminders) {
      if (!reminder.ContentText) {
        continue;
      }

      let speaker = ctrl.normText(reminder.SpeakerText, ctrl.outputLangCode);
      let text = ctrl.normText(reminder.ContentText, ctrl.outputLangCode);
      let voPrefix = ctrl.voice.getVoPrefix('Reminder', reminder.Id, text);

      if (!reminder.SpeakerText) {
        out += '\n' + voPrefix + text;
      } else {
        out += `\n:${voPrefix}'''${speaker}:''' ${text}`;
      }
    }
    return out.trimStart();
  });

  return sect;
}

export function reminderWikitext(ctrl: GenshinControl, reminder: ReminderExcelConfigData) {
  let text = ctrl.normText(reminder.ContentText, ctrl.outputLangCode);
  let voPrefix = ctrl.voice.getVoPrefix('Reminder', reminder.Id, text);

  if (!reminder.SpeakerText) {
    return '\n' + voPrefix + text;
  } else {
    return `:${voPrefix}'''${reminder.SpeakerText}:''' ${text}`;
  }
}

export async function reminderGenerate(ctrl: GenshinControl, query: number|string, subsequentAmount: number = 0): Promise<DialogueSectionResult[]> {
  let result: DialogueSectionResult[] = [];

  if (typeof query === 'string' && isInt(query)) {
    query = parseInt(query);
  }

  async function handle(reminder: ReminderExcelConfigData, subseq: number, sect?: DialogueSectionResult) {
    if (!reminder) {
      return;
    }
    if (!sect) {
      sect = new DialogueSectionResult('Reminder_'+reminder.Id, 'Reminder');
      sect.metadata.push(new MetaProp('First Reminder ID', reminder.Id));
      sect.wikitext = '';
      result.push(sect);
    } else {
      sect.wikitext += '\n';
    }

    sect.wikitext += reminderWikitext(ctrl, reminder);

    if (reminder.NextReminderId) {
      let nextReminder = await ctrl.selectReminderById(reminder.NextReminderId);
      await handle(nextReminder, subseq, sect);
    } else {
      if (subseq > 0) {
        let nextReminder = await ctrl.selectReminderById(reminder.Id + 1);
        await handle(nextReminder, subseq - 1, sect);
      }
    }
  }

  if (typeof query === 'string') {
    // string
    const textMapHashes = (await ctrl.getTextMapMatches(ctrl.inputLangCode, query.trim(), ctrl.searchModeFlags)).map(x => x.hash);
    if (textMapHashes.length) {
      let reminders = await Promise.all(textMapHashes.map(textMapHash => ctrl.selectReminderByContentTextMapHash(textMapHash)));
      for (let reminder of reminders) {
        await handle(reminder, subsequentAmount);
      }
    } else {
      throw 'Text Map record not found for: ' + query;
    }
  } else if (typeof query === 'number') {
    // number
    await handle(await ctrl.selectReminderById(query), subsequentAmount);
  }

  return result;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    console.log(await reminderGenerate(getGenshinControl(), `Convinced that the king will in time provide a delicious meal`));
    await closeKnex();
  })();
}