import { create, Request, Response, Router } from '../../util/router';
import { getControl } from '../../scripts/script_util';
import { toInt } from '../../../shared/util/numberUtil';
import { fetchCharacterFettersByAvatarId } from '../../scripts/fetters/fetchCharacterFetters';

const router: Router = create();

router.restful('/character/fetters', {
  get: async (req: Request, res: Response) => {
    const ctrl = getControl(req);
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
