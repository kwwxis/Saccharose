import passport_discord from 'passport-discord';
import { openPg } from '../../util/db.ts';
import { Request } from 'express';
import { isEquiv } from '../../../shared/util/arrayUtil.ts';
import { saveSession, setSessionUser } from './sessions.ts';
import { SiteNotice, SiteUser } from '../../../shared/types/site/site-user-types.ts';

type SiteUserEntity = {
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
    if (siteUser.discord?.avatar) {
      return `https://cdn.discordapp.com/avatars/${siteUser.id}/${siteUser.discord?.avatar}.png`;
    } else {
      const avi_id = (BigInt(siteUser.discord.id) >> 22n) % 6n;
      return `https://cdn.discordapp.com/embed/avatars/${avi_id}.png`;
    }
  },

  // SITE NOTICE
  // --------------------------------------------------------------------------------------------------------------
  async getAllSiteNotices(): Promise<SiteNotice[]> {
    return await pg.select('*').from('site_notice').where({notice_enabled: true})
      .orderBy('id', 'DESC').then();
  },

  async getSiteNoticesForBanner(discordId: string): Promise<SiteNotice[]> {
    if (!discordId) {
      return [];
    }
    let sql = `
      SELECT n.id, n.notice_title, n.notice_type, n.notice_body, n.notice_link, n.notice_enabled, n.banner_enabled
      FROM site_notice n
      LEFT JOIN site_notice_dismissed d ON (n.id = d.notice_id AND d.discord_id = ?)
      WHERE n.notice_enabled = true AND n.banner_enabled = true AND d.discord_id IS NULL ORDER BY n.id DESC
    `;
    return await pg.raw(sql, [discordId]).then(raw => raw.rows);
  },

  async dismissSiteNotice(discordId: string, noticeId: number): Promise<void> {
    await pg('site_notice_dismissed').insert({
      discord_id: discordId,
      notice_id: noticeId,
    });
  },

  // Find User
  // --------------------------------------------------------------------------------------------------------------
  async find(discordId: string): Promise<SiteUser> {
    const row: SiteUserEntity = await pg.select('*').from('site_user').where({discord_id: discordId}).first().then();
    if (!row.json_data?.wiki_allowed) {
      let inBypass: boolean = false;

      if (row.discord_id && !inBypass) {
        inBypass = await this.isInReqBypass({discord_id: row.discord_id});
      }
      if (row.wiki_username && !inBypass) {
        inBypass = await this.isInReqBypass({wiki_username: row.wiki_username});
      }

      if (inBypass) {
        row.json_data.wiki_allowed = true;

        await pg('site_user').where({discord_id: row.discord_id}).update({
          json_data: JSON.stringify(row.json_data)
        });
      }
    }
    return row?.json_data;
  },

  // Check User Status
  // --------------------------------------------------------------------------------------------------------------
  async isBanned(user: SiteUser): Promise<boolean> {
    if (!user || !user.id) {
      return false;
    }
    let qb = pg.select('*').from('site_user_banned');
    if (user.wiki_username) {
      qb = qb.where({wiki_username: user.wiki_username}).or.where({discord_id: user.id});
    } else {
      qb = qb.where({discord_id: user.id});
    }
    const row: any = await qb.first().then();
    return !!row;
  },

  async isInReqBypass(by: {wiki_username?: string, discord_id?: string}): Promise<boolean> {
    if (!by) {
      return false;
    }
    if (!by.wiki_username && !by.discord_id) {
      return false;
    }

    if (by.discord_id) {
      const row: {wiki_username?: string, discord_id?: string} = await pg.select('*').from('site_user_wiki_bypass')
        .where({discord_id: by.discord_id}).first().then();
      return row?.discord_id === by.discord_id;
    }

    if (by.wiki_username) {
      const row: {wiki_username?: string, discord_id?: string} = await pg.select('*').from('site_user_wiki_bypass')
        .where({wiki_username: by.wiki_username}).first().then();
      return row?.wiki_username === by.wiki_username;
    }

    return false;
  },

  // Update/Create
  // --------------------------------------------------------------------------------------------------------------

  async syncDatabaseStateToRequestUser(req: Request) {
    if (!req.user?.id) {
      return;
    }
    const dbSiteUser: SiteUser = await this.find(req.user.id);

    if (!isEquiv(dbSiteUser, req.user)) {
      setSessionUser(req, dbSiteUser);
      await saveSession(req);
      req.user = dbSiteUser;
    }
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

  _newUserObject(discordUser: passport_discord.Profile): SiteUser {
    return {
      id: discordUser.id,
      discord_username: discordUser.username,
      discord: discordUser,
      prefs: {},
    };
  },

  async findOrCreate(discordId: string, discordUser: passport_discord.Profile): Promise<SiteUser> {
    const row: SiteUserEntity = await pg.select('*').from('site_user')
      .where({discord_id: discordId}).first().then();

    if (row) {
      // User already exists:
      row.discord_username = discordUser.username;

      if (!row.json_data) {
        row.json_data = this._newUserObject(discordUser);
      } else {
        Object.assign(row.json_data, <SiteUser> {
          discord_username: discordUser.username,
          discord: discordUser
        });
      }

      if (!row.json_data.wiki_allowed && await this.isInReqBypass({discord_id: discordUser.id})) {
        row.json_data.wiki_allowed = true;
      }

      await pg('site_user').where({discord_id: discordId}).update({
        discord_username: discordUser.username,
        json_data: JSON.stringify(row.json_data)
      }).then();

      return row.json_data;
    } else {
      // User does not exist:
      const newSiteUser: SiteUser = this._newUserObject(discordUser);
      if (await this.isInReqBypass({discord_id: discordUser.id})) {
        newSiteUser.wiki_allowed = true;
      }
      await pg('site_user').insert({
        discord_id: discordId,
        discord_username: discordUser.username,
        wiki_id: null,
        wiki_username: null,
        json_data: JSON.stringify(newSiteUser)
      });
      return newSiteUser;
    }
  }
}

