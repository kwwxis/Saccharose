import { Router } from 'express';
import BasicResources from './BasicResources.ts';
import ZenlessDialogueResources from './ZenlessDialogueResources.ts';

export default function(router: Router): void {
  router.use('/zenless', BasicResources);
  router.use('/zenless', ZenlessDialogueResources);
}
