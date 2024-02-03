import passport_discord from 'passport-discord';
import { openPg } from '../../util/db.ts';
import { toBoolean } from '../../../shared/util/genericUtil.ts';

export const SiteAuthEnabled: boolean = toBoolean(process.env.AUTH_ENABLED);

export type SiteUser = {
  id: string,
  discord_username: string,
  discord: passport_discord.Profile,

  wiki_id?: number,
  wiki_username?: string,
  wiki_avatar?: string,
  wiki_allowed?: boolean,
};

export type SiteUserEntity = {
  discord_id: string,
  discord_username: string,
  wiki_id?: number,
  wiki_username: string,
  json_data: SiteUser
}

const pg = openPg();

export const SiteUserProvider = {

  getAvatarUrl(siteUser: SiteUser): string{
    if (!siteUser) {
      return '';
    }
    return `https://cdn.discordapp.com/avatars/${siteUser.id}/${siteUser.discord.avatar}.png`;
  },

  async find(discordId: string): Promise<SiteUser> {
    const row: SiteUserEntity = await pg.select('*').from('site_user').where({discord_id: discordId}).first().then();
    if (row.wiki_username && !row.json_data?.wiki_allowed) {
      const inBypass: boolean = await this.isInReqBypass(row.wiki_username);
      if (inBypass) {
        row.json_data.wiki_allowed = true;

        await pg('site_user').where({discord_id: row.discord_id}).update({
          json_data: JSON.stringify(row.json_data)
        });
      }
    }
    return row?.json_data;
  },

  async isInReqBypass(wikiUsername: string): Promise<boolean> {
    const row: {wiki_username: string} = await pg.select('*').from('site_user_wiki_bypass')
      .where({wiki_username: wikiUsername}).first().then();
    return row?.wiki_username === wikiUsername;
  },

  async update(discordId: string, payload: Partial<SiteUser>) {
    const data = await SiteUserProvider.find(discordId);
    if (!data) {
      return;
    }

    Object.assign(data, payload);

    await pg('site_user').where({discord_id: discordId}).update({
      discord_username: payload?.discord?.username || data.discord_username,
      wiki_id: payload?.wiki_id || data.wiki_id,
      wiki_username: payload?.wiki_username || data.wiki_username,
      json_data: JSON.stringify(data)
    }).then();
  },

  async findOrCreate(discordId: string, discordUser: passport_discord.Profile): Promise<SiteUser> {
    const siteUser: SiteUser = {
      id: discordUser.id,
      discord_username: discordUser.username,
      discord: discordUser,
    }

    const row: SiteUserEntity = await pg.select('*').from('site_user')
      .where({discord_id: discordId}).first().then();

    if (row) {
      row.discord_username = discordUser.username;
      if (!row.json_data)
        row.json_data = siteUser;
      Object.assign(row.json_data, siteUser);

      await pg('site_user').where({discord_id: discordId}).update({
        discord_username: discordUser.username,
        json_data: JSON.stringify(row.json_data)
      }).then();
    } else {
      await pg('site_user').insert({
        discord_id: discordId,
        discord_username: discordUser.username,
        wiki_id: null,
        wiki_username: null,
        json_data: JSON.stringify(siteUser)
      });
    }

    return siteUser;
  }
}

