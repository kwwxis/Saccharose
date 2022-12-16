// import passport from 'passport';
// import passport_discord from 'passport-discord';
// const DiscordStrategy = passport_discord.Strategy;
import session from 'express-session';
import { toBoolean } from '../../shared/util/genericUtil';

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
    secret: process.env.SESSID_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      secure: toBoolean(process.env.SSL_ENABLED),
    },
  }),
  //passport.initialize(),
  //passport.session(),
];