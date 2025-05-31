import { Express } from 'express';
import express from 'express';
import 'express-async-errors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import useragent from 'express-useragent';
import helmet from 'helmet';
import { openSqlite, openPg, enableDbExitHook } from './util/db.ts';
import sessions from './middleware/auth/sessions.ts';
import appBaseRouter from './controllers/AppBaseRouter.ts';
import apiBaseRouter from './controllers/ApiBaseRouter.ts';
import { isStringNotBlank } from '../shared/util/stringUtil.ts';
import requestIp from 'request-ip';
import jsonResponse from './middleware/response/jsonResponse.ts';
import antiBots from './middleware/request/antiBots.ts';
import { traceMiddleware } from './middleware/request/tracer.ts';
import { normalAccessLogging, earlyAccessLogging } from './middleware/request/accessLogging.ts';
import defaultResponseHeaders from './middleware/response/defaultResponseHeaders.ts';
import { PUBLIC_DIR, VIEWS_ROOT } from './loadenv.ts';
import { doubleCsrfProtection } from './middleware/request/csrf.ts';
import { pageLoadErrorHandler } from './middleware/response/globalErrorHandler.ts';
import { loadGenshinVoiceItems } from './domain/genshin/genshinControl.ts';
import { loadStarRailVoiceItems } from './domain/hsr/starRailControl.ts';
import { loadStarRailTextSupportingData } from './domain/hsr/starRailText.ts';
import { loadGenshinTextSupportingData } from './domain/genshin/genshinText.ts';
import { loadZenlessTextSupportingData } from './domain/zenless/zenlessText.ts';
import { Request, Response } from 'express';
import { logInit, logInitCache } from './util/logger.ts';
import imageBaseRouter from './controllers/ImageBaseRouter.ts';
import { createStaticImagesHandler } from './middleware/request/staticImagesHandler.ts';
import { ScriptJobCoordinator } from './util/scriptJobs.ts';
import authRouter from './controllers/site/app/AuthRouter.ts';
import { createSiteUserMiddlewareRouter } from './middleware/auth/siteUserMiddleware.ts';
import visitorRouter from './controllers/visitor/VisitorRouter.ts';
import { reqContextInitMiddleware } from './routing/router.ts';
import { cached, enableRedisExitHook, openRedisClient, redisClient, redisDelPattern } from './util/cache.ts';
import {
  CurrentGenshinVersion,
  CurrentStarRailVersion,
  CurrentWuwaVersion,
  CurrentZenlessVersion,
} from '../shared/types/game-versions.ts';
import { enableLogFileWatchShutdownHook, startLogFileWatch } from './logview/logview.ts';

const app: Express = express();

let didInit: boolean = false;

// noinspection JSUnusedGlobalSymbols
export function getInstance(): Express {
  return app;
}

