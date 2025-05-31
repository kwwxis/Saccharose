import './loadenv.ts';
import sslcreds from './sslcreds.ts';
import express from 'express';
import spdy from 'spdy';
import vhost from 'vhost';
import { appInit } from './app.ts';
import { toBoolean } from '../shared/util/genericUtil.ts';
import { toInt } from '../shared/util/numberUtil.ts';
import { logInit, logShutdown } from './util/logger.ts';
import exitHook from 'async-exit-hook';
import { startWss } from './wsserver.ts';

// You shouldn't need to change anything in this file.
// Application init code should go in `app.ts`, not here.

(async () => {
  logInit(`Booting server; NodeJS ${process.version}, in ${process.env.NODE_ENV} mode ...`);
  const app = await appInit();

  let httpPort: number = toInt(process.env.HTTP_PORT);
  let httpsPort: number = toInt(process.env.HTTPS_PORT);
  let vhosted: boolean = toBoolean(process.env.VHOSTED);

  if (vhosted) {
    httpPort = 80;
    httpsPort = 443;
  }

  app.listen(httpPort, () => {
    if (vhosted) {
      logInit(`HTTP/2 Server is running at http://${process.env.WEB_DOMAIN}`);
    } else {
      logInit(`HTTP/2 Server is running at http://localhost:${process.env.HTTP_PORT}`);
    }
  });

  let httpsApp = app;

  if (vhosted) {
    httpsApp = express();
    httpsApp.use(vhost(process.env.VHOST, app));
  }

  if (toBoolean(process.env.SSL_ENABLED)) {
    const server = spdy.createServer(sslcreds, httpsApp).listen(httpsPort, () => {
      if (vhosted) {
        logInit(`HTTPS/2 Server is running at https://${process.env.WEB_DOMAIN}`);
      } else {
        logInit(`HTTPS/2 Server is running at https://localhost:${httpsPort}`);
      }
    });
    exitHook((callback) => {
      logShutdown('Shutting down HTTPS/2 server...');
      server.close(() => callback());
    });
  } else {
    logInit('Not starting HTTPS/2 server -- not enabled');
  }

  startWss();
})();
