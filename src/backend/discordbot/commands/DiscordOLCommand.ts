import { AbstractDiscordCommand, ExecContext } from './abstractDiscordCommand.ts';
import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { SiteUser } from '../../../shared/types/site/site-user-types.ts';
import { SharedSlashCommand } from '@discordjs/builders';
import { LangCode } from '../../../shared/types/lang-types.ts';
import { OLResult } from '../../../shared/types/ol-types.ts';
import { ol_gen } from '../../domain/abstract/basic/OLgen.ts';

export class DiscordOLCommand extends AbstractDiscordCommand {
  readonly name: string = 'ol';

  override schema(): SharedSlashCommand {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription('Generate other languages')
      .addStringOption(option => option
        .setName('text')
        .setDescription('Text')
        .setRequired(true))
      .addBooleanOption(option => option.setName('hide_tl').setDescription('Hide TL'))
      .addBooleanOption(option => option.setName('hide_rm').setDescription('Hide RM'))
      .addBooleanOption(option => option.setName('add_default_hidden').setDescription('Add default hidden'))
  }

  override async execute(ctx: ExecContext, command: ChatInputCommandInteraction): Promise<void> {
    if (!ctx.user.prefs.dbotSiteMode) {
      await command.reply({
        content: `You must first set which game with \`/sacch game [game]\``,
        ephemeral: true,
      });
      return;
    }

    await command.deferReply();

    const text: string = command.options.getString('text') as LangCode;
    const hideTL: boolean = command.options.getBoolean('hide_tl') || false;
    const hideRM: boolean = command.options.getBoolean('hide_rm') || false;
    const addDefaultHidden: boolean = command.options.getBoolean('add_default_hidden') || false;

    let results: OLResult[] = await ol_gen(ctx.control, text, {
      hideTl: hideTL,
      hideRm: hideRM,
      addDefaultHidden: addDefaultHidden,
    });

    const embed = new EmbedBuilder()
      .setTitle('Saccharose.wiki OL')
      .setDescription('OL Results for ' + text + (!results.length ? `\n\nNo results found.\n\nNote that your input language is current set to: ${ctx.user.prefs.inputLangCode}`: ''));

    for (let result of results) {
      embed.addFields({
        name: 'TextMapHash ' + result.textMapHash,
        value: '```' + result.result + '```'
      });
      if (result.warnings && result.warnings.length) {
        embed.addFields({
          name: 'Warnings',
          value: ' - ' + result.warnings.join('\n - ')
        });
      }
    }

    await command.editReply({
      embeds: [embed],
    });
  }

}
