import { create } from '../../../routing/router';
import { getGenshinControl } from '../../../domain/genshin/genshinControl';
import { toInt } from '../../../../shared/util/numberUtil';
import { fetchCharacterFettersByAvatarId } from '../../../domain/genshin/character/fetchCharacterFetters';
import { Request, Response, Router } from 'express';

const router: Router = create();

router.endpoint('/character/fetters', {
  get: async (req: Request, _res: Response) => {
    const ctrl = getGenshinControl(req);
    const avatarId = toInt(req.query.avatarId);

    let fetters = await fetchCharacterFettersByAvatarId(ctrl, avatarId);

    if (fetters) {
      fetters = JSON.parse(JSON.stringify(fetters));
      delete fetters.avatar;
      for (let fetter of fetters.combatFetters) {
        delete fetter.Avatar;
      }
      for (let fetter of fetters.storyFetters) {
        delete fetter.Avatar;
      }
    }

    return fetters;
  }
});

export default router;
