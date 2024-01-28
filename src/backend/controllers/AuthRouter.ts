import { NextFunction, Request, Response, Router } from 'express';
import { create } from '../routing/router.ts';
import passport from 'passport';
import ejs from 'ejs';
import { mwGenshinClient, mwStarRailClient, MwUser, mwZenlessClient } from '../mediawiki/mwClientInterface.ts';
import { SiteUserProvider } from '../middleware/auth/SiteUserProvider.ts';

function setReturnTo() {
  return function(req: Request, res: Response, next: NextFunction) {
    if (req.query.cont)
      (<any> req.session).returnTo = req.query.cont;
    next();
  };
}

function getReturnTo(req: Request) {
  if ((<any> req.session).returnTo) {
    let cont = (<any> req.session).returnTo;
    delete (<any> req.session).returnTo;
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
      res.redirect('/auth/interstitial?cont=' + getReturnTo(req))
    });

  router.get('/auth/logout', (req: Request, res: Response) => {
    req.logout(() => {
      res.redirect('/auth/interstitial?cont=' + (req.query.cont || '/'))
    });
  });

  router.get('/auth/interstitial', (req: Request, res: Response) => {
    let cont: string = String(req.query.cont) || '/';
    if (!cont.startsWith('/') || cont.startsWith('//')) {
      cont = '/';
    }
    const html: string = `<!doctype html>
  <html lang="en"><body>
    <script>window.location.href = "<%= cont %>";</script>
  </body></html>`;
    res.set('Content-Type', 'text/html');
    res.send(Buffer.from(ejs.render(html, { cont })));
  });

  router.get('/auth/info', (req: Request, res: Response) => {
    res.json(req.user);
  });

  router.post('/auth/uncheck', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.json({
        result: 'error'
      });
    }

    await SiteUserProvider.update(req.user.id, {
      wiki_id: null,
      wiki_username: null,
      wiki_avatar: null,
      wiki_allowed: false,
    });

    return res.json({
      result: 'complete'
    });
  });

  router.post('/auth/check', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.json({
        result: 'denied',
        reason: 'not logged in.'
      });
    }

    let userName: string = String(req.query.wikiUsername || '');
    let wikiLang: string = String(req.query.wikiLang || '');

    if (!userName || !userName.trim()) {
      return res.json({
        result: 'denied',
        reason: 'no username entered.'
      });
    }

    const genshinUser = await mwGenshinClient.createForInterwiki(wikiLang).getUser(userName);
    const starRailUser = await mwStarRailClient.createForInterwiki(wikiLang).getUser(userName);
    const zenlessUser = await mwZenlessClient.createForInterwiki(wikiLang).getUser(userName);

    let firstUser: MwUser = genshinUser || starRailUser || zenlessUser;

    if (!firstUser) {
      return res.json({
        result: 'denied',
        reason: 'Fandom user not found.'
      });
    }

    await SiteUserProvider.update(req.user.id, {
      wiki_id: firstUser.info.userid,
      wiki_username: firstUser.info.name,
      wiki_avatar: firstUser.profile.avatar
    });

    if (firstUser.profile.discordHandle !== req.user.discord_username) {
      return res.json({
        result: 'denied',
        reason: 'Discord Handle in Fandom profile does not match (actual: ' + (firstUser.profile.discordHandle || '<empty>') + ')'
      });
    }

    let hasPerm: boolean = false;

    for (let mwUser of [genshinUser, starRailUser, zenlessUser]) {
      if (mwUser && mwUser.info && mwUser.info.editcount >= 100 && mwUser.info.groups.includes('autoconfirmed')) {
        hasPerm = true;
        break;
      }
    }

    if (!hasPerm) {
      return res.json({
        result: 'denied',
        reason: 'must be autoconfirmed and have at least 100 edits in at least one of the wikis.'
      });
    }

    await SiteUserProvider.update(req.user.id, {
      wiki_id: firstUser.info.userid,
      wiki_username: firstUser.info.name,
      wiki_avatar: firstUser.profile.avatar,
      wiki_allowed: true,
    });

    return res.json({
      result: 'approved',
      reason: 'valid',
    });
  });

  return router;
}
