import '../../../loadenv.ts';
import { closeKnex } from '../../../util/db.ts';
import { GenshinControl, getGenshinControl } from '../genshinControl.ts';
import { isInt, maybeInt } from '../../../../shared/util/numberUtil.ts';
import { ReminderExcelConfigData } from '../../../../shared/types/genshin/dialogue-types.ts';
import { MetaProp } from '../../../util/metaProp.ts';
import { pathToFileURL } from 'url';
import { TextMapHash } from '../../../../shared/types/lang-types.ts';
import { Marker } from '../../../../shared/util/highlightMarker.ts';
import { escapeRegExp } from '../../../../shared/util/stringUtil.ts';
import { sort } from '../../../../shared/util/arrayUtil.ts';
import { DialogueSectionResult } from '../../../util/dialogueSectionResult.ts';
import { DialogWikitextResult } from '../../../../shared/types/common-types.ts';

export async function reminderGenerateAll(ctrl: GenshinControl): Promise<DialogueSectionResult[]> {
  return ctrl.cached('RemindersAll:' + ctrl.outputLangCode, 'memory', async () => {
    const context = new ReminderGenerationContext(ctrl, true);
    const allReminders = await ctrl.selectAllReminders();
    context.addPreloadedSource(allReminders);

    for (let reminder of allReminders) {
      await context.handleChain(reminder, 0);
    }

    const groupedByVersion: Record<string, DialogueSectionResult> = {};

    const uncategorized = new DialogueSectionResult('ReminderGroup_Uncategorized', 'Uncategorized');

    for (let result of context.results) {
      const version = result.extraData.addedInVersion;
      if (version) {
        if (!groupedByVersion[version]) {
          groupedByVersion[version] = new DialogueSectionResult(
            'ReminderGroup_Version_' + version.replace(/\./g, '_'),
            version
          );
        }

        groupedByVersion[version].children.push(result);
      } else {
        uncategorized.children.push(result);
      }
    }

    return [uncategorized, ... sort(Object.entries(groupedByVersion), '0').map(([k, v]) => v)];
  });
}


export function reminderWikitext(ctrl: GenshinControl, reminder: ReminderExcelConfigData): DialogWikitextResult {
  const text: string = ctrl.normText(reminder.ContentText, ctrl.outputLangCode);
  const voPrefix: string = ctrl.voice.getVoPrefix('Reminder', reminder.Id, text);

  if (!reminder.SpeakerText) {
    return {
      wikitext: '\n' + voPrefix + text,
      ids: [
        {
          commonId: reminder.Id,
          textMapHash: reminder.ContentTextMapHash
        }
      ]
    }
  } else {
    return {
      wikitext: `:${voPrefix}'''${ctrl.normText(reminder.SpeakerText, ctrl.outputLangCode)}:''' ${text}`,
      ids: [
        {
          commonId: reminder.Id,
          textMapHash: reminder.ContentTextMapHash
        }
      ]
    };
  }
}

class ReminderGenerationContext {
  readonly results: DialogueSectionResult[] = [];
  private alreadyAdded: Set<number> = new Set();
  private preloaded: Record<number, ReminderExcelConfigData> = {};
  private preloadedNextToPrevious: Record<number, ReminderExcelConfigData> = {};

  constructor(private ctrl: GenshinControl, private onlyUsePreloadedSources: boolean = false) {}

  addPreloadedSource(preloadedList: ReminderExcelConfigData[]) {
    if (preloadedList) {
      for (let reminder of preloadedList) {
        this.preloaded[reminder.Id] = reminder;
        this.preloadedNextToPrevious[reminder.NextReminderId] = reminder;
      }
    }
  }

  markifyQuery(query: string) {
    let re = new RegExp(this.ctrl.searchModeIsRegex ? query : escapeRegExp(query), this.ctrl.searchModeReFlags);

    for (let result of this.results) {
      result.wikitextMarkers.push(... Marker.create(re, result.wikitext));
    }
  }

  markifyReminderId(id: number) {
    for (let result of this.results) {
      let lineNum = 1;
      for (let commonLineId of result.wikitextLineIds) {
        if (commonLineId.commonId === id) {
          result.wikitextMarkers.push(Marker.fullLine('highlight', lineNum))
        }
        lineNum++;
      }
    }
  }

