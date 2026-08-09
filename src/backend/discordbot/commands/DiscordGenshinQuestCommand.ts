import { AbstractDiscordCommand, ExecContext } from './abstractDiscordCommand.ts';
import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { SharedSlashCommand } from '@discordjs/builders';
import { LangCode } from '../../../shared/types/lang-types.ts';
import { OLResult } from '../../../shared/types/ol-types.ts';
import { ol_gen } from '../../domain/abstract/basic/OLgen.ts';
import { AvailableSiteModes, SiteMode } from '../../../shared/types/site/site-mode-type.ts';
import { GenshinControl, getGenshinControl } from '../../domain/genshin/genshinControl.ts';
import { MaterialExcelConfigData } from '../../../shared/types/genshin/material-types.ts';
import { QuestOrderItem } from '../../domain/genshin/dialogue/dialogue_util.ts';

export class DiscordGenshinQuestCommand extends AbstractDiscordCommand {
  readonly name: string = 'quest';

  readonly siteModes: SiteMode[] = ['genshin'];

  override schema(): SharedSlashCommand {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription('Search for quests')
      .addStringOption(option => option
        .setName('query')
        .setDescription('Search query')
        .setRequired(true));
  }

  override async execute(ctx: ExecContext, command: ChatInputCommandInteraction): Promise<void> {
    await command.deferReply();

    const query: string = command.options.getString('query');

    const ctrl: GenshinControl = getGenshinControl(ctx.user);

    let result = await ctrl.searchMainQuestsAndChapters(query);

    let lines: string[] = [];

    if (result.mainQuests.length) {
      lines.push('**Quest search results:**\n');
      for (let mainQuest of result.mainQuests.slice(0, 5)) {
        lines.push(`- ${mainQuest.Type} ${mainQuest.Id}: [${mainQuest.TitleText || 'No title'}](` + `https://saccharose.wiki/genshin/quests/${mainQuest.Id}` + `)`);
      }
      if (result.mainQuests.length > 5) {
        lines.push(`- ...and ${result.mainQuests.length - 5} more results`);
      }
    }
    if (result.chapters.length) {
      lines.push('\n**Chapter search results:**\n');
      for (let chapter of result.chapters.slice(0, 5)) {
        let line = '';
        if (chapter.Summary.ChapterNumText) {
          line += chapter.Summary.ChapterNumText + ' — ';
        }
        if (chapter.Summary.ChapterName) {
          line += chapter.Summary.ChapterName + ' — ';
        }
        if (chapter.Summary.ActNumText) {
          line += chapter.Summary.ActNumText + ': ';
        }
        line += chapter.Summary.ActName;
        lines.push('- [' + line + '](' + `https://saccharose.wiki/genshin/quests/${chapter.Id}` + ')');

        const inDepthQuests = (item: QuestOrderItem, depth: number) => {
          lines.push(' '.repeat(depth * 2) +
            `1. ${item.quest.Type} ${item.quest.Id}: [${item.quest.TitleText || 'No title'}](` + `https://saccharose.wiki/genshin/quests/${item.quest.Id}` + `)`);
          if (item.subquests) {
            for (let subQuest of item.subquests) {
              inDepthQuests(subQuest, depth + 1);
            }
          }
        }

        for (let quest of chapter.OrderedQuests) {
          inDepthQuests(quest, 1);
        }
      }
      if (result.chapters.length > 5) {
        lines.push(`- ...and ${result.chapters.length - 5} more results`);
      }
    }

    let embeds: EmbedBuilder[] = [];

    const embed = new EmbedBuilder()
      .setDescription('Query: `' + query + '`' + '\n\n' + lines.join('\n'))
      .setColor("#00b0f4");

    embeds.push(embed);

    await command.editReply({
      embeds,
    });
  }

}
