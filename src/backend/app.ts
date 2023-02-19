import { Express } from 'express';
import express from 'express';
import 'express-async-errors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import useragent from 'express-useragent';
import helmet from 'helmet';
import { openKnex } from './util/db';
import morgan from 'morgan';
import { Request, Response } from './util/router';
import sessions from './middleware/sessions';
import appBaseRouter from './controllers/AppBaseRouter';
import apiBaseRouter from './controllers/ApiBaseRouter';
import { loadTextMaps, loadVoiceItems, loadQuestSummarization } from './scripts/textmap';
import { isStringNotBlank } from '../shared/util/stringUtil';
import rateLimit from 'express-rate-limit';
import requestIp from 'request-ip';
import jsonResponse from './middleware/jsonResponse';
import defaultResponseHeaders from './middleware/defaultResponseHeaders';
import { PUBLIC_DIR, VIEWS_ROOT } from './loadenv';
import { csrfMiddleware } from './middleware/csrf';
import { pageLoadErrorHandler } from './middleware/globalErrorHandler';

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
  if (isStringNotBlank(process.env.TEXTMAP_LANG_CODES)) {
    const textMapLangCodes: string[] = process.env.TEXTMAP_LANG_CODES.split(',');
    await loadTextMaps(textMapLangCodes);
  } else {
    await loadTextMaps();
  }
  await loadVoiceItems();
  await loadQuestSummarization();

  // Serve static directories
  // ~~~~~~~~~~~~~~~~~~~~~~~~
  app.use(express.static(PUBLIC_DIR));
  if (isStringNotBlank(process.env.EXT_PUBLIC_DIR)) {
    console.log('[Init] Serving EXT_PUBLIC_DIR directory');
    app.use(express.static(process.env.EXT_PUBLIC_DIR));
  }

  // Initialize sessions
  // ~~~~~~~~~~~~~~~~~~~
  console.log(`[Init] Initializing sessions`);
  app.use(sessions);

  // Middleware for requests
  // ~~~~~~~~~~~~~~~~~~~~~~~
  console.log(`[Init] Adding middleware for incoming requests`);
  app.use(cookieParser(process.env.SESSION_SECRET)); // parses cookies
  app.use(useragent.express()); // parses user-agent header
  app.use(express.urlencoded({extended: true})); // parses url-encoded POST/PUT bodies
  app.use(requestIp.mw()); // enable request-ip
  app.use(rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // limit each IP to 30 requests per windowMs
    keyGenerator: (req: Request, _res: Response) => {
      return req.clientIp // IP address from requestIp.mw(), as opposed to req.ip
    }
  }));

  // Middleware for logging
  // ~~~~~~~~~~~~~~~~~~~~~~
  const skipRegex: RegExp = /\.css|\.js|\.png|\.svg|\.ico|\.jpg|\.woff|\.env/g;

  morgan.token('date', function(){
    return new Date().toLocaleString('en-US', {timeZone: 'America/Los_Angeles'});
  });

  app.use(morgan('[:date[web] PST] :method :url :status :response-time ms - :res[content-length]', {
    skip: function(req: Request, res: Response) {
      return res.statusCode === 304 || skipRegex.test(req.url);
    }
  }));

  // Middleware for responses
  // ~~~~~~~~~~~~~~~~~~~~~~~~
  console.log(`[Init] Adding middleware for outgoing responses`);
  app.use(compression()); // payload compression
  app.use(helmet({ // security-related headers
    contentSecurityPolicy: false, // CSP header is set in base router
    crossOriginEmbedderPolicy: false,
    hsts: false, // HSTS header is set in defaultResponseHeaders
  }));
  app.use(helmet.referrerPolicy({ policy: 'same-origin' })); // referrer policy header
  app.use(jsonResponse)
  app.use(defaultResponseHeaders); // Add default response headers

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
    res.status(404).render('errorPages/404');
  });

  // Application loading complete
  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  console.log(`[Init] Application code fully loaded`);
  return app;
}