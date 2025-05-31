import { CookieOptions, NextFunction, Request, Response, Router } from 'express';
import { create } from '../../../routing/router.ts';
import passport from 'passport';
import ejs from 'ejs';
import {
  mwGenshinClient,
  mwStarRailClient,
  MwUser,
  mwWuwaClient,
  mwZenlessClient,
} from '../../../mediawiki/mwClientInterface.ts';
import { SiteUserProvider } from '../../../middleware/auth/SiteUserProvider.ts';
import { saveSession, setSessionUser } from '../../../middleware/auth/sessions.ts';
import { SITE_TITLE } from '../../../loadenv.ts';
import { clearCsrfCookie } from '../../../middleware/request/csrf.ts';

const returnToCookieOptions: CookieOptions = {
  maxAge: 2000 * 60,
  httpOnly: true,
}

function setReturnTo() {
  return function(req: Request, res: Response, next: NextFunction) {
    if (req.query.cont) {
      res.cookie('ReturnTo', req.query.cont, returnToCookieOptions);
    }
    next();
  };
}

function getReturnTo(req: Request, res: Response) {
  if (req.cookies['ReturnTo']) {
    let cont = req.cookies['ReturnTo'];
    res.clearCookie('ReturnTo', returnToCookieOptions);
    return cont;
  } else if (req.query.cont) {
    return req.query.cont;
  } else {
    return '/';
  }
}

export default async function(): Promise<Router> {
  const router: Router = create();

  router.get('/auth/discord',
    setReturnTo(),
    passport.authenticate('discord'));

  router.get('/auth/callback',
    passport.authenticate('discord', {failureRedirect: '/authorize'}),
    (req: Request, res: Response) => {
      res.redirect('/auth/interstitial?cont=' + getReturnTo(req, res))
    });

  router.get('/auth/logout', (req: Request, res: Response) => {
    clearCsrfCookie(res);
    req.logout(() => {
      res.redirect('/auth/interstitial?cont=' + (req.query.cont || '/'))
    });
  });

  router.get('/auth/interstitial', (req: Request, res: Response) => {
    let cont: string = String(req.query.cont) || '/';
    if (!cont.startsWith('/') || cont.startsWith('//')) {
      cont = '/';
    }
    clearCsrfCookie(res);
    const html: string = `<!doctype html>
  <html lang="en"><body>
    <script>window.location.href = "<%= cont %>";</script>
  </body></html>`;
    res.set('Content-Type', 'text/html');
    res.send(Buffer.from(ejs.render(html, { cont })));
  });

  router.post('/auth/uncheck', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      res.json({
        result: 'error'
      });
      return;
    }

    await SiteUserProvider.update(req.user.id, {
      wiki_id: null,
      wiki_username: null,
      wiki_avatar: null,
      wiki_allowed: false,
    });

    res.json({
      result: 'complete'
    });
  });

  router.post('/auth/check', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      res.json({
        result: 'denied',
        reason: 'not logged in.'
      });
      return;
    }

    let userName: string = String(req.query.wikiUsername || '').trim();
    let wikiLang: string = String(req.query.wikiLang || '').trim();

    if (!userName || !userName.trim()) {
      res.json({
        result: 'denied',
        reason: 'no username entered.'
      });
      return;
    }

    const genshinUser = await mwGenshinClient.createForInterwiki(wikiLang).getUser(userName);
    const starRailUser = await mwStarRailClient.createForInterwiki(wikiLang).getUser(userName);
    const zenlessUser = await mwZenlessClient.createForInterwiki(wikiLang).getUser(userName);
    const wuwaUser = await mwWuwaClient.createForInterwiki(wikiLang).getUser(userName);

    let firstUser: MwUser = genshinUser || starRailUser || zenlessUser || wuwaUser;

    if (!firstUser) {
      res.json({
        result: 'denied',
        reason: 'Fandom user not found.'
      });
      return;
    }

    await SiteUserProvider.update(req.user.id, {
      wiki_id: firstUser.info.userid,
      wiki_username: firstUser.info.name,
      wiki_avatar: firstUser.profile.avatar
    });
    setSessionUser(req, {
      wiki_id: firstUser.info.userid,
      wiki_username: firstUser.info.name,
      wiki_avatar: firstUser.profile.avatar
    });
    await saveSession(req);

    if (firstUser.profile.discordHandle !== req.user.discord_username) {
      res.json({
        result: 'denied',
        reason: 'Discord Handle in Fandom profile does not match (actual: ' + (firstUser.profile.discordHandle || '<empty>') + ')'
      });
      return;
    }

    let hasPerm: boolean = await SiteUserProvider.isInReqBypass({
      wiki_username: firstUser.info.name
    });

    if (!hasPerm) {
      for (let mwUser of [genshinUser, starRailUser, zenlessUser, wuwaUser]) {
        if (mwUser && mwUser.info && mwUser.info.editcount >= 100 && mwUser.info.groups.includes('autoconfirmed')) {
          hasPerm = true;
          break;
        }
      }
    }

    if (!hasPerm) {
      res.json({
        result: 'denied',
        reason: 'must be autoconfirmed and have at least 100 edits in at least one of the wikis.'
      });
      return;
    }

    if (await SiteUserProvider.isBanned(req.user)) {
      res.json({
        result: 'banned',
        reason: `You are banned from accessing ${SITE_TITLE}.`
      });
      return;
    }

    await SiteUserProvider.update(req.user.id, {
      wiki_id: firstUser.info.userid,
      wiki_username: firstUser.info.name,
      wiki_avatar: firstUser.profile.avatar,
      wiki_allowed: true,
    });
    setSessionUser(req, {
      wiki_allowed: true
    });
    await saveSession(req);

    res.json({
      result: 'approved',
      reason: 'valid',
    });
    return;
  });

  return router;
}
