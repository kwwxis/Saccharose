import '../loadenv.ts';
import { Client, Events, GatewayIntentBits, REST } from 'discord.js';
import { GuildRegistrationModule } from './core-behaviors/guild-registration.ts';
import { CommandRegistrationModule } from './core-behaviors/command-registration.ts';

export class DiscordBotMain {
  rest: REST;
  client: Client;

  guildRegistration: GuildRegistrationModule = new GuildRegistrationModule(this);
  commandRegistration: CommandRegistrationModule = new CommandRegistrationModule(this);

  async init() {
    this.rest = new REST({ version: '10' }).setToken(ENV.DISCORD_BOT_CLIENT_SECRET);

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

    this.guildRegistration.init();
    this.commandRegistration.init();

    this.client.on(Events.ClientReady, readyClient => {
      console.log(`Logged in as ${readyClient.user.tag}!`);
    });

    await this.client.login(ENV.DISCORD_BOT_CLIENT_SECRET);

    let shuttingDown = false;

    const shutdown = async (signal: 'SIGINT'|'SIGTERM') => {
      if (shuttingDown) return;
      shuttingDown = true;

      console.log(`[bot] Received ${signal}, shutting down...`);

      try {
        await this.client.destroy();
      } catch (error) {
        console.error('[bot] Shutdown failed', error);
      }

      process.exit(0);
    };

    process.once('SIGINT', () => shutdown('SIGINT'));
    process.once('SIGTERM', () => shutdown('SIGTERM'));
  }
}

export const DiscordBot: DiscordBotMain = new DiscordBotMain();

await DiscordBot.init();
