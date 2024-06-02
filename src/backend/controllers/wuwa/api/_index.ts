import { Router } from 'express';
import BasicResources from './BasicResources.ts';
import MediaResources from './MediaResources.ts';

export default function(router: Router): void {
  router.use('/wuwa', BasicResources);
  router.use('/wuwa', MediaResources);
}
