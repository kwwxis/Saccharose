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
import { Request, Response, NextFunction } from './util/router';
import sessions from './middleware/sessions';
import baseRouter from './controllers/BaseRouter';
import apiRouter from './controllers/api';
import { loadTextMaps, loadVoiceItems, loadQuestSummarization } from './scripts/textmap';
import { isStringNotBlank } from '../shared/util/stringUtil';
import { toBoolean } from '../shared/util/genericUtil';

const app: Express = express();

export default {
  didInit: false,
  getInstance(): Express {
    return app;
  },
  async init(): Promise<Express> {
    if (this.didInit) return app;
    this.didInit = true;

    console.log(`[Init] Configuring dependencies`);
    const ejs = require('ejs');
    ejs.delimiter = config.views.ejsDelimiter;
    ejs.root = config.views.root;
    app.set('trust proxy', true);
    app.set('views', config.views.root);
    app.set('view engine', 'ejs');

    console.log(`[Init] Opening sqlite database and loading resources`);
    openKnex();
    if (isStringNotBlank(process.env.TEXTMAP_LANG_CODES)) {
      const textMapLangCodes: string[] = process.env.TEXTMAP_LANG_CODES.split(',');
      await loadTextMaps(textMapLangCodes);
    } else {
      await loadTextMaps();
    }
    await loadVoiceItems();
    await loadQuestSummarization();

    if (process.env.SSL_WELL_KNOWN_DIR) {
      console.log('[Init] Serving .well-known directory');
      app.use('/.well-known', express.static(process.env.SSL_WELL_KNOWN_DIR), serveIndex(process.env.SSL_WELL_KNOWN_DIR));
    }

    // These middleware functions parse the incoming request:
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

    // These middleware functions affect the outgoing responses:
    console.log(`[Init] Adding middleware for outgoing responses`);
    app.use(compression()); // payload compression
    app.use(helmet({ // security-related headers
      contentSecurityPolicy: false, // CSP is set in base router
      crossOriginEmbedderPolicy: false,
    }));
    app.use(helmet.referrerPolicy({ policy: 'same-origin' })); // referrer policy header
    app.use(partialResponse()); // allows `fields` query param for JSON responses
    app.use(express.static(config.views.publicDir)); // specifies public directory

    // Add default headers
    const sendHstsHeader: boolean = toBoolean(process.env.SSL_ENABLED) && process.env.NODE_ENV !== 'development';
    app.use((req, res, next) => {
      res.header('X-Robots-Tag', 'noindex, nofollow');
      if (sendHstsHeader && req.headers.host === process.env.VHOST) {
        res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
      }
      next();
    });

    // Initialize sessions
    console.log(`[Init] Initializing sessions`);
    app.use(sessions);

    // Load API router
    console.log(`[Init] Loading API router`);
    app.use('/api', await apiRouter());

    // Load BaseRouter and CSRF protection. We must load CSRF protection after we load the API router
    // because the API does not necessarily use CSRF protection (only for same-site AJAX requests).
    console.log(`[Init] Loading application router`);
    app.use(csrf(config.csrfConfig.standard));
    app.use('/', await baseRouter());

    // Global Error Handlers
    console.log(`[Init] Adding global error handlers`);
    process.on('uncaughtException', function(err) {
      console.error('UncaughtException!', err);
    });
    process.on('unhandledRejection', function(err) {
      console.error('UnhandledRejection!', err);
    });
    app.use(async function(err: any, req: Request, res: Response, next: NextFunction) {
      console.error(err);

      if (res.headersSent) {
        return next(err);
      }

      if (err && typeof err === 'object' && err.code === 'EBADCSRFTOKEN') {
        return res.status(403).sendFile(`${config.views.root}/errorPages/csrfTokenDenied.html`);
      }

      do {
        try {
          await res.status(404).render('errorPages/500', null, null, true);
          return;
        } catch (e) {
          req.context.popViewStack();
          req.context.popViewStack();
        }
      } while (req.context.canPopViewStack());

      // Depending on what causes the error, attempting to render 'errorPages/500.ejs' might cause an error too.
      // In that case then just send an HTML file as the safe option.
      res.status(500).sendFile(`${config.views.root}/errorPages/500.html`);
    });

      // 404-Handler: this must always be last.
    app.get('*', function(_req: Request, res: Response) {
      res.status(404).render('errorPages/404');
    });

    // Application loading complete
    console.log(`[Init] Application code fully loaded`);
    return app;
  },
};