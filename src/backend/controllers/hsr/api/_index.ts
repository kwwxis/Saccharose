import BasicResources from './BasicResources.ts';
import { Router } from 'express';
import CharacterResources from './CharacterResources.ts';
export default function(router: Router): void {
  router.use('/hsr', BasicResources);
  router.use('/hsr', CharacterResources);
}