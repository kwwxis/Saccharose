import { create, Router } from '../../../util/router';
import BasicRouter from './BasicRouter';
import DialogueRouter from './DialogueRouter';
import ItemRouter from './ArchiveRouter';
import CharacterRouter from './CharacterRouter';
import TcgRouter from './TcgRouter';
import MediaRouter from './MediaRouter';

export default async function(): Promise<Router> {
  const router: Router = create();

  router.use('/', await BasicRouter());
  router.use('/', await DialogueRouter());
  router.use('/', await ItemRouter());
  router.use('/', await CharacterRouter());
  router.use('/', await TcgRouter());
  router.use('/', await MediaRouter());

  return router;
}