import BasicResources from './BasicResources';
import { Router } from 'express';
import CharacterResources from './CharacterResources';

export default function(router: Router): void {
  router.use('/hsr', BasicResources);
  router.use('/hsr', CharacterResources);
}