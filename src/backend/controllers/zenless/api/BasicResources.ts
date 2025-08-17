import { create } from '../../../routing/router.ts';
import {
  handleTextMapSearchEndpoint,
} from '../../generic/handlers/handleTextMapSearch.ts';
import { getZenlessControl, ZenlessControl } from '../../../domain/zenless/zenlessControl.ts';
import { Request, Response, Router } from 'express';
import { isset, toBoolean } from '../../../../shared/util/genericUtil.ts';
import ZenlessDialogueHelperResult from '../../../components/zenless/ZenlessDialogueHelperResult.vue';
import { SbOut } from '../../../../shared/util/stringUtil.ts';
import { DialogueSectionResult } from '../../../util/dialogueSectionResult.ts';
import { DialogWikitextResult } from '../../../../shared/types/common-types.ts';
import { handleExcelUsagesEndpoint } from '../../generic/handlers/handleExcelUsagesEndpoint.ts';
import { handleOlEndpoint } from '../../generic/handlers/handleOlEndpoint.ts';
import { handleOlCombine } from '../../generic/handlers/handleOlCombine.ts';

const router: Router = create();

router.endpoint('/search-textmap', {
  get: async (req: Request, res: Response) => {
    await handleTextMapSearchEndpoint(getZenlessControl(req), req, res)
  }
});

router.endpoint('/dialogue-helper', {
  get: async (req: Request, res: Response) => {
    const ctrl: ZenlessControl = getZenlessControl(req);
    const query: string = req.query.text as string;
    const hashSearch: boolean = isset(req.query.hashSearch) && toBoolean(req.query.hashSearch);

    const section = new DialogueSectionResult('dialogue_helper', 'Result');
    section.showGutter = true;
    section.showTextMapHash = true;

    const wikitextResult: DialogWikitextResult = {
      wikitext: '',
      ids: []
    };

    const sb: SbOut = new SbOut();

    const results = await ctrl.getTextMapMatches({
      inputLangCode: ctrl.inputLangCode,
      outputLangCode: ctrl.outputLangCode,
      searchText: query,
      flags: `${ctrl.searchModeFlags}`,
      searchAgainst: hashSearch ? 'Hash' : 'Text',
      doNormText: true
    });

    const collator = new Intl.Collator(undefined, {numeric: true, sensitivity: 'base'});
    results.sort((a,b) => {
      return collator.compare(String(a.hash), String(b.hash));
    });

    for (let result of results) {
      sb.line(`:'''{{Tx|Speaker}}:''' ` + result.text);
      wikitextResult.ids.push({ textMapHash: result.hash });
    }

    wikitextResult.wikitext = sb.toString();
    section.setWikitext(wikitextResult);

    if (req.headers.accept && req.headers.accept.toLowerCase() === 'text/html') {
      return res.renderComponent(ZenlessDialogueHelperResult, {
        section
      });
    } else {
      return {
        section
      };
    }
  }
})

router.endpoint('/OL/generate', {
  get: async (req: Request, res: Response) => {
    await handleOlEndpoint(getZenlessControl(req), req, res);
  }
});

router.endpoint('/OL/combine', {
  post: async (req: Request, res: Response) => {
    return await handleOlCombine(getZenlessControl(req), req, res);
  }
});

router.endpoint('/excel-usages', {
  get: async (req: Request, res: Response) => {
    await handleExcelUsagesEndpoint(getZenlessControl(req), req, res);
  }
});

export default router;
