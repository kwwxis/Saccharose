import { NextFunction, Request, Response } from '../util/router';
import config from '../config';

export default async function(err: any, req: Request, res: Response, next: NextFunction) {
  console.error(err);

  if (res.headersSent) {
    return next(err);
  }

  if (err && typeof err === 'object' && err.code === 'EBADCSRFTOKEN') {
    return res.status(403).sendFile(`${config.views.root}/errorPages/csrfTokenDenied.html`);
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