export async function appInit(): Promise<Express> {
  if (didInit) return app;
  didInit = true;

  logInit(`Configuring dependencies`);
  app.set('trust proxy', true);
  app.set('views', VIEWS_ROOT);
  app.set('view engine', 'ejs');

  // Load application resources
  // ~~~~~~~~~~~~~~~~~~~~~~~~~~
  logInit(`Opening sqlite database and loading data resources`);
  openSqlite();
  openPg();
  enableDbExitHook();
  ScriptJobCoordinator.init();
  await ScriptJobCoordinator.deleteOldJobs();
  await ScriptJobCoordinator.markAllComplete();

  // LogView
  // ~~~~~~~~~~~~~~~~~~~~~~~~~~
  await startLogFileWatch();
  await enableLogFileWatchShutdownHook();

  // Initialize Cache
  // ~~~~~~~~~~~~~~~~
  logInitCache('Opening Redis Client');
  await openRedisClient();
  enableRedisExitHook();

  const redisGenshinVersion: string = await redisClient().get('Genshin:CurrentVersion');
  const redisStarRailVersion: string = await redisClient().get('StarRail:CurrentVersion');
  const redisZenlessVersion: string = await redisClient().get('Zenless:CurrentVersion');
  const redisWuwaVersion: string = await redisClient().get('Wuwa:CurrentVersion');

  // Automatically clear cache when current version number is incremented:
  if (redisGenshinVersion !== CurrentGenshinVersion.number) {
    logInitCache('Clearing Redis cache for Genshin Impact!');
    await redisDelPattern('Genshin:*');
    await redisClient().set('Genshin:CurrentVersion', CurrentGenshinVersion.number);
  }
  if (redisStarRailVersion !== CurrentStarRailVersion.number) {
    logInitCache('Clearing Redis cache for Honkai Star Rail!');
    await redisDelPattern('StarRail:*');
    await redisClient().set('StarRail:CurrentVersion', CurrentStarRailVersion.number);
  }
  if (redisZenlessVersion !== CurrentZenlessVersion.number) {
    logInitCache('Clearing Redis cache for Zenless Zone Zero!');
    await redisDelPattern('Zenless:*');
    await redisClient().set('Zenless:CurrentVersion', CurrentZenlessVersion.number);
  }
  if (redisWuwaVersion !== CurrentWuwaVersion.number) {
    logInitCache('Clearing Redis cache for Wuthering Waves!');
    await redisDelPattern('Wuwa:*');
    await redisClient().set('Wuwa:CurrentVersion', CurrentWuwaVersion.number);
  }

  // Load supporting game data
  // ~~~~~~~~~~~~~~~~~~~~~~~~~
  await loadGenshinVoiceItems();
  await loadStarRailVoiceItems();
  await loadGenshinTextSupportingData();
  await loadStarRailTextSupportingData();
  await loadZenlessTextSupportingData();

  app.use(earlyAccessLogging);

  // Serve static directories
  // ~~~~~~~~~~~~~~~~~~~~~~~~
  app.use(express.static(PUBLIC_DIR));

  if (isStringNotBlank(process.env.EXT_PUBLIC_DIR)) {
    logInit('Serving external public directory');
    app.use(express.static(process.env.EXT_PUBLIC_DIR));
  }

  if (isStringNotBlank(process.env.EXT_GENSHIN_IMAGES)) {
    logInit('Serving external Genshin images');
    app.use('/images/genshin', createStaticImagesHandler(process.env.EXT_GENSHIN_IMAGES, '/images/genshin/', 'genshin'));
  } else {
    throw 'EXT_GENSHIN_IMAGES is required!';
  }
  if (isStringNotBlank(process.env.EXT_HSR_IMAGES)) {
    logInit('Serving external HSR images');
    app.use('/images/hsr', createStaticImagesHandler(process.env.EXT_HSR_IMAGES, '/images/hsr/', 'hsr'));
  } else {
    throw 'EXT_HSR_IMAGES is required!';
  }
  if (isStringNotBlank(process.env.EXT_ZENLESS_IMAGES)) {
    logInit('Serving external Zenless images');
    app.use('/images/zenless', createStaticImagesHandler(process.env.EXT_ZENLESS_IMAGES, '/images/zenless/', 'zenless'));
  } else {
    throw 'EXT_ZENLESS_IMAGES is required!';
  }
  if (isStringNotBlank(process.env.EXT_WUWA_IMAGES)) {
    logInit('Serving external Wuthering Waves images');
    app.use('/images/wuwa/Game/Aki/UI', createStaticImagesHandler(process.env.EXT_WUWA_IMAGES, '/images/wuwa/', 'wuwa'));
    app.use('/images/wuwa//Game/Aki/UI', createStaticImagesHandler(process.env.EXT_WUWA_IMAGES, '/images/wuwa/', 'wuwa'));
    app.use('/images/wuwa', createStaticImagesHandler(process.env.EXT_WUWA_IMAGES, '/images/wuwa/', 'wuwa'));
  } else {
    throw 'EXT_WUWA_IMAGES is required!';
  }

  // Initialize sessions
  // ~~~~~~~~~~~~~~~~~~~
  logInit(`Initializing sessions`);
  app.use(sessions);                                        // sessions

  // Middleware for requests
  // ~~~~~~~~~~~~~~~~~~~~~~~
  logInit(`Adding middleware for incoming requests`);
  app.use(antiBots);                                        // rejects bot-like requests
  app.use(cookieParser(process.env.SESSION_SECRET));        // parses cookies
  app.use(useragent.express());                             // parses user-agent header
  app.use(express.urlencoded({extended: true}));     // parses url-encoded POST/PUT bodies
  app.use(requestIp.mw());                                  // enable request-ip
  app.use(traceMiddleware);

  // Initialize Request Context
  // ~~~~~~~~~~~~~~~~~~~~~~~~~~
  app.use(reqContextInitMiddleware);                        // request context init
  app.use(normalAccessLogging);                             // access logging

  // Middleware for responses
  // ~~~~~~~~~~~~~~~~~~~~~~~~
  logInit(`Adding middleware for outgoing responses`);
  app.use(compression());                                   // payload compression
  app.use(helmet({                                   // security-related headers
    contentSecurityPolicy: false,                           // CSP header is set in base router
    crossOriginEmbedderPolicy: false,
    hsts: false,                                            // HSTS header is set in defaultResponseHeaders
  }));
  app.use(helmet.referrerPolicy({                    // referrer policy header
    policy: 'same-origin'
  }));
  app.use(jsonResponse);                                    // JSON response field masking
  app.use(defaultResponseHeaders);                          // Add default response headers

  // Load authorize endpoint
  // ~~~~~~~~~~~~~~~~~~~~~~~
  app.use(await authRouter());

  // Load Visitor Router
  // ~~~~~~~~~~~~~~~~~~~
  app.use(await visitorRouter());

  // Load API router
  // ~~~~~~~~~~~~~~~
  // API router uses its own auth flow and should not come after "siteUserMiddlewareRouter()"
  logInit(`Loading API router`);
  app.use('/api', await apiBaseRouter());

  // Load auth middleware
  // ~~~~~~~~~~~~~~~~~~~~
  app.use(createSiteUserMiddlewareRouter());
  // ALL ENDPOINTS PAST THIS POINT ARE SUBJECT TO REQUIRING AUTHENTICATION

  // Load serve-image router
  // ~~~~~~~~~~~~~~~~~~~~~~~
  logInit(`Loading image router`);
  app.use('/serve-image', await imageBaseRouter());

  // Load BaseRouter and CSRF protection
  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // We must load CSRF protection after we load the API router
  // because the API does not necessarily use CSRF protection (only for same-site AJAX requests).
  logInit(`Loading application router`);
  app.use(doubleCsrfProtection);
  app.use('/', await appBaseRouter());

  // Global Error Handler
  // ~~~~~~~~~~~~~~~~~~~~
  logInit(`Adding global error handlers`);
  process.on('uncaughtException', (err) => console.error('UncaughtException!', err));
  process.on('unhandledRejection', (err) => console.error('UnhandledRejection!', err));
  app.use(pageLoadErrorHandler);

  // 404-Handler
  // ~~~~~~~~~~~
  // 404 handler must come after all other routers are loaded
  logInit(`Registering 404 handler`);
  app.get('*', function(_req: Request, res: Response) {
    res.status(404).render('errors/404');
  });

  // Application loading complete
  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  logInit(`Application code fully loaded`);
  return app;
}
