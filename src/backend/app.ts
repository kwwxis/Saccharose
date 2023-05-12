import { Express } from 'express';
import express from 'express';
import 'express-async-errors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import useragent from 'express-useragent';
import helmet from 'helmet';
import { openKnex } from './util/db';
import { Request, Response } from './util/router';
import sessions from './middleware/sessions';
import appBaseRouter from './controllers/AppBaseRouter';
import apiBaseRouter from './controllers/ApiBaseRouter';
import { loadVoiceItems } from './domain/genshin/genshinVoiceItems';
import { isStringNotBlank } from '../shared/util/stringUtil';
import requestIp from 'request-ip';
import jsonResponse from './middleware/response/jsonResponse';
import antiBots from './middleware/request/antiBots';
import rateLimiter from './middleware/request/rateLimiter';
import accessLogging from './middleware/request/accessLogging';
import defaultResponseHeaders from './middleware/response/defaultResponseHeaders';
import { PUBLIC_DIR, VIEWS_ROOT } from './loadenv';
import { csrfMiddleware } from './middleware/request/csrf';
import { pageLoadErrorHandler } from './middleware/response/globalErrorHandler';
import { loadSpriteTags } from './domain/genshin/misc/spriteTags';

const app: Express = express();
let didInit: boolean = false;

// noinspection JSUnusedGlobalSymbols
export function getInstance(): Express {
  return app;
}

export async function appInit(): Promise<Express> {
  if (didInit) return app;
  didInit = true;

  console.log(`[Init] Configuring dependencies`);
  app.set('trust proxy', true);
  app.set('views', VIEWS_ROOT);
  app.set('view engine', 'ejs');

  // Load Genshin data resources
  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~
  console.log(`[Init] Opening sqlite database and loading Genshin data resources`);
  openKnex();
  await loadVoiceItems();
  await loadSpriteTags();

  // Serve static directories
  // ~~~~~~~~~~~~~~~~~~~~~~~~
  app.use(express.static(PUBLIC_DIR));
  if (isStringNotBlank(process.env.EXT_PUBLIC_DIR)) {
    console.log('[Init] Serving external public directory');
    app.use(express.static(process.env.EXT_PUBLIC_DIR));
  }

  // Initialize sessions
  // ~~~~~~~~~~~~~~~~~~~
  console.log(`[Init] Initializing sessions`);
  app.use(sessions);

  // Middleware for requests
  // ~~~~~~~~~~~~~~~~~~~~~~~
  console.log(`[Init] Adding middleware for incoming requests`);
  app.use(antiBots);                                        // rejects bot-like requests
  app.use(cookieParser(process.env.SESSION_SECRET));        // parses cookies
  app.use(useragent.express());                             // parses user-agent header
  app.use(express.urlencoded({extended: true}));     // parses url-encoded POST/PUT bodies
  app.use(requestIp.mw());                                  // enable request-ip
  app.use(rateLimiter);                                     // rate-limits requests
  app.use(accessLogging);                                   // access logging

  // Middleware for responses
  // ~~~~~~~~~~~~~~~~~~~~~~~~
  console.log(`[Init] Adding middleware for outgoing responses`);
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

  // Load API router
  // ~~~~~~~~~~~~~~~
  console.log(`[Init] Loading API router`);
  app.use('/api', await apiBaseRouter());

  // Load BaseRouter and CSRF protection
  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // We must load CSRF protection after we load the API router
  // because the API does not necessarily use CSRF protection (only for same-site AJAX requests).
  console.log(`[Init] Loading application router`);
  app.use(csrfMiddleware);
  app.use('/', await appBaseRouter());

  // Global Error Handler
  // ~~~~~~~~~~~~~~~~~~~~
  console.log(`[Init] Adding global error handlers`);
  process.on('uncaughtException', (err) => console.error('UncaughtException!', err));
  process.on('unhandledRejection', (err) => console.error('UnhandledRejection!', err));
  app.use(pageLoadErrorHandler);

  // 404-Handler
  // ~~~~~~~~~~~
  // 404 handler must come after all other routers are loaded
  console.log(`[Init] Registering 404 handler`);
  app.get('*', function(_req: Request, res: Response) {
    res.status(404).render('errors/404');
  });

  // Application loading complete
  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  console.log(`[Init] Application code fully loaded`);
  return app;
}