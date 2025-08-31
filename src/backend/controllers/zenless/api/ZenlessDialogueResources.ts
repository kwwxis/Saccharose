import { create } from '../../../routing/router.ts';
import { getZenlessControl } from '../../../domain/zenless/zenlessControl.ts';
import { Request, Response, Router } from 'express';
import { DialogueSectionResult } from '../../../util/dialogueSectionResult.ts';
import { removeCyclicRefs } from '../../../../shared/util/genericUtil.ts';
import { ApiCyclicValueReplacer } from '../../../middleware/api/apiCyclicValueReplacer.ts';
import { dialogueGenerate } from '../../../domain/zenless/dialogue/z3StorySections.ts';
import ZenlessDialogueGenerationResult from '../../../components/zenless/ZenlessDialogueGenerationResult.vue';

const router: Router = create();

router.endpoint('/dialogue-generation', {
  get: async (req: Request, res: Response) => {
    const ctrl = getZenlessControl(req);
    const query = (req.query.text as string)?.trim();

    let result: DialogueSectionResult[] = await dialogueGenerate(ctrl, { query });

    if (req.headers.accept && req.headers.accept.toLowerCase() === 'text/html') {
      await res.renderComponent(ZenlessDialogueGenerationResult, {
        sections: result,
        query,
        langSuggest: result.length ? null : await ctrl.langSuggest(query)
      });
    } else {
      return removeCyclicRefs(result, ApiCyclicValueReplacer);
    }
  }
});

export default router;