  private async reminderTraceBack(reminder: ReminderExcelConfigData) {
    if (!reminder) {
      return reminder;
    }
    while (true) {
      const previous = this.preloadedNextToPrevious[reminder.Id]
        || (this.onlyUsePreloadedSources ? null : await this.ctrl.selectPreviousReminder(reminder.Id));
      if (previous && previous.Id !== reminder.Id) {
        reminder = previous;
      } else {
        break;
      }
    }
    return reminder;
  }

  async handleChain(reminder: ReminderExcelConfigData, subseq: number): Promise<void> {
    reminder = await this.reminderTraceBack(reminder);

    if (!reminder || this.alreadyAdded.has(reminder.Id)) {
      return;
    }

    const sect = new DialogueSectionResult('Reminder_'+reminder.Id, 'Reminder');
    sect.headerProps.push(new MetaProp('First Reminder ID', reminder.Id));

    const changeRecord = await this.ctrl.excelChangelog.selectChangeRefAddedAt(reminder.Id, 'ReminderExcelConfigData');
    if (changeRecord) {
      sect.headerProps.push(new MetaProp('Added In Version', changeRecord.version?.displayLabel));
      sect.extraData.addedInVersion = changeRecord.version?.number;
    }

    await this.handleSingle(reminder, subseq, sect);

    if (!!sect.wikitext.length) {
      this.results.push(sect);
    }
  }

  private async handleSingle(reminder: ReminderExcelConfigData,
                             subseq: number,
                             sect: DialogueSectionResult): Promise<void> {
    if (!reminder || this.alreadyAdded.has(reminder.Id)) {
      return;
    }

    this.alreadyAdded.add(reminder.Id);
    if (reminder.ContentText) {
      sect.append(reminderWikitext(this.ctrl, reminder));
    }

    if (reminder.NextReminderId) {
      const nextReminder = this.preloaded[reminder.NextReminderId]
        || (this.onlyUsePreloadedSources ? null : await this.ctrl.selectReminderById(reminder.NextReminderId));
      await this.handleSingle(nextReminder, subseq, sect);
    } else  if (subseq > 0) {
      const nextReminder = this.preloaded[reminder.Id + 1]
        || (this.onlyUsePreloadedSources ? null : await this.ctrl.selectReminderById(reminder.Id + 1));
      await this.handleSingle(nextReminder, subseq - 1, sect);
    }
  }
}

export async function reminderGenerateFromSpeakerTextMapHashes(ctrl: GenshinControl, speakerTextMapHashes: TextMapHash[]): Promise<DialogueSectionResult[]> {
  if (!speakerTextMapHashes.length) {
    return [];
  }

  const reminders = (await Promise.all(
    speakerTextMapHashes.map(textMapHash => ctrl.selectReminderBySpeakerTextMapHash(textMapHash))
  )).filter(x => !!x);

  const context = new ReminderGenerationContext(ctrl);
  context.addPreloadedSource(reminders);

  for (let reminder of reminders) {
    await context.handleChain(reminder, 0);
  }
  return context.results;
}

export async function reminderGenerate(ctrl: GenshinControl, query: number|string, subsequentAmount: number = 0): Promise<DialogueSectionResult[]> {
  query = typeof query === 'string' ? query.trim() : query;
  query = maybeInt(query);

  const context = new ReminderGenerationContext(ctrl);

  if (typeof query === 'string') {
    const textMapHashes = (await ctrl.getTextMapMatches({
      inputLangCode: ctrl.inputLangCode,
      outputLangCode: ctrl.outputLangCode,
      searchText: query,
      flags: ctrl.searchModeFlags
    })).map(x => x.hash);

    if (!textMapHashes.length) {
      throw 'Text Map record not found for: ' + query;
    }

    const reminders = (await Promise.all(
      textMapHashes.map(textMapHash => ctrl.selectReminderByContentTextMapHash(textMapHash))
    )).filter(x => !!x);

    context.addPreloadedSource(reminders);

    for (let reminder of reminders) {
      await context.handleChain(reminder, subsequentAmount);
    }

    context.markifyQuery(query);
  } else if (typeof query === 'number') {
    const reminder = await ctrl.selectReminderById(query);
    if (reminder) {
      await context.handleChain(reminder, subsequentAmount);
      context.markifyReminderId(reminder.Id);
    } else {
      throw 'Could not find a reminder for ID ' + query;
    }
  }
  return context.results;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    console.log(await reminderGenerate(getGenshinControl(), `Convinced that the king will in time provide a delicious meal`));
    await closeKnex();
  })();
}
