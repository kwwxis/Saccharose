import '../../setup';
import { closeKnex } from '@db';
import { Control, getControl, normText } from '@/scripts/script_util';
import { ReminderExcelConfigData } from '@types';
import { DialogueSectionResult } from './quest_generator';
import { isInt } from '@functions';
import { loadTextMaps } from '../textmap';

export async function reminderGenerate(ctrl: Control, query: number|string, subsequentAmount: number = 0): Promise<DialogueSectionResult[]> {
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
      sect.metatext = 'First Reminder ID: ' + reminder.Id;
      sect.wikitext = '';
      result.push(sect);
    } else {
      sect.wikitext += '\n';
    }
    sect.wikitext += `:'''${reminder.SpeakerText}:''' ${normText(reminder.ContentText, ctrl.outputLangCode)}`;
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
    const matches = await ctrl.getTextMapMatches(ctrl.inputLangCode, query.trim());
    if (Object.keys(matches).length) {
      let reminders = await Promise.all(
        Object.keys(matches).map(textMapId => parseInt(textMapId)).map(textMapId => ctrl.selectReminderByContentTextMapId(textMapId))
      );
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

if (require.main === module) {
  (async () => {
    await loadTextMaps();
    console.log(await reminderGenerate(getControl(), `Convinced that the king will in time provide a delicious meal`));
    closeKnex();
  })();
}