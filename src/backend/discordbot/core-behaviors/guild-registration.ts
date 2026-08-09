import { DiscordBotMain } from '../discord-bot.ts';
import { Events, Guild, Routes, Snowflake } from 'discord.js';
import { SiteMode } from '../../../shared/types/site/site-mode-type.ts';
import { DiscordBotModule } from '../discord-bot-module.ts';

const GUILD_TO_SITE_MODE_MAPPING: Record<Snowflake, SiteMode> = {
  '451637788669116437': 'genshin', // Genshin Impact Fandom Wiki
  '793804096418086922': 'genshin', // Saccharose.wiki
  '1535119110382551091': 'genshin', // Saccharose.test
};

const BotManagementGuilds: Set<Snowflake> = new Set<Snowflake>([
  '793804096418086922', // Saccharose.wiki
  '1535119110382551091', // Saccharose.test
]);

export class GuildRegistrationModule extends DiscordBotModule {

  constructor(bot: DiscordBotMain) {
    super(bot);
  }

  override init() {
    this.client.on(Events.GuildCreate, async (guild) => {
      await this.handleNewGuild(guild);
    });

    this.client.once(Events.ClientReady, async () => {
      for (const guild of this.client.guilds.cache.values()) {
        if (!this.isAllowedGuild(guild.id)) {
          await this.leaveUnauthorizedGuild(guild);
          continue;
        }

        try {
          const registeredCommands = await guild.commands.fetch();
          const registeredCommandNames = Array.from(registeredCommands.values()).map(cmd => cmd.name).sort();
          const applicableCommands = this.bot.commandRegistration.applicableCommands(guild.id);
          const applicableCommandNames = applicableCommands.map(cmd => cmd.name).sort();

          console.log('Registered commands for guild', guild.id, ':', registeredCommandNames);
          console.log('Applicable commands for guild', guild.id, ':', applicableCommandNames);

          if (registeredCommands.size === 0) {
            console.log(
              `[commands] Guild ${guild.id} has no commands registered; initializing...`
            );

            await this.registerGuildCommands(guild.id);
          } else if (registeredCommandNames.join(',') !== applicableCommandNames.join(',')) {
            console.log(
              `[commands] Guild ${guild.id} has mismatched commands; re-registering...`
            );

            await this.registerGuildCommands(guild.id);
          }
        } catch (error) {
          console.error(
            `[commands] Failed checking commands for guild ${guild.id}`,
            error
          );
        }
      }

      console.log(
        `[bot] Ready in ${this.client.guilds.cache.size} guild(s)`
      );
    });
  }

  getSiteModeForGuild(guildId: Snowflake): SiteMode {
    return GUILD_TO_SITE_MODE_MAPPING[guildId];
  }

  isBotManagementGuild(guildId: Snowflake): boolean {
    return BotManagementGuilds.has(guildId);
  }

  isAllowedGuild(guildId: Snowflake): boolean {
    return !!GUILD_TO_SITE_MODE_MAPPING[guildId];
  }

  async registerGuildCommands(guildId: Snowflake) {
    try {
      if (!this.isAllowedGuild(guildId)) {
        console.warn(
          `[commands] Attempted to register commands for unauthorized guild ${guildId}. Skipping.`
        );
        return;
      }

      const commandPayload = this.bot.commandRegistration.createCommandPayload(
        guildId
      );

      await this.rest.put(
        Routes.applicationGuildCommands(
          ENV.DISCORD_BOT_CLIENT_ID,
          guildId
        ),
        {
          body: commandPayload,
        }
      );

      console.log(
        `[commands] Registered ${commandPayload.length} commands for guild ${guildId}`
      );
    } catch (error) {
      console.error(
        `[commands] Failed to register commands for guild ${guildId}`,
        error
      );
    }
  }

  async leaveUnauthorizedGuild(guild: Guild) {
    try {
      console.warn(
        `[guild] Unauthorized guild detected: ${guild.name} (${guild.id}). Leaving.`
      );

      await guild.leave();

      console.log(
        `[guild] Left unauthorized guild ${guild.id}`
      );
    } catch (error) {
      console.error(
        `[guild] Failed to leave unauthorized guild ${guild.id}`,
        error
      );
    }
  }

  async handleNewGuild(guild: Guild) {
    if (!this.isAllowedGuild(guild.id)) {
      await this.leaveUnauthorizedGuild(guild);
      return;
    }

    console.log(
      `[guild] Joined allowed guild: ${guild.name} (${guild.id})`
    );

    await this.registerGuildCommands(guild.id);
  }

  async deployCommandsToAllowedGuilds() {
    for (const guildId of Object.keys(GUILD_TO_SITE_MODE_MAPPING)) {
      // Only deploy to guilds the bot is currently in.
      const guild = this.client.guilds.cache.get(guildId);

      if (!guild) {
        console.log(
          `[commands] Skipping guild ${guildId}; bot is not currently installed there`
        );
        continue;
      }

      await this.registerGuildCommands(guildId);
    }
  }
}
