import { AbstractDiscordCommand, ExecContext } from './abstractDiscordCommand.ts';
import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { SharedSlashCommand } from '@discordjs/builders';
import {
  APIApplicationCommandOptionChoice
} from 'discord-api-types/payloads/v10/_interactions/_applicationCommands/_chatInput/shared';
import { DEFAULT_LANG, LANG_CODES, LangCode } from '../../../shared/types/lang-types.ts';
import { SiteUserProvider } from '../../middleware/auth/SiteUserProvider.ts';
import { AvailableSiteModes, SiteMode } from '../../../shared/types/site/site-mode-type.ts';
import { DEFAULT_SEARCH_MODE } from '../../../shared/util/searchUtil.ts';

const LANG_CHOICES: APIApplicationCommandOptionChoice<string>[] = LANG_CODES.filter(langCode => langCode !== 'CH')
  .map(langCode => ({
    name: langCode,
    value: langCode,
  }));

export class DiscordSacchCommand extends AbstractDiscordCommand {
  readonly name: string = 'sacch';

  readonly siteModes: SiteMode[] = AvailableSiteModes;

  override schema(): SharedSlashCommand {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription('Change your Saccharose.wiki user options')
      .addSubcommand(command =>
        command.setName('inlang')
          .setDescription('Set your input language')
          .addStringOption(opt => opt
            .setName('lang')
            .setDescription('Language choice')
            .setChoices(LANG_CHOICES)
            .setRequired(true)),
      )
      .addSubcommand(command =>
        command.setName('outlang')
          .setDescription('Set your output language')
          .addStringOption(opt => opt
            .setName('lang')
            .setDescription('Language choice')
            .setChoices(LANG_CHOICES)
            .setRequired(true)),
      )
      .addSubcommand(command =>
        command.setName('info')
          .setDescription('Show your current game setting, input language, and output language')
      );
  }

  override async execute(ctx: ExecContext, command: ChatInputCommandInteraction): Promise<void> {
    const subcommand: 'inlang'|'outlang'|'info' = command.options.getSubcommand() as any;

    if (subcommand === 'inlang') {
      const langCode: LangCode = command.options.getString('lang') as LangCode;

      if (!LANG_CODES.includes(langCode)) {
        await command.reply({
          content: `Not a valid language code: ` + langCode,
          ephemeral: true,
        });
        return;
      }

      await SiteUserProvider.updatePrefs(ctx.user.id, prefs => prefs.inputLangCode = langCode);

      await command.reply({
        content: `Your input language has been set to **${langCode}**.`,
        ephemeral: true,
      });
    } else if (subcommand === 'outlang') {
      const langCode: LangCode = command.options.getString('lang') as LangCode;

      if (!LANG_CODES.includes(langCode)) {
        await command.reply({
          content: `Not a valid language code: ` + langCode,
          ephemeral: true,
        });
        return;
      }

      await SiteUserProvider.updatePrefs(ctx.user.id, prefs => prefs.outputLangCode = langCode);

      await command.reply({
        content: `Your preferred game has been set to **${langCode}**.`,
        ephemeral: true,
      });
    } else if (subcommand === 'info') {
      const embed = new EmbedBuilder()
        .setTitle('Saccharose.wiki User Info')
        .addFields({
          name: 'Input Language',
          value: ctx.user.prefs.inputLangCode || DEFAULT_LANG
        }, {
          name: 'Output Language',
          value: ctx.user.prefs.outputLangCode || DEFAULT_LANG
        }, {
          name: 'Search Mode',
          value: ctx.user.prefs.searchMode || DEFAULT_SEARCH_MODE
        });

      await command.reply({
        embeds: [embed],
        ephemeral: true
      });
    }
  }

}
