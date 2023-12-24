import BasicResources from './BasicResources.ts';
import DialogueResources from './DialogueResources.ts';
import ItemResources from './ArchiveResources.ts';
import CharacterResources from './CharacterResources.ts';
import MediaResources from './MediaResources.ts';
import { Router } from 'express';

export default function(router: Router): void {
  router.use('/genshin', BasicResources);
  router.use('/genshin', DialogueResources);
  router.use('/genshin', ItemResources);
  router.use('/genshin', CharacterResources);
  router.use('/genshin', MediaResources);
}