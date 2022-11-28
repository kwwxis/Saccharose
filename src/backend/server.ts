import './loadenv';
import sslcreds from './sslcreds';
import express from 'express';
import spdy from 'spdy';
import vhost from 'vhost';
import { appInit } from './app';
import { toBoolean } from '../shared/util/genericUtil';
import { toInt } from '../shared/util/numberUtil';

// You shouldn't need to change anything in this file.
// Application init code should go in `app.ts`, not here.

(async () => {
  console.log(`[Init] Booting server; in ${process.env.NODE_ENV} mode ...`);
  const app = await appInit();

  app.listen(toInt(process.env.HTTP_PORT), () => {
    if (process.env.HTTP_PORT === '80') {
      console.log(`[Init] HTTP/2 Server is running at http://` + process.env.VHOST);
    } else {
      console.log(`[Init] HTTP/2 Server is running at http://` + process.env.VHOST + ':' + process.env.HTTP_PORT);
    }
  });

  let httpsApp = app;
  let httpsPort: number = toInt(process.env.HTTPS_PORT);

  if (toBoolean(process.env.VHOSTED)) {
    httpsApp = express();
    httpsApp.use(vhost(process.env.VHOST, app));
    httpsPort = 443; // override
  }

  if (toBoolean(process.env.SSL_ENABLED)) {
    spdy.createServer(sslcreds, httpsApp).listen(httpsPort, () => {
        if (toBoolean(process.env.VHOSTED)) {
          console.log('[Init] HTTPS/2 Server is running at https://' + process.env.VHOST);
        } else {
          console.log('[Init] HTTPS/2 Server is running at https://' + process.env.VHOST + ':' + httpsPort);
        }
    });
  } else {
    console.log('[Init] Not starting HTTPS/2 server -- not enabled');
  }
})();
