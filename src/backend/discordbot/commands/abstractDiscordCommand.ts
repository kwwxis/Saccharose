import { ChatInputCommandInteraction } from 'discord.js';
import { SiteUser } from '../../../shared/types/site/site-user-types.ts';
import { SharedSlashCommand } from '@discordjs/builders';
import { getGenshinControl } from '../../domain/genshin/genshinControl.ts';
import { getZenlessControl } from '../../domain/zenless/zenlessControl.ts';
import { getWuwaControl } from '../../domain/wuwa/wuwaControl.ts';
import { getStarRailControl } from '../../domain/hsr/starRailControl.ts';

export abstract class AbstractDiscordCommand {

  abstract readonly name: string;

  abstract schema(): SharedSlashCommand;

  abstract execute(ctx: ExecContext, command: ChatInputCommandInteraction): Promise<void>;
}

export class ExecContext {
  constructor(readonly user: SiteUser) {
  }

  get control() {
    switch (this.user.prefs.dbotSiteMode) {
      case 'unset':
        return null;
      case 'genshin':
        return getGenshinControl(this.user);
      case 'hsr':
        return getStarRailControl(this.user);
      case 'zenless':
        return getZenlessControl(this.user);
      case 'wuwa':
        return getWuwaControl(this.user);
    }
  }
}
