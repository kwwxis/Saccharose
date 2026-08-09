import { AbstractDiscordCommand, ExecContext } from './abstractDiscordCommand.ts';
import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { SharedSlashCommand } from '@discordjs/builders';
import { LangCode } from '../../../shared/types/lang-types.ts';
import { OLResult } from '../../../shared/types/ol-types.ts';
import { ol_gen } from '../../domain/abstract/basic/OLgen.ts';
import { AvailableSiteModes, SiteMode } from '../../../shared/types/site/site-mode-type.ts';
import { GenshinControl, getGenshinControl } from '../../domain/genshin/genshinControl.ts';
import { MaterialExcelConfigData } from '../../../shared/types/genshin/material-types.ts';

export class DiscordGenshinItemCommand extends AbstractDiscordCommand {
  readonly name: string = 'item';

  readonly siteModes: SiteMode[] = ['genshin'];

  override schema(): SharedSlashCommand {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription('Search for items')
      .addStringOption(option => option
        .setName('query')
        .setDescription('Search query')
        .setRequired(true));
  }

  override async execute(ctx: ExecContext, command: ChatInputCommandInteraction): Promise<void> {
    await command.deferReply();

    const query: string = command.options.getString('query');

    const ctrl: GenshinControl = getGenshinControl(ctx.user);

    let materials: MaterialExcelConfigData[] = await ctrl.selectMaterialsBySearch(query, ctrl.searchModeFlags);
    let totalResults = materials.length;
    materials = materials.slice(0, 3); // Limit to 3 results

    let embeds: EmbedBuilder[] = [];


    for (let item of materials) {
      let contentText = '';

      if (item.WikiTypeDescText) {
        contentText += '[' + item.WikiTypeDescText + '] ';
      }
      if (item.DescText) {
        contentText += ctrl.normText(item.DescText, ctrl.outputLangCode);
      }

      const embed = new EmbedBuilder()
        .setTitle(ctrl.normText(item.NameText, ctrl.outputLangCode) || null)
        .setURL(`https://saccharose.wiki/genshin/items/${item.Id}`)
        .setDescription(contentText)
        .setThumbnail(`https://saccharose.wiki${item.IconUrl}.png`)
        .setColor("#00b0f4");
      embeds.push(embed);
    }

    if (totalResults > 3) {
      const moreEmbed = new EmbedBuilder()
        .setDescription(`[There are ${totalResults} total results for your query.](https://saccharose.wiki/gi/items?q=${encodeURIComponent(query)}) Only three results were shown.`)
        .setColor("#ffcc00");
      embeds.push(moreEmbed);
    }

    await command.editReply({
      embeds,
    });
  }

}
