const STEPS_TO_LOAD = 9;

console.log(`(1/${STEPS_TO_LOAD}) Requiring dependencies`);
import config from '@/config';
import { Express, Request, Response, NextFunction } from 'express';
const express = require('express');
import compression from 'compression';
import cookieParser from 'cookie-parser';
const partialResponse = require('express-partial-response');
import useragent from 'express-useragent';
import helmet from 'helmet';
import csrf from 'csurf';
import exitHook from 'async-exit-hook';
import { openKnex } from '@db';

import sessions from '@/middleware/sessions';
import baseRouter from '@/controllers/BaseRouter';
import apiRouter from '@/controllers/api';

const app: Express = express();

export default {
  didInit: false,
  getInstance(): Express {
    return app;
  },
  async init(): Promise<Express> {
    if (this.didInit) return app;
    this.didInit = true;

    console.log(`(2/${STEPS_TO_LOAD}) Configuring dependencies`);
    const ejs = require('ejs');
    ejs.delimiter = config.views.ejsDelimiter;
    ejs.root = config.views.root;
    app.set('trust proxy', true);
    app.set('views', config.views.root);
    app.set('view engine', 'ejs');

    console.log(`(4/${STEPS_TO_LOAD}) Opening sqlite database`);
    openKnex();

    // These middleware functions parse the incoming request:
    console.log(`(3/${STEPS_TO_LOAD}) Adding middleware for incoming requests`);
    app.use(cookieParser()); // parses cookies
    app.use(useragent.express()); // parses user-agent header
    app.use(express.urlencoded({extended: true})); // parses url-encoded POST/PUT bodies

    // These middleware functions affect the outgoing responses:
    console.log(`(4/${STEPS_TO_LOAD}) Adding middleware for outgoing responses`);
    app.use(compression()); // payload compression
    app.use(helmet({ // security-related headers
      contentSecurityPolicy: false, // CSP is set in base router
      crossOriginEmbedderPolicy: false,
    }));
    app.use(helmet.referrerPolicy({ policy: 'same-origin' })); // referrer policy header
    app.use(partialResponse()); // allows `fields` query param for JSON responses
    app.use(express.static(config.views.publicDir)); // specifies public directory

    // Add STS header (redirects HTTP to HTTPS)
    app.use((req, res, next) => {
      if (req.headers.host === process.env.VHOST) {
        res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
      }
      next();
    });

    // Initialize sessions
    console.log(`(5/${STEPS_TO_LOAD}) Initializing sessions`);
    app.use(sessions);

    // Load API router
    console.log(`(6/${STEPS_TO_LOAD}) Loading API router`);
    app.use('/api', await apiRouter());

    // Load BaseRouter and CSRF protection. We must load CSRF protection after we load the API router
    // because the API does not necessarily use CSRF protection (only for same-site AJAX requests).
    console.log(`(7/${STEPS_TO_LOAD}) Loading application router`);
    app.use(csrf(config.csrfConfig.standard));
    app.use('/', await baseRouter());

    //#region Global Error Handlers
    console.log(`(8/${STEPS_TO_LOAD}) Adding global error handlers`);
    exitHook.uncaughtExceptionHandler(err => {
      console.error(err);
    });
    exitHook.unhandledRejectionHandler(err => {
      console.error(err);
    });

    app.use(function(err, req: Request, res: Response, next: NextFunction) {
      if (res.headersSent) {
        return next(err);
      }

      if (err.code === 'EBADCSRFTOKEN') {
        return res.status(403).sendFile(`${config.views.root}/errorPages/csrfTokenDenied.html`);
      }

      console.error(err);

      return res.status(404).sendFile(`${config.views.root}/errorPages/500.html`);
    });

    app.get('*', function(req: Request, res: Response) {
      // 404-Handler: this must always be last.
      res.status(404).render('errorPages/404');
    });
    //#endregion

    console.log(`(9/${STEPS_TO_LOAD}) Application code fully loaded`);
    return app;
  },
};