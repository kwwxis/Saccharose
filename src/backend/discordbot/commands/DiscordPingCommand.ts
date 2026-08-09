import { AbstractDiscordCommand, ExecContext } from './abstractDiscordCommand.ts';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { SharedSlashCommand } from '@discordjs/builders';
import { AvailableSiteModes, SiteMode } from '../../../shared/types/site/site-mode-type.ts';

export class DiscordPingCommand extends AbstractDiscordCommand {
  readonly name: string = 'ping';

  readonly siteModes: SiteMode[] = AvailableSiteModes;

  override schema(): SharedSlashCommand {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription('Responds with Pong!');
  }

  override async execute(ctx: ExecContext, command: ChatInputCommandInteraction): Promise<void> {
    await command.reply('Pong!');
  }
}
