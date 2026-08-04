import { toBoolean } from '../../shared/util/genericUtil';
import { Request } from 'express';
import { iconSvg } from '../../shared/util/iconProvider.ts';
import { escapeHtml } from '../../shared/util/stringUtil.ts';
import fastJson from 'fast-json-stringify';

export const fastStringifyLangCodesToName = fastJson({
  type: 'object',
  properties: {
    CH: { type: 'string' },
    CHS: { type: 'string' },
    CHT: { type: 'string' },
    DE: { type: 'string' },
    EN: { type: 'string' },
    ES: { type: 'string' },
    FR: { type: 'string' },
    ID: { type: 'string' },
    IT: { type: 'string' },
    JP: { type: 'string' },
    KR: { type: 'string' },
    PT: { type: 'string' },
    RU: { type: 'string' },
    TH: { type: 'string' },
    TR: { type: 'string' },
    VI: { type: 'string' }
  }
})

export function renderBaseLayoutTemplate(req: Request,
                                         ssrHtmlOutlet: string,
                                         viewStack: string[],
                                         csrfToken: string): string {
  const ctx = req.context;

  return `<!DOCTYPE html>
<html lang="en" class="${ ctx.prefBool('isNightmode', 'nightmode', '') }">
  <head>
    <meta charset="utf-8" />
    <title>${ ctx.getFormattedPageTitle() }</title>
    <meta name="robots" content="noindex, nofollow" />
    <meta name="csrf-token" content="${ escapeHtml(csrfToken || '') }" />
    <meta name="view-stack" content="${ viewStack.join(',') }" />
    <meta name="user-prefs" content="${ escapeHtml(JSON.stringify(ctx.prefs)) }" />
    <meta name="is-authenticated" content="${ ctx.isAuthenticated() ? 'true' : 'false' }" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="langCodes" content="${ escapeHtml(fastStringifyLangCodesToName(ctx.languages)) }" />
    ${Object.entries(ctx.getHtmlMetaProps()).map(
      ([propName, propValue]) => `<meta name="${propName}" content="${propValue}" />`).join('\n    ')
    }
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
    <link rel="manifest" href="/site.webmanifest">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600&family=Source+Sans+Pro:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400;1,600;1,700&display=swap" rel="stylesheet">
    ${ ENV.NODE_ENV === 'development' ? `<script async src="${ toBoolean(ENV.SSL_ENABLED) ? 'https' : 'http' }://${ ENV.WEB_DOMAIN }:35729/livereload.js"></script>` : '' }
    <link rel="stylesheet" href="${ ctx.webpackBundles.cssBundle }">
    <link rel="stylesheet" href="${ ctx.webpackBundles.vueCssBundle }">
  </head>
  <body class="${ ctx.bodyClassString } ${ ctx.prefBool('isNightmode', 'nightmode', '') } ${ ctx.siteModeCssClass }">
    ${ ssrHtmlOutlet }
    <script src="${ ctx.webpackBundles.jsBundle }"></script>
  </body>
</html>
`;
}
