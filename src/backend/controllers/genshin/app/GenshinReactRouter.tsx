import { Request, Response, Router } from 'express';
import React from 'react';
import Page from '../../../components/page.component';
import { create } from '../../../routing/router';

export default async function(): Promise<Router> {
  const router: Router = create();

  router.get('/react-test', async (req: Request, res: Response) => {
    let myContent ='Hello World!';
    res.render(<Page content="hello world!" content2={myContent} />);
  });

  return router;
}