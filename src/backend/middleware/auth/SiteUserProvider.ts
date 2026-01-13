import passport_discord from 'passport-discord';
import { openPgSite } from '../../util/db.ts';
import { Request } from 'express';
import { isEquiv } from '../../../shared/util/arrayUtil.ts';
import { saveSession, setSessionUser } from './sessions.ts';
import { SiteNotice, SiteUser, SiteUserPrefs } from '../../../shared/types/site/site-user-types.ts';
import { cached, delcache } from '../../util/cache.ts';

type SiteUserEntity = {
  discord_id: string,
  discord_username: string,
  wiki_id?: number,
  wiki_username: string,
  json_data: SiteUser
}

const pg = openPgSite();

export class SiteUserProviderImpl {

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
  }

  // region Site Notice
  // --------------------------------------------------------------------------------------------------------------

  startSiteNoticeCacheEviction() {
    setInterval(async () => {
      await delcache(['Site:AllNotices', 'Site:AllBannerNotices'])
      await this.getAllSiteNotices();
      await this.getAllSiteNoticesForBanner();
    }, 30_000);
  }

  async getAllSiteNotices(): Promise<SiteNotice[]> {
    return await cached('Site:AllNotices', 'json', async () => {
      return await pg.select<SiteNotice[]>('*').from('site_notice')
        .where({ notice_enabled: true })
        .orderBy('id', 'DESC').then();
    });
  }

  async getAllSiteNoticesForBanner(): Promise<SiteNotice[]> {
    return cached('Site:AllBannerNotices', 'json', async () => {
      return await pg.select<SiteNotice[]>('*')
        .from('site_notice')
        .where({ notice_enabled: true, banner_enabled: true })
        .orderBy('id', 'DESC').then();
    });
  }

  async getSiteNoticesForBanner(request: Request): Promise<SiteNotice[]> {
    const discordId = request.user?.id;

    if (!discordId) {
      return [];
    }

    const allBannerNotices: SiteNotice[] = await this.getAllSiteNoticesForBanner();
    const myDismissed: number[] = await this.getSiteNoticesDismissed(discordId);

    return allBannerNotices
      .filter(b => !myDismissed.includes(b.id))
      .filter(b => {
        return !b.site_mode || request.context.siteMode === b.site_mode;
      })
      .filter(b => {
        if (!!b.exclude_site_modes) {
          return !b.exclude_site_modes.includes(request.context.siteMode);
        }
        return true;
      });
  }

  async getSiteNoticesDismissed(discordId: string): Promise<number[]> {
    return cached('Site:NoticesDismissed:' + discordId, 'json', async () => {
      return await pg('site_notice_dismissed')
        .select('notice_id')
        .where({discord_id: discordId})
        .pluck('notice_id')
        .then();
    });
  }

  async dismissSiteNotice(discordId: string, noticeId: number): Promise<void> {
    await delcache('Site:NoticesDismissed:' + discordId);
    await pg('site_notice_dismissed').insert({
      discord_id: discordId,
      notice_id: noticeId,
    });
  }
  // endregion

  // region Find User
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
  }
  // endregion

  // region Check User Status
  // --------------------------------------------------------------------------------------------------------------
  async isBanned(user: SiteUser): Promise<boolean> {
    if (!user || !user.id) {
      return false;
    }
    return cached('Site:UserBanned:' + user.id, 'disabled', async () => {
      let qb = pg.select('*').from('site_user_banned');
      if (user.wiki_username) {
        qb = qb.where({wiki_username: user.wiki_username}).or.where({discord_id: user.id});
      } else {
        qb = qb.where({discord_id: user.id});
      }
      const row: any = await qb.first().then();
      return !!row;
    });
  }

  async getBanReason(user: SiteUser): Promise<string> {
    if (!user || !user.id) {
      return null;
    }
    let qb = pg.select('reason').from('site_user_banned');
    if (user.wiki_username) {
      qb = qb.where({wiki_username: user.wiki_username}).or.where({discord_id: user.id});
    } else {
      qb = qb.where({discord_id: user.id});
    }
    return await qb.first().then(row => row?.reason);
  }

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
  }
  // endregion

  // region Update/Create
  // --------------------------------------------------------------------------------------------------------------

  async syncDatabaseStateToRequestUser(req: Request) {
    if (!req.user?.id) {
      return;
    }
    const dbSiteUser: SiteUser = await this.find(req.user.id);

    if (!dbSiteUser.roles) {
      dbSiteUser.roles = [];
      await this.update(dbSiteUser.id, {roles: []});
    }

    if (!isEquiv(dbSiteUser, req.user)) {
      setSessionUser(req, dbSiteUser);
      await saveSession(req);
      req.user = dbSiteUser;
    }
  }

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
  }

  async updatePrefs(discordId: string, modifier: (prefs: SiteUserPrefs) => void) {
    const data = await SiteUserProvider.find(discordId);
    if (!data) {
      return;
    }

    if (!data.prefs) {
      data.prefs = {};
    }

    modifier(data.prefs);

    await pg('site_user').where({discord_id: discordId}).update({
      json_data: JSON.stringify(data)
    }).then();
  }

  _newUserObject(discordUser: passport_discord.Profile): SiteUser {
    return {
      id: discordUser.id,
      discord_username: discordUser.username,
      discord: discordUser,
      prefs: {},
      roles: [],
    };
  }

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

      if (!row.json_data.wiki_allowed && (await this.isInReqBypass({discord_id: discordUser.id}))) {
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
  // endregion
}

export const SiteUserProvider = new SiteUserProviderImpl();
