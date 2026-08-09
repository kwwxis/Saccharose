import { AbstractDiscordCommand, ExecContext } from './abstractDiscordCommand.ts';
import { ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { SharedSlashCommand } from '@discordjs/builders';
import { SiteMode } from '../../../shared/types/site/site-mode-type.ts';

export class DiscordSacchminCommand extends AbstractDiscordCommand {
  readonly name: string = 'sacchmin';

  readonly siteModes: SiteMode[] = [];

  override schema(): SharedSlashCommand {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription('Bot management')
      .addStringOption(opt => opt
        .setName('action')
        .setDescription('Management action')
        .setChoices([
          { name: 'RefreshCommands', value: 'RefreshCommands' },
        ])
        .setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  }

  override async execute(ctx: ExecContext, command: ChatInputCommandInteraction): Promise<void> {
    await command.reply({
      content: 'Refreshing commands...',
    });

    await ctx.bot.guildRegistration.deployCommandsToAllowedGuilds();
  }

}
