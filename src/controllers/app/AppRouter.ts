import { create, Router } from '@router';

export default async function(): Promise<Router> {
  const router: Router = create({
    layouts: ['layouts/app-layout'],
    bodyClass: ['in-app'],
    styles: ['app.default'],
  });

  return router;
}