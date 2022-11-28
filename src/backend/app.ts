import config from './config';
import { Express } from 'express';
import express from 'express';
import 'express-async-errors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import partialResponse from 'express-partial-response';
import useragent from 'express-useragent';
import helmet from 'helmet';
import csrf from 'csurf';
import { openKnex } from './util/db';
import serveIndex from 'serve-index';
import morgan from 'morgan';
import { Request, Response } from './util/router';
import sessions from './middleware/sessions';
import baseRouter from './controllers/BaseRouter';
import apiRouter from './controllers/api';
import { loadTextMaps, loadVoiceItems, loadQuestSummarization } from './scripts/textmap';
import { isStringNotBlank } from '../shared/util/stringUtil';
import rateLimit from 'express-rate-limit';
import requestIp from 'request-ip';
import globalErrorHandler from './middleware/globalErrorHandler';
import defaultResponseHeaders from './middleware/defaultResponseHeaders';

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
  const ejs = require('ejs');
  ejs.delimiter = config.views.ejsDelimiter;
  ejs.root = config.views.root;
  app.set('trust proxy', true);
  app.set('views', config.views.root);
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
  app.use(express.static(config.views.publicDir));
  if (process.env.SSL_WELL_KNOWN_DIR) {
    console.log('[Init] Serving .well-known directory');
    app.use('/.well-known', express.static(process.env.SSL_WELL_KNOWN_DIR), serveIndex(process.env.SSL_WELL_KNOWN_DIR));
  }

  // Middleware for requests
  // ~~~~~~~~~~~~~~~~~~~~~~~
  console.log(`[Init] Adding middleware for incoming requests`);
  app.use(morgan('dev', {
    skip: function(req: Request, res: Response) {
      return res.statusCode === 304 || req.url.includes('.css') || req.url.includes('.js')
        || req.url.includes('.png') || req.url.includes('.svg') || req.url.includes('.ico') || req.url.includes('.woff');
    }
  }));
  app.use(cookieParser()); // parses cookies
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

  // Middleware for responses
  // ~~~~~~~~~~~~~~~~~~~~~~~~
  console.log(`[Init] Adding middleware for outgoing responses`);
  app.use(compression()); // payload compression
  app.use(helmet({ // security-related headers
    contentSecurityPolicy: false, // CSP is set in base router
    crossOriginEmbedderPolicy: false,
  }));
  app.use(helmet.referrerPolicy({ policy: 'same-origin' })); // referrer policy header
  app.use(partialResponse()); // allows `fields` query param for JSON responses
  app.use(defaultResponseHeaders); // Add default response headers

  // Initialize sessions
  // ~~~~~~~~~~~~~~~~~~~
  console.log(`[Init] Initializing sessions`);
  app.use(sessions);

  // Load API router
  // ~~~~~~~~~~~~~~~
  console.log(`[Init] Loading API router`);
  app.use('/api', await apiRouter());

  // Load BaseRouter and CSRF protection
  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // We must load CSRF protection after we load the API router
  // because the API does not necessarily use CSRF protection (only for same-site AJAX requests).
  console.log(`[Init] Loading application router`);
  app.use(csrf(config.csrfConfig.standard));
  app.use('/', await baseRouter());

  // Global Error Handler
  // ~~~~~~~~~~~~~~~~~~~~
  console.log(`[Init] Adding global error handlers`);
  process.on('uncaughtException', (err) => console.error('UncaughtException!', err));
  process.on('unhandledRejection', (err) => console.error('UnhandledRejection!', err));
  app.use(globalErrorHandler);

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