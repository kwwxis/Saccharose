import { create } from '../../../routing/router';
import { Request, Response, Router } from 'express';
import { toInt } from '../../../../shared/util/numberUtil';
import { getStarRailControl } from '../../../domain/hsr/starRailControl';
import { fetchVoiceAtlasByAvatarId } from '../../../domain/hsr/character/fetchVoiceAtlas';

const router: Router = create();

router.endpoint('/character/voice-atlas', {
  get: async (req: Request, res: Response) => {
    const ctrl = getStarRailControl(req);
    const avatarId = toInt(req.query.avatarId);
    return await fetchVoiceAtlasByAvatarId(ctrl, avatarId);
  }
});

export default router;
