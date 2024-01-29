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
import accessLogging from './middleware/request/accessLogging.ts';
import defaultResponseHeaders from './middleware/response/defaultResponseHeaders.ts';
import { PUBLIC_DIR, VIEWS_ROOT } from './loadenv.ts';
import { csrfMiddleware } from './middleware/request/csrf.ts';
import { pageLoadErrorHandler } from './middleware/response/globalErrorHandler.ts';
import { loadGenshinVoiceItems } from './domain/genshin/genshinControl.ts';
import { loadStarRailVoiceItems } from './domain/hsr/starRailControl.ts';
import { loadStarRailTextSupportingData } from './domain/hsr/starRailText.ts';
import { loadGenshinTextSupportingData } from './domain/genshin/genshinText.ts';
import { loadZenlessTextSupportingData } from './domain/zenless/zenlessText.ts';
import { Request, Response } from 'express';
import { logInit } from './util/logger.ts';
import imageBaseRouter from './controllers/ImageBaseRouter.ts';
import { createStaticImagesHandler } from './middleware/request/staticImagesHandler.ts';
import { ScriptJobCoordinator } from './util/scriptJobs.ts';
import passport from 'passport';
import authRouter from './controllers/AuthRouter.ts';
import { createSiteUserMiddlewareRouter } from './middleware/auth/siteUserMiddleware.ts';

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

  // Load Genshin data resources
  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~
  logInit(`Opening sqlite database and loading data resources`);
  openSqlite();
  openPg();
  enableDbExitHook();
  await loadGenshinVoiceItems();
  await loadStarRailVoiceItems();
  await loadGenshinTextSupportingData();
  await loadStarRailTextSupportingData();
  await loadZenlessTextSupportingData();
  await ScriptJobCoordinator.cleanup();

  // Serve static directories
  // ~~~~~~~~~~~~~~~~~~~~~~~~
  app.use(express.static(PUBLIC_DIR));

  if (isStringNotBlank(process.env.EXT_PUBLIC_DIR)) {
    logInit('Serving external public directory');
    app.use(express.static(process.env.EXT_PUBLIC_DIR));
  }

  if (isStringNotBlank(process.env.EXT_GENSHIN_IMAGES)) {
    logInit('Serving external Genshin images');
    app.use('/images/genshin', createStaticImagesHandler(process.env.EXT_GENSHIN_IMAGES, '/images/genshin/'));
  } else {
    throw 'EXT_GENSHIN_IMAGES is required!';
  }
  if (isStringNotBlank(process.env.EXT_HSR_IMAGES)) {
    logInit('Serving external HSR images');
    app.use('/images/hsr', createStaticImagesHandler(process.env.EXT_HSR_IMAGES, '/images/hsr/'));
  } else {
    throw 'EXT_HSR_IMAGES is required!';
  }
  if (isStringNotBlank(process.env.EXT_ZENLESS_IMAGES)) {
    logInit('Serving external Zenless images');
    app.use('/images/zenless', createStaticImagesHandler(process.env.EXT_ZENLESS_IMAGES, '/images/zenless/'));
  } else {
    throw 'EXT_ZENLESS_IMAGES is required!';
  }

  // Middleware for requests
  // ~~~~~~~~~~~~~~~~~~~~~~~
  logInit(`Adding middleware for incoming requests`);
  app.use(antiBots);                                        // rejects bot-like requests
  app.use(cookieParser(process.env.SESSION_SECRET));        // parses cookies
  app.use(useragent.express());                             // parses user-agent header
  app.use(express.urlencoded({extended: true}));     // parses url-encoded POST/PUT bodies
  app.use(requestIp.mw());                                  // enable request-ip
  app.use(traceMiddleware);
  app.use(accessLogging);                                   // access logging

  // Initialize sessions
  // ~~~~~~~~~~~~~~~~~~~
  logInit(`Initializing sessions`);
  app.use(sessions);

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

  // Load API router
  // ~~~~~~~~~~~~~~~
  logInit(`Loading API router`);
  app.use('/api', await apiBaseRouter());

  // Load auth middleware
  // ~~~~~~~~~~~~~~~~~~~~
  app.use(createSiteUserMiddlewareRouter());

  // Load serve-image router
  // ~~~~~~~~~~~~~~~~~~~~~~~
  logInit(`Loading image router`);
  app.use('/serve-image', await imageBaseRouter());

  // Load BaseRouter and CSRF protection
  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // We must load CSRF protection after we load the API router
  // because the API does not necessarily use CSRF protection (only for same-site AJAX requests).
  logInit(`Loading application router`);
  app.use(csrfMiddleware);
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
