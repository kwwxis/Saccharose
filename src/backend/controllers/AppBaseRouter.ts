import helmet from 'helmet';
import { create, Router, Request, Response, NextFunction } from '../util/router';
import { toBoolean } from '../../shared/util/genericUtil';
import { getControl, normText } from '../scripts/script_util';
import BasicRouter from './app/BasicRouter';
import DialogueRouter from './app/DialogueRouter';
import ItemRouter from './app/ItemRouter';
import CharacterRouter from './app/CharacterRouter';
import TcgRouter from './app/TcgRouter';
import MiscRouter from './app/MiscRouter';

export default async function(): Promise<Router> {
  const router: Router = create({
    layouts: ['layouts/base-layout', 'layouts/app-layout'],
    locals: async (req: Request) => {
      const ctrl = getControl(req);
      return {
        normText: (s: string) => normText(s, ctrl.outputLangCode),
        outputLangCode: ctrl.outputLangCode,
        inputLangCode: ctrl.inputLangCode,
        csrfToken: req.csrfToken(),
      };
    }
  });

  router.use((req: Request, res: Response, next: NextFunction) => {
    const cspOptions: any = {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'", 'cdnjs.cloudflare.com', 'unpkg.com', 'fonts.googleapis.com', 'fonts.gstatic.com', `${process.env.VHOST}:*`],
        prefetchSrc: ["'self'", 'cdnjs.cloudflare.com', 'unpkg.com', 'fonts.googleapis.com', 'fonts.gstatic.com', `${process.env.VHOST}:*`],
        styleSrc: ["'self'", "'unsafe-inline'", 'cdnjs.cloudflare.com', 'unpkg.com', 'fonts.googleapis.com', 'fonts.gstatic.com'],
        scriptSrc: ["'self'", "'unsafe-eval'", 'cdnjs.cloudflare.com', 'unpkg.com', `'nonce-${req.context.nonce}'`, `${process.env.VHOST}:*`],
        fontSrc: ["'self'", 'fonts.googleapis.com', 'fonts.gstatic.com'],
        connectSrc: ["'self'", `wss://${process.env.VHOST}:*`],
      },
      reportOnly: false,
    };

    if (toBoolean(process.env.SSL_ENABLED)) {
      cspOptions.directives.upgradeInsecureRequests = [];
    } else {
      cspOptions.directives.upgradeInsecureRequests = null;
    }

    helmet.contentSecurityPolicy(cspOptions)(req, res, next);
  });

  router.use('/', await BasicRouter());
  router.use('/', await DialogueRouter());
  router.use('/', await ItemRouter());
  router.use('/', await CharacterRouter());
  router.use('/', await TcgRouter());

  return router;
};
