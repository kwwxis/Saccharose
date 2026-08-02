import { toBoolean } from '../../shared/util/genericUtil';
import { Request } from 'express';
import { icon, translateIcon } from './viewIconHelpers';
import { escapeHtml } from '../../shared/util/stringUtil.ts';

export function renderIndex(req: Request,
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
    <meta name="view-stack" content="${ escapeHtml(viewStack.join(',')) }" />
    <meta name="user-prefs" content="${ escapeHtml(JSON.stringify(ctx.prefs)) }" />
    <meta name="is-authenticated" content="${ ctx.isAuthenticated() ? 'true' : 'false' }" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="langCodes" content="${ escapeHtml(JSON.stringify(ctx.languages)) }" />
    ${Object.entries(ctx.htmlMetaProps).map(
      ([propName, propValue]) => `<meta name="${ escapeHtml(propName) }" content="${ escapeHtml(propValue) }" />`).join('\n    ')
    }
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
    <link rel="manifest" href="/site.webmanifest">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600&family=Source+Sans+Pro:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400;1,600;1,700&display=swap" rel="stylesheet">
    <template id="template-info-icon">${ icon('info') }</template>
    <template id="template-alert-icon">${ icon('alert-triangle') }</template>
    <template id="template-chevron-down-icon">${ icon('chevron-down') }</template>
    <template id="template-chevron-right-icon">${ icon('chevron-right') }</template>
    <template id="template-search-icon">${ icon('search') }</template>
    <template id="template-copy-icon">${ icon('copy') }</template>
    <template id="template-external-link-icon">${ icon('external-link') }</template>
    <template id="template-maximize-icon">${ icon('maximize-2') }</template>
    <template id="template-minimize-icon">${ icon('minimize-2') }</template>
    <template id="template-translate-icon">${ translateIcon() }</template>
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
