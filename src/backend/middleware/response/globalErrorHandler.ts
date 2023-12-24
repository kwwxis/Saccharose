import { VIEWS_ROOT } from '../../loadenv.ts';
import { HttpError } from '../../../shared/util/httpError.ts';
import { NextFunction, Request, Response } from 'express';

export async function pageLoadErrorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  if (err && typeof err === 'object' && (err.code === 'EBADCSRFTOKEN' || err.type === 'EBADCSRFTOKEN')) {
    res.status(400).sendFile(`${VIEWS_ROOT}/errors/csrfTokenDenied.html`);
    return;
  }

  console.error('\x1b[4m\x1b[1mInternal Error (Page Load):\x1b[0m\n', err);

  if (res.headersSent) {
    return next(err);
  }

  do {
    try {
      res.status(500).render('errors/500', {
        throwOnError: true
      });
      return;
    } catch (e) {
      req.context.popViewStack();
      req.context.popViewStack();
    }
  } while (req.context.canPopViewStack());

  // Depending on what causes the error, attempting to render 'errors/500.ejs' might cause an error too.
  // In that case then just send an HTML file as the safe option.
  res.status(500).sendFile(`${VIEWS_ROOT}/errors/500.html`);
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
  } else {
    console.error('\x1b[4m\x1b[1mInternal Error (API):\x1b[0m\n', err);
    sendHttpError(HttpError.internalServerError('InternalError', 'An internal server error occurred. Try again later.'), res);
  }
}

function sendHttpError(err: HttpError, res: Response): Response {
  res.status(err.status).json(err.toJson());
  return res;
}