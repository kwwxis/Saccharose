import { create, Request, Response, Router } from '../../../util/router';
import { getGenshinControl } from '../../../domain/genshin/genshinControl';
import { toInt } from '../../../../shared/util/numberUtil';
import { fetchCharacterFettersByAvatarId } from '../../../domain/genshin/character/fetchCharacterFetters';

const router: Router = create();

router.restful('/character/fetters', {
  get: async (req: Request, res: Response) => {
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
