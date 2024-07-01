import { create } from '../../../routing/router.ts';
import { Request, Response, Router } from 'express';
import { toInt } from '../../../../shared/util/numberUtil.ts';
import { getWuwaControl } from '../../../domain/wuwa/wuwaControl.ts';
import { fetchFavorWordsByRoleId } from '../../../domain/wuwa/character/fetchRoleFavorWords.ts';

const router: Router = create();

router.endpoint('/role/favor-words', {
  get: async (req: Request, res: Response) => {
    const ctrl = getWuwaControl(req);
    const roleId = toInt(req.query.roleId);
    return await fetchFavorWordsByRoleId(ctrl, roleId);
  }
});

export default router;
