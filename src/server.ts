import './setup';
import sslcreds from '@/sslcreds';
import express from 'express';
import spdy from 'spdy';
import vhost from 'vhost';
import appctl from '@/app';
import {toBoolean} from '@functions';

// You shouldn't need to change anything in this file.
// Application init code should go in `@/app.js`, not here.

(async () => {
  console.log(`Booting server; in ${process.env.NODE_ENV} mode ...`);
  const app = await appctl.init();

  app.listen(parseInt(process.env.HTTP_PORT), () => {
    console.log(`HTTP/2 Server running on port ${process.env.HTTP_PORT}`);
  });

  let httpsApp = app;
  let httpsPort: number = parseInt(process.env.HTTPS_PORT);

  if (process.env.VHOSTED) {
    httpsApp = express();
    httpsApp.use(vhost(process.env.VHOST, app));
    httpsPort = 443; // override
  }

  if (toBoolean(process.env.SSL_ENABLED)) {
    spdy.createServer(sslcreds, httpsApp).listen(httpsPort, () => {
      console.log(`HTTPS/2 Server running on port ${httpsPort}`
        + (process.env.VHOSTED ? ' (in VHOSTED mode)' : ''));

        if (process.env.VHOSTED) {
          console.log('Node app is running at https://' + process.env.VHOST);
        }
    });
  } else {
    console.log('Not starting HTTPS server: not enabled');
  }
})();
