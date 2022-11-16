// import passport from 'passport';
// import passport_discord from 'passport-discord';
// const DiscordStrategy = passport_discord.Strategy;
import config from '../config';

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
  config.session,
  //passport.initialize(),
  //passport.session(),
];