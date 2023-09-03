import './loadenv';
import sslcreds from './sslcreds';
import express from 'express';
import spdy from 'spdy';
import vhost from 'vhost';
import { appInit } from './app';
import { toBoolean } from '../shared/util/genericUtil';
import { toInt } from '../shared/util/numberUtil';
import { logInit } from './util/logger';

// You shouldn't need to change anything in this file.
// Application init code should go in `app.ts`, not here.

(async () => {
  logInit(`Booting server; in ${process.env.NODE_ENV} mode ...`);
  const app = await appInit();

  let httpPort: number = toInt(process.env.HTTP_PORT);
  let httpsPort: number = toInt(process.env.HTTPS_PORT);
  let vhosted: boolean = toBoolean(process.env.VHOSTED);

  if (vhosted) {
    httpPort = 80;
    httpsPort = 443;
  }

  app.listen(httpPort, () => {
    if (process.env.HTTP_PORT === '80') {
      logInit(`HTTP/2 Server is running at http://` + process.env.VHOST);
    } else {
      logInit(`HTTP/2 Server is running at http://` + process.env.VHOST + ':' + process.env.HTTP_PORT);
    }
  });

  let httpsApp = app;

  if (vhosted) {
    httpsApp = express();
    httpsApp.use(vhost(process.env.VHOST, app));
  }

  if (toBoolean(process.env.SSL_ENABLED)) {
    spdy.createServer(sslcreds, httpsApp).listen(httpsPort, () => {
        if (toBoolean(process.env.VHOSTED)) {
          logInit('HTTPS/2 Server is running at https://' + process.env.VHOST);
        } else {
          logInit('HTTPS/2 Server is running at https://' + process.env.VHOST + ':' + httpsPort);
        }
    });
  } else {
    logInit('Not starting HTTPS/2 server -- not enabled');
  }
})();
