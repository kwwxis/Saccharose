import { create } from '../../../routing/router.ts';
import { Request, Response, Router } from 'express';
import { toInt } from '../../../../shared/util/numberUtil.ts';

const router: Router = create();

router.endpoint('/role/voice-atlas', {
  get: async (req: Request, res: Response) => {
    // const ctrl = getStarRailControl(req);
    // const avatarId = toInt(req.query.roleId);
    // return await fetchVoiceAtlasByAvatarId(ctrl, avatarId);
  }
});

export default router;
