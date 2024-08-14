import { create } from '../../../routing/router.ts';
import {
  handleExcelUsagesEndpoint,
  handleOlEndpoint,
  handleTextMapSearchEndpoint,
} from '../../abstract/api/abstractBasicResources.ts';
import { getZenlessControl, ZenlessControl } from '../../../domain/zenless/zenlessControl.ts';
import { Request, Response, Router } from 'express';
import { isNotEmpty, isset, toBoolean } from '../../../../shared/util/genericUtil.ts';
import { isInt, toInt } from '../../../../shared/util/numberUtil.ts';
import { TextMapHash, TextMapSearchResult } from '../../../../shared/types/lang-types.ts';
import ZenlessDialogueHelperResult from '../../../components/zenless/ZenlessDialogueHelperResult.vue';
import { DialogueSectionResult } from '../../../domain/genshin/dialogue/dialogue_util.ts';
import { DialogWikitextResult } from '../../../../shared/types/genshin/dialogue-types.ts';
import { SbOut } from '../../../../shared/util/stringUtil.ts';

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

    await ctrl.streamTextMapMatches({
      inputLangCode: ctrl.inputLangCode,
      outputLangCode: ctrl.outputLangCode,
      searchText: query,
      flags: `${ctrl.searchModeFlags}`,
      searchAgainst: hashSearch ? 'Hash' : 'Text',
      doNormText: true,
      stream(textMapHash: TextMapHash, text: string) {
        sb.line(`:'''_SPEAKER_:''' ` + text);
        wikitextResult.ids.push({ textMapHash });
      }
    });

    wikitextResult.wikitext = sb.toString();
    section.setWikitext(wikitextResult);

    if (req.headers.accept && req.headers.accept.toLowerCase() === 'text/html') {
      return res.render(ZenlessDialogueHelperResult, {
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

router.endpoint('/excel-usages', {
  get: async (req: Request, res: Response) => {
    await handleExcelUsagesEndpoint(getZenlessControl(req), req, res);
  }
});

export default router;
