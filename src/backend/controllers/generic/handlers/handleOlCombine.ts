import { AbstractControl } from '../../../domain/abstract/abstractControl.ts';
import { Request, Response } from 'express';
import { ol_combine_results } from '../../../domain/abstract/basic/OLgen.ts';
import { mwParse } from '../../../../shared/mediawiki/mwParse.ts';
import OLCombineResult from '../../../components/shared/api_results/OLCombineResult.vue';
import { OLResult } from '../../../../shared/types/ol-types.ts';

export async function handleOlCombine(ctrl: AbstractControl, req: Request, res: Response) {
  const mwText = ((req.body.text || req.query.text || '') as string).trim();

  const olResults: OLResult[] = [];

  if (mwText.length) {
    const mwParsed = mwParse(mwText);
    for (let templateNode of mwParsed.findTemplateNodes()) {
      if (templateNode.templateName.toLowerCase() === 'other_languages') {
        olResults.push({
          textMapHash: null,
          result: templateNode.toString(),
          templateNode,
          markers: [],
          warnings: [],
          duplicateTextMapHashes: [],
        });
      }
    }
  }

  const combined = ol_combine_results(olResults);

  if (req.headers.accept && req.headers.accept.toLowerCase() === 'text/html') {
    return res.renderComponent(OLCombineResult, {
      combineResult: combined,
    });
  } else {
    return combined;
  }
}
