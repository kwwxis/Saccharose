import { Request, Response, Router } from 'express';
import { langDetect } from '../../../util/shellutil.ts';

export default function(router: Router): void {
  router.endpoint('/lang-detect', {
    get: async (req: Request, res: Response) => {
      return res.json(await langDetect(String(req.query.text)));
    }
  });
}
