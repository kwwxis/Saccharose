import bodyParser from 'body-parser';
import { create, Router, Request, Response } from '../util/router';
import { apiErrorHandler } from '../middleware/globalErrorHandler';
import { CyclicValueReplacer } from '../../shared/util/genericUtil';
import BasicResources from './api/BasicResources';
import CharacterResources from './api/CharacterResources';
import DialogueResources from './api/DialogueResources';
import apiAccessControlHeaders from '../middleware/apiAccessControlHeaders';
import apiAuth from '../middleware/apiAuth';

export const ApiCyclicValueReplacer: CyclicValueReplacer = (k: string, v: any) => {
  if (typeof v === 'object' && v.Id) {
    return {
      __cyclicKey: k,
      __cyclicRef: v.Id
    };
  } else {
    return;
  }
}

export default async function(): Promise<Router> {
  const router: Router = create({ layouts: ['layouts/empty-layout'] });

  // API Middleware
  // ~~~~~~~~~~~~~~
  router.use(bodyParser.json());
  router.use(apiAccessControlHeaders);
  router.use(apiAuth);

  // Add API Resources
  // ~~~~~~~~~~~~~~~~~
  router.use('/', BasicResources);
  router.use('/', DialogueResources);
  router.use('/', CharacterResources);

  // Client Error Handlers
  // ~~~~~~~~~~~~~~~~~~~~~
  router.route('*').all((req: Request, res: Response) => res.status(404).send());
  router.use(apiErrorHandler);

  return router;
}