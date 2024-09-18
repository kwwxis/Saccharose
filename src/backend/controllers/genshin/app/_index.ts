import { create } from '../../../routing/router.ts';
import { Router } from 'express';
import BasicRouter from './GenshinBasicRouter.ts';
import DialogueRouter from './GenshinDialogueRouter.ts';
import ItemRouter from './GenshinArchiveRouter.ts';
import CharacterRouter from './GenshinCharacterRouter.ts';
import TcgRouter from './TcgRouter.ts';
import MediaRouter from './GenshinMediaRouter.ts';
import ChangelogRouter from './GenshinChangelogRouter.ts';

export default async function(): Promise<Router> {
  const router: Router = create();

  router.use('/', await BasicRouter());
  router.use('/', await DialogueRouter());
  router.use('/', await ItemRouter());
  router.use('/', await CharacterRouter());
  router.use('/', await TcgRouter());
  router.use('/', await MediaRouter());
  router.use('/', await ChangelogRouter());

  return router;
}
