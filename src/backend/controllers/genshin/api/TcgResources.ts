import { create } from '../../../routing/router.ts';
import { Request, Response, Router } from 'express';
import { getGenshinControl } from '../../../domain/genshin/genshinControl.ts';
import { removeCyclicRefs } from '../../../../shared/util/genericUtil.ts';
import { ApiCyclicValueReplacer } from '../../../middleware/api/apiCyclicValueReplacer.ts';
import { getGCGControl } from '../../../domain/genshin/gcg/gcg_control.ts';
import GcgStageSearchResults from '../../../components/genshin/gcg/GcgStageSearchResults.vue';

const router: Router = create();

router.endpoint('/gcg/stage-search', {
  get: async (req: Request, res: Response) => {
    const ctrl = getGenshinControl(req);
    const gcg = getGCGControl(ctrl);

    const query = (req.query.text as string)?.trim();

    const stages = await gcg.searchStages(query, ctrl.searchModeFlags);

    if (req.headers.accept && req.headers.accept.toLowerCase() === 'text/html') {
      return res.renderComponent(GcgStageSearchResults, {
        stages
      });
    } else {
      return removeCyclicRefs(stages, ApiCyclicValueReplacer);
    }
  }
});

export default router;
