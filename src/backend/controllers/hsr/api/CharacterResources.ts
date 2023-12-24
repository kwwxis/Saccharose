import { create } from '../../../routing/router.ts';
import { Request, Response, Router } from 'express';
import { toInt } from '../../../../shared/util/numberUtil.ts';
import { getStarRailControl } from '../../../domain/hsr/starRailControl.ts';
import { fetchVoiceAtlasByAvatarId } from '../../../domain/hsr/character/fetchVoiceAtlas.ts';

const router: Router = create();

router.endpoint('/character/voice-atlas', {
  get: async (req: Request, res: Response) => {
    const ctrl = getStarRailControl(req);
    const avatarId = toInt(req.query.avatarId);
    return await fetchVoiceAtlasByAvatarId(ctrl, avatarId);
  }
});

export default router;
