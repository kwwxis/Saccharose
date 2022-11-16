// THIS CONFIG IS NOT FOR SECRETS
// DO NOT PUT ANY SECRETS OR PRIVATE KEYS IN THIS FILE

// The .env file should be used for secrets. You can access .env
// properties  using `process.env.PROP_NAME`

import path from 'path';
import session from 'express-session';
import { LangCode } from './util/types';

export default {
  currentGenshinVersion: '3.2',
  database: {
    filename: './genshin_data.db',
    voiceItemsFile: './voiceItemsNormalized.json',
    getTextMapFile: (langCode: LangCode): string => './TextMap/TextMap'+langCode+'.json',
    getGenshinDataFilePath(file: string): string {
      return path.resolve(process.env.GENSHIN_DATA_ROOT, file).replaceAll('\\', '/');
    }
  },
  session: session({
    secret: process.env.SESSID_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      secure: true,
    },
  }),
  csrfConfig: {
    standard: {
      cookie: {
        secure: true,
        httpOnly: true,
      },
      ignoreMethods: ['GET', 'HEAD', 'OPTIONS']
    },
    api: {
      cookie: {
        secure: true,
        httpOnly: true,
      },
      ignoreMethods: ['HEAD', 'OPTIONS']
    }
  },
  views: {
    root: path.resolve(__dirname, './views'),
    publicDir: path.resolve(__dirname, '../../public'),
    siteTitle: 'Genshin Wiki Tools',
    assetVersion: '2020-04-30-rev1',
    base: {
      layouts: ['layouts/base-layout'],
      styles: [
        'app.base',
        'app.default',
        'lib.buttons',
        'https://unpkg.com/tail.select@0.5.15/css/default/tail.select-light.min.css',
      ],
      scripts: [
        {
          src: 'https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.24.0/moment.min.js',
          async: true,
          integrity: 'sha384-fYxN7HsDOBRo1wT/NSZ0LkoNlcXvpDpFy6WzB42LxuKAX7sBwgo7vuins+E1HCaw',
          crossorigin: 'anonymous',
        },
        {
          src: 'https://unpkg.com/axios@0.19.0/dist/axios.min.js',
          async: true,
          integrity: 'sha384-6woDBwQr+eqsszpfCWmyJ2UTm+OSym/GuB2NAD8H3d+6xuEZzOMJ/6GEPDTPPCmi',
          crossorigin: 'anonymous',
        },
        {
          src: 'https://unpkg.com/popper.js@1.16.0/dist/umd/popper.min.js',
          defer: true,
          integrity: 'sha384-Q6E9RHvbIyZFJoft+2mJbHaEWldlvI9IOYy5n3zV9zzTtmI3UksdQRVvoxMfooAo',
          crossorigin: 'anonymous',
        },
        {
          src: 'https://unpkg.com/tippy.js@5.1.3/dist/tippy-bundle.iife.min.js',
          defer: true,
          integrity: 'sha384-G7kCdCHnoLRVDjaTYlKPteZ4GDCqtt+b1xZGmmO/KTnefdMjoom1ZiHT2tHS6exl',
          crossorigin: 'anonymous',
        },
        {
          src: 'https://unpkg.com/tail.select@0.5.15/js/tail.select.min.js',
          async: true,
          integrity: 'sha384-u1wigpGreBh3NGsmMCZMguURJTTJzAcybB+0TvoIsctr3NIxSdpdLvpRzGp5Yfdd',
          crossorigin: 'anonymous',
        },
        {src: 'src/widgets', async: true},
        {src: 'src/frontend-base', async: true},
      ],
      bodyClass: [],
    },
    otherScripts: {
      requirejs: {
        src: 'https://cdnjs.cloudflare.com/ajax/libs/require.js/2.3.6/require.min.js',
        async: true,
        integrity: 'sha384-38qS6ZDmuc4fn68ICZ1CTMDv4+Yrqtpijvp5fwMNdbumNGNJ7JVJHgWr2X+nJfqM',
        crossorigin: 'anonymous',
      },
    },
    ejsDelimiter: '%',
    formatPageTitle:
      (siteTitle, pageTitle) => pageTitle ? `${pageTitle} | ${siteTitle}` : siteTitle,
  },
};
