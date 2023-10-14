import { Request, Response, Router } from 'express';
import React from 'react';
import Page from '../../../components/page.component';
import { create } from '../../../routing/router';

export default async function(): Promise<Router> {
  const router: Router = create();

  router.get('/react-test', async (req: Request, res: Response) => {
    res.render(<Page content="hello world!" />);
  });

  return router;
}