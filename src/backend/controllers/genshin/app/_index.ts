import { create } from '../../../routing/router';
import BasicRouter from './GenshinBasicRouter';
import DialogueRouter from './GenshinDialogueRouter';
import ItemRouter from './GenshinArchiveRouter';
import CharacterRouter from './GenshinCharacterRouter';
import TcgRouter from './TcgRouter';
import MediaRouter from './GenshinMediaRouter';
import { Router } from 'express';
import GenshinReactRouter from './GenshinReactRouter';

export default async function(): Promise<Router> {
  const router: Router = create();

  router.use('/', await BasicRouter());
  router.use('/', await DialogueRouter());
  router.use('/', await ItemRouter());
  router.use('/', await CharacterRouter());
  router.use('/', await TcgRouter());
  router.use('/', await MediaRouter());
  router.use('/', await GenshinReactRouter());

  return router;
}