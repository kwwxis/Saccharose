import { AbstractDiscordCommand, ExecContext } from './abstractDiscordCommand.ts';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { SharedSlashCommand } from '@discordjs/builders';

export class DiscordPingCommand extends AbstractDiscordCommand {
  readonly name: string = 'ping';

  override schema(): SharedSlashCommand {
    return new SlashCommandBuilder()
      .setName(this.name)
      .setDescription('Responds with Pong!');
  }

  override async execute(ctx: ExecContext, command: ChatInputCommandInteraction): Promise<void> {
    await command.reply('Pong!');
  }
}
