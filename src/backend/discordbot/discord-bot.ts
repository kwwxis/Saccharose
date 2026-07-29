import '../loadenv.ts';
import {
  REST,
  Routes,
  Client,
  Events,
  GatewayIntentBits,
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} from 'discord.js';
import { SiteUserProvider } from '../middleware/auth/SiteUserProvider.ts';
import { SiteUser } from '../../shared/types/site/site-user-types.ts';
import { AbstractDiscordCommand, ExecContext } from './commands/abstractDiscordCommand.ts';
import { DiscordPingCommand } from './commands/DiscordPingCommand.ts';
import { DiscordOLCommand } from './commands/DiscordOLCommand.ts';
import { DiscordSacchCommand } from './commands/DiscordSacchCommand.ts';

const commandList: AbstractDiscordCommand[] = [
  new DiscordPingCommand(),
  new DiscordOLCommand(),
  new DiscordSacchCommand(),
];

export class DiscordBotMain {
  rest: REST;
  client: Client;

  async registerCommands() {
    try {
      const commandPayload = commandList.map(command => command.schema().toJSON());
      console.log('Started refreshing application (/) commands.');
      await this.rest.put(Routes.applicationCommands(ENV.DISCORD_BOT_CLIENT_ID), { body: commandPayload });
      console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
      console.error(error);
    }
  }

  async init() {
    this.rest = new REST({ version: '10' }).setToken(ENV.DISCORD_BOT_CLIENT_SECRET);

    await this.registerCommands();

    this.client = new Client({
      intents: [GatewayIntentBits.Guilds],
      // makeCache: Options.cacheWithLimits({
      //   MessageManager: 0,
      //   ThreadManager: 0,
      //   GuildMemberManager: 0,
      //   ReactionManager: 0,
      //   PresenceManager: 0,
      // }),
      sweepers: {
        messages: {
          interval: 60, // seconds
          lifetime: 30, // seconds
        },
      },
    });

    this.client.on(Events.ClientReady, readyClient => {
      console.log(`Logged in as ${readyClient.user.tag}!`);
    });

    this.client.on(Events.InteractionCreate, async interaction => {
      if (interaction.isChatInputCommand()) {
        let commandInfo: ChatInputCommandInteraction = interaction;
        let discordUserId: string = interaction.user.id;
        let siteUser: SiteUser = await SiteUserProvider.find(discordUserId);

        if (!siteUser) {
          await commandInfo.reply('You are not a user of Saccharose.wiki! To become a user, you must login to the site and pass verification.');
          return;
        }

        await this.handleChatInputCommand(siteUser, commandInfo);
      }
    });

    await this.client.login(ENV.DISCORD_BOT_CLIENT_SECRET);
  }

  async handleChatInputCommand(user: SiteUser, commandInteraction: ChatInputCommandInteraction) {
    for (let command of commandList) {
      if (command.name === commandInteraction.commandName) {
        await command.execute(new ExecContext(user), commandInteraction);
        break;
      }
    }
  }
}

export const DiscordBot = new DiscordBotMain();

await DiscordBot.init();
