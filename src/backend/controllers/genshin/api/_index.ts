import { create, Router } from '../../../util/router';
import BasicResources from './BasicResources';
import DialogueResources from './DialogueResources';
import ItemResources from './ArchiveResources';
import CharacterResources from './CharacterResources';

export default async function(): Promise<Router> {
  const router: Router = create();

  router.use('/', BasicResources);
  router.use('/', DialogueResources);
  router.use('/', ItemResources);
  router.use('/', CharacterResources);

  return router;
}