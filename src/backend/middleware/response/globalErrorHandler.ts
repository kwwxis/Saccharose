import { HttpError } from '../../../shared/util/httpError.ts';
import { NextFunction, Request, Response } from 'express';
import { clearCsrfCookie } from '../request/csrf.ts';
import { ShellTimeoutError } from '../../util/shellutil.ts';
import InternalServerErrorCard from '../../components/errors/InternalServerErrorCard.vue';

export async function pageLoadErrorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  if (err && typeof err === 'object' && (err.code === 'EBADCSRFTOKEN' || err.type === 'EBADCSRFTOKEN')) {
    clearCsrfCookie(res);
    let didRefresh = req.context.cookie('EBADCSRFTOKEN.DID_REFRESH');
    if (didRefresh) {
      res.status(400).send(ERROR_PAGES.CSRF_TOKEN_DENIED);
    } else {
      res.cookie('EBADCSRFTOKEN.DID_REFRESH', '1', {
        maxAge: 1000 * 60,
        httpOnly: true,
      });
      res.redirect(req.url);
    }
    return;
  }

  console.error('\x1b[4m\x1b[1mInternal Error (Page Load):\x1b[0m\n', err);

  if (res.headersSent) {
    return next(err);
  }

  try {
    await res.status(500).renderComponent(InternalServerErrorCard, {
      throwOnError: true
    });
    return;
  } catch (ignore) {
    try {
      await res.status(500).renderComponent(InternalServerErrorCard, {
        throwOnError: true,
        layoutType: 'basic'
      });
      return;
    } catch (ignore) {}
  }

  // Depending on what caused the error, attempting to render 'InternalServerErrorCard' might cause an error too.
  // In that case then just send an HTML file as the safe option.
  res.status(500).send(ERROR_PAGES.INTERNAL_SERVER_ERROR);
}

export async function apiErrorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  if (res.headersSent) {
    return next(err);
  }

  if (typeof err === 'string') {
    sendHttpError(HttpError.badRequest(null, err), res);
  } else if (err && typeof err === 'object' && (err.code === 'EBADCSRFTOKEN' || err.type === 'EBADCSRFTOKEN')) {
    sendHttpError(HttpError.unauthenticated('EBADCSRFTOKEN', err), res);
  } else if (err instanceof HttpError) {
    sendHttpError(err, res);
  } else if (err instanceof SyntaxError && err.message && err.message.includes('regular expression')) {
    sendHttpError(HttpError.badRequest(null, err.message), res);
  } else if (err instanceof ShellTimeoutError) {
    sendHttpError(HttpError.badRequest('ETIMEDOUT', err.message), res);
  } else {
    console.error('\x1b[4m\x1b[1mInternal Error (API):\x1b[0m\n', err);
    sendHttpError(HttpError.internalServerError('InternalError', 'An internal server error occurred. Try again later.'), res);
  }
}

function sendHttpError(err: HttpError, res: Response): Response {
  res.status(err.status).json(err.toJson());
  return res;
}

const ERROR_PAGES = {
  CSRF_TOKEN_DENIED: `
  <!DOCTYPE html>
  <html lang='en'>
  <body>
    <div style="
      width: 500px;
      margin: 40px auto;
      font-family: sans-serif;
      ">
      <h1>403</h1>
      <h2>Session expired?</h2>
      <hr>
      <p style="
        font-size: 16px;
        line-height: 22px;">
        Invalid CSRF token. This error might happen if your session expired.
        Try clicking the back button in your browser or refreshing the page.
      </p>
    </div>
  </body>
  </html>
  `,
  INTERNAL_SERVER_ERROR: `
  <!DOCTYPE html>
  <html lang='en'>
  <body>
    <div style="
      width: 500px;
      margin: 40px auto;
      font-family: sans-serif;
      ">
      <h1>500</h1>
      <h2>Internal Server Error</h2>
      <hr>
      <p style="
        font-size: 16px;
        line-height: 22px;">
        Sorry, an internal server error has occurred. Try again later.<br>
        If this keeps happening, then please let kwwxis know.
      </p>
    </div>
  </body>
  </html>
  `,
}
