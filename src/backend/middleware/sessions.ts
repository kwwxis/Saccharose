// import passport from 'passport';

// import passport_discord from 'passport-discord';

// const DiscordStrategy = passport_discord.Strategy;
import session from 'express-session';
import { toBoolean } from '../../shared/util/genericUtil.ts';

// passport.serializeUser(function(user, done) {
//   done(null, user);
// });

// passport.deserializeUser(function(obj, done) {
//   done(null, obj);
// });

// passport.use(
//   new DiscordStrategy(config.auth.discordOAuth, function(accessToken, refreshToken, profile, done) {
//     process.nextTick(() => done(null, profile));
//   })
// );

export default [
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,

    // Cookie prefixes: https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#cookie_prefixes
    // For a cookie to have the "__Host-" prefix it must:
    //   - have secure attribute set to true
    //   - NOT have a domain attribute
    //   - path set to "/"
    name: toBoolean(process.env.SSL_ENABLED) ? '__Host-connect.sid' : 'connect.sid',
    cookie: {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/',
      secure: toBoolean(process.env.SSL_ENABLED),
    },
  }),
  //passport.initialize(),
  //passport.session(),
];
