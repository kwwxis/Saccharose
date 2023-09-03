import BasicResources from './BasicResources';
import DialogueResources from './DialogueResources';
import ItemResources from './ArchiveResources';
import CharacterResources from './CharacterResources';
import MediaResources from './MediaResources';
import { Router } from 'express';

export default function(router: Router): void {
  router.use('/genshin', BasicResources);
  router.use('/genshin', DialogueResources);
  router.use('/genshin', ItemResources);
  router.use('/genshin', CharacterResources);
  router.use('/genshin', MediaResources);
}