import { create } from '../../../rendering/customRouter.ts';
import { getGenshinControl } from '../../../domain/genshin/genshinControl.ts';
import { toInt } from '../../../../shared/util/numberUtil.ts';
import { fetchCharacterFettersByAvatarId } from '../../../domain/genshin/character/fetchCharacterFetters.ts';
import { Request, Response, Router } from 'express';

const router: Router = create();

router.endpoint('/character/fetters', {
  get: async (req: Request, _res: Response) => {
    const ctrl = getGenshinControl(req);
    const avatarId = toInt(req.query.avatarId);
    return await fetchCharacterFettersByAvatarId(ctrl, avatarId);
  }
});

export default router;
