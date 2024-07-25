import passport from 'passport';
import passport_discord from 'passport-discord';
import session from 'express-session';
import { toBoolean } from '../../../shared/util/genericUtil.ts';
import { SiteUserProvider } from './SiteUserProvider.ts';
import connectPgSimple from 'connect-pg-simple';
import { pgPool } from '../../util/db.ts';
import { Request } from 'express';
import { SiteUser } from '../../../shared/types/site/site-user-types.ts';
const DiscordStrategy = passport_discord.Strategy;

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

passport.use(
  new DiscordStrategy(
    {
      clientID: process.env.DISCORD_APP_CLIENT_ID,
      clientSecret: process.env.DISCORD_APP_CLIENT_SECRET,
      callbackURL: '/auth/callback',
      scope: ['identify']
    },
    function(_accessToken: string, refreshToken: string, profile: passport_discord.Profile, done) {
      SiteUserProvider.findOrCreate(profile.id, profile).then(user => {
        done(null, user);
      }).catch(err => {
        done(err);
      })
    })
);

const pgSession = connectPgSimple(session);

export default [
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,

    store: new pgSession({
      pool: pgPool,
      tableName: 'user_sessions',
      createTableIfMissing: true,
    }),

    // Cookie prefixes: https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#cookie_prefixes
    // For a cookie to have the "__Host-" prefix it must:
    //   - have secure attribute set to true
    //   - NOT have a domain attribute
    //   - path set to "/"
    name: toBoolean(process.env.SSL_ENABLED) ? '__Host-connect.sid' : 'connect.sid',
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/',
      secure: toBoolean(process.env.SSL_ENABLED),
    },
  }),
  passport.initialize(),
  passport.session()
];

export function getSessionUser(req: Request): SiteUser {
  return req.user;
}

export function setSessionUser(req: Request, payload: Partial<SiteUser>) {
  Object.assign((<any> req.session).passport.user, payload);
}

export function saveSession(req: Request): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    req.session.save((err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}
