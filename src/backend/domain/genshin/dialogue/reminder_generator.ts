import '../../../loadenv.ts';
import { closeKnex } from '../../../util/db.ts';
import { GenshinControl, getGenshinControl } from '../genshinControl.ts';
import { cached } from '../../../util/cache.ts';
import { isInt } from '../../../../shared/util/numberUtil.ts';
import { ReminderExcelConfigData } from '../../../../shared/types/genshin/dialogue-types.ts';
import { DialogueSectionResult } from './dialogue_util.ts';
import { MetaProp } from '../../../util/metaProp.ts';
import { pathToFileURL } from 'url';
import { TextMapHash } from '../../../../shared/types/lang-types.ts';

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

export async function reminderTraceBack(ctrl: GenshinControl, reminder: ReminderExcelConfigData) {
  if (!reminder) {
    return reminder;
  }
  while (true) {
    const previous = await ctrl.selectPreviousReminder(reminder.Id);
    if (previous) {
      reminder = previous;
    } else {
      break;
    }
  }
  return reminder;
}

export async function handleSingleReminderGroup(ctrl: GenshinControl,
                                                reminder: ReminderExcelConfigData,
                                                subseq: number,
                                                output: DialogueSectionResult[],
                                                sect?: DialogueSectionResult): Promise<DialogueSectionResult> {
  if (!reminder) {
    return;
  }
  if (!sect) {
    sect = new DialogueSectionResult('Reminder_'+reminder.Id, 'Reminder');
    sect.metadata.push(new MetaProp('First Reminder ID', reminder.Id));
    sect.wikitext = '';
    output.push(sect);
  } else {
    sect.wikitext += '\n';
  }

  sect.wikitext += reminderWikitext(ctrl, reminder);

  if (reminder.NextReminderId) {
    let nextReminder = await ctrl.selectReminderById(reminder.NextReminderId);
    await handleSingleReminderGroup(ctrl, nextReminder, subseq, output, sect);
  } else {
    if (subseq > 0) {
      let nextReminder = await ctrl.selectReminderById(reminder.Id + 1);
      await handleSingleReminderGroup(ctrl, nextReminder, subseq - 1, output, sect);
    }
  }
  return;
}

export async function reminderGenerateFromSpeakerTextMapHashes(ctrl: GenshinControl, speakerTextMapHashes: TextMapHash[]): Promise<DialogueSectionResult[]> {
  if (!speakerTextMapHashes.length) {
    return [];
  }
  const results: DialogueSectionResult[] = [];
  const alreadyAdded: Set<number> = new Set();

  const reminders = await Promise.all(
    speakerTextMapHashes.map(textMapHash => ctrl.selectReminderBySpeakerTextMapHash(textMapHash))
  );

  for (let reminder of reminders) {
    if (!reminder) {
      continue;
    }

    reminder = await reminderTraceBack(ctrl, reminder);
    if (alreadyAdded.has(reminder.Id)) {
      continue;
    } else {
      alreadyAdded.add(reminder.Id);
    }
    await handleSingleReminderGroup(ctrl, reminder, 0, results);
  }

  return results;
}

export async function reminderGenerate(ctrl: GenshinControl, query: number|string, subsequentAmount: number = 0): Promise<DialogueSectionResult[]> {
  const results: DialogueSectionResult[] = [];

  if (typeof query === 'string' && isInt(query)) {
    query = parseInt(query);
  }

  if (typeof query === 'string') {
    // string
    const textMapHashes = (await ctrl.getTextMapMatches(ctrl.inputLangCode, query.trim(), ctrl.searchModeFlags))
      .map(x => x.hash);
    if (textMapHashes.length) {
      const reminders = await Promise.all(
        textMapHashes.map(textMapHash => ctrl.selectReminderByContentTextMapHash(textMapHash))
      );
      const alreadyAdded: Set<number> = new Set();

      for (let reminder of reminders) {
        if (!reminder) {
          continue;
        }

        reminder = await reminderTraceBack(ctrl, reminder);
        if (alreadyAdded.has(reminder.Id)) {
          continue;
        } else {
          alreadyAdded.add(reminder.Id);
        }
        await handleSingleReminderGroup(ctrl, reminder, subsequentAmount, results);
      }
    } else {
      throw 'Text Map record not found for: ' + query;
    }
  } else if (typeof query === 'number') {
    // number
    await handleSingleReminderGroup(ctrl, await ctrl.selectReminderById(query), subsequentAmount, results);
  }

  return results;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    console.log(await reminderGenerate(getGenshinControl(), `Convinced that the king will in time provide a delicious meal`));
    await closeKnex();
  })();
}
