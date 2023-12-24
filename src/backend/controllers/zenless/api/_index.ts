import BasicResources from './BasicResources.ts';
import { Router } from 'express';

export default function(router: Router): void {
  router.use('/zenless', BasicResources);
}