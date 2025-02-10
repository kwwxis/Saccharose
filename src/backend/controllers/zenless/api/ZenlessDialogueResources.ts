import { create } from '../../../routing/router.ts';
import { getZenlessControl } from '../../../domain/zenless/zenlessControl.ts';
import { Request, Response, Router } from 'express';
import { DialogueSectionResult } from '../../../util/dialogueSectionResult.ts';
import { removeCyclicRefs, toBoolean } from '../../../../shared/util/genericUtil.ts';
import { ApiCyclicValueReplacer } from '../../../middleware/api/apiCyclicValueReplacer.ts';

const router: Router = create();

// router.endpoint('/dialogue/single-branch-generate', {
//   get: async (req: Request, res: Response) => {
//     const ctrl = getZenlessControl(req);
//     const query = (req.query.text as string)?.trim();
//
//     // let result: DialogueSectionResult[] = await dialogueGenerate(ctrl, { query });
//
//     if (req.headers.accept && req.headers.accept.toLowerCase() === 'text/html') {
//       // return res.render('partials/genshin/dialogue/single-branch-dialogue-generate-result', {
//       //   sections: result,
//       //   query,
//       //   ... await questStillsHelper(ctrl),
//       //   ... await inDialogueReadablesHelper(ctrl),
//       //   langSuggest: result.length ? null : ctrl.langSuggest(query)
//       // });
//     } else {
//       return removeCyclicRefs(result, ApiCyclicValueReplacer);
//     }
//   }
// });


export default router;
