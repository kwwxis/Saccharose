import { Client, REST } from 'discord.js';
import { DiscordBotMain } from './discord-bot.ts';

export abstract class DiscordBotModule {
  protected constructor(readonly bot: DiscordBotMain) {}

  abstract init(): void;

  get rest(): REST {
    return this.bot.rest;
  }

  get client(): Client {
    return this.bot.client;
  }
}
