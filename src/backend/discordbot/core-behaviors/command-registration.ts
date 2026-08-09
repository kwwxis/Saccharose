import { DiscordBotMain } from '../discord-bot.ts';
import { AbstractDiscordCommand, ExecContext } from '../commands/abstractDiscordCommand.ts';
import { DiscordPingCommand } from '../commands/DiscordPingCommand.ts';
import { DiscordOLCommand } from '../commands/DiscordOLCommand.ts';
import { DiscordSacchCommand } from '../commands/DiscordSacchCommand.ts';
import { ChatInputCommandInteraction, Events, Snowflake } from 'discord.js';
import { SiteUser } from '../../../shared/types/site/site-user-types.ts';
import { SiteUserProvider } from '../../middleware/auth/SiteUserProvider.ts';
import { SiteMode } from '../../../shared/types/site/site-mode-type.ts';
import { DiscordSacchminCommand } from '../commands/DiscordSacchminCommand.ts';
import { DiscordBotModule } from '../discord-bot-module.ts';
import { DiscordGenshinItemCommand } from '../commands/DiscordGenshinItemCommand.ts';
import { DiscordGenshinQuestCommand } from '../commands/DiscordGenshinQuestCommand.ts';

export class CommandRegistrationModule extends DiscordBotModule {
  readonly commandList = Object.freeze([
    new DiscordPingCommand(),
    new DiscordOLCommand(),
    new DiscordSacchCommand(),
    new DiscordSacchminCommand(),
    new DiscordGenshinItemCommand(),
    new DiscordGenshinQuestCommand(),
  ]);

  constructor(bot: DiscordBotMain) {
    super(bot);
  }

  applicableCommands(guildId: Snowflake): AbstractDiscordCommand[] {
    return this.commandList
      .filter(cmd => {
        if (cmd.name === 'sacchmin') {
          return this.bot.guildRegistration.isBotManagementGuild(guildId);
        }
        return cmd.siteModes.includes(this.bot.guildRegistration.getSiteModeForGuild(guildId));
      })
  }

  createCommandPayload(guildId: Snowflake) {
    return this.applicableCommands(guildId)
      .map(command => command.schema().toJSON());
  }

  override init() {
    this.client.on(Events.InteractionCreate, async interaction => {
      if (interaction.isChatInputCommand()) {
        let commandInfo: ChatInputCommandInteraction = interaction;
        let discordUserId: string = interaction.user.id;
        let siteUser: SiteUser = await SiteUserProvider.find(discordUserId);

        if (!siteUser) {
          await commandInfo.reply({
            content: 'Sorry, usage of this bot is restricted to only registered users of this service.',
            ephemeral: true,
          });
          return;
        }

        await this.handleChatInputCommand(siteUser, commandInfo);
      }
    });
  }

  async handleChatInputCommand(user: SiteUser, commandInteraction: ChatInputCommandInteraction) {
    try {
      for (let command of this.commandList) {
        if (command.name === commandInteraction.commandName) {
          await command.execute(new ExecContext(user, this.bot, commandInteraction.guildId), commandInteraction);
          break;
        }
      }
    } catch (e) {
      console.error(`[commands] Error executing command ${commandInteraction.commandName}:`, e);
      await commandInteraction.reply('An error occurred while executing the command. Please try again later.');
    }
  }
}
