import { Router } from 'express';
import BasicResources from './BasicResources.ts';
import CharacterResources from './CharacterResources.ts';
import MediaResources from './MediaResources.ts';

export default function(router: Router): void {
  router.use('/hsr', MediaResources);
  router.use('/hsr', CharacterResources);
  router.use('/hsr', CharacterResources);
}
