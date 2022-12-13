import { NextFunction, Request, Response } from '../util/router';
import config from '../config';
import { APIError } from '../controllers/api/error';

export async function pageLoadApiHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('\x1b[4m\x1b[1mInternal Error (Page Load):\x1b[0m\n', err);

  if (res.headersSent) {
    return next(err);
  }

  do {
    try {
      await res.status(404).render('errorPages/500', null, null, true);
      return;
    } catch (e) {
      req.context.popViewStack();
      req.context.popViewStack();
    }
  } while (req.context.canPopViewStack());

  // Depending on what causes the error, attempting to render 'errorPages/500.ejs' might cause an error too.
  // In that case then just send an HTML file as the safe option.
  res.status(500).sendFile(`${config.views.root}/errorPages/500.html`);
}

export async function apiErrorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const sendBadRequest = (error_code, error_description) =>
    res.status(400).json({
      error: 'BAD_REQUEST',
      error_code,
      error_description,
    });

  if (typeof err === 'string') {
    return sendBadRequest(undefined, err);
  } else if (err instanceof APIError) {
    return sendBadRequest(err.code, err.message);
  } else if (err && typeof err === 'object' && err.code === 'EBADCSRFTOKEN') {
    return sendBadRequest(err.code, err.message);
  } else {
    console.error('\x1b[4m\x1b[1mInternal Error (API):\x1b[0m\n', err);

    // For any other error types, assume internal server error
    // Don't include any details about the error in the JSON response in case it reveals
    // details about the code.

    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      error_description: 'An internal server error occurred. Try again later.'
    });
  }
}