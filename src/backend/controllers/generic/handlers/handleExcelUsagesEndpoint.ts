import { AbstractControl } from '../../../domain/abstract/abstractControl.ts';
import { Request, Response } from 'express';
import { maybeInt } from '../../../../shared/util/numberUtil.ts';
import { IdToExcelUsages } from '../../../../shared/util/searchUtil.ts';
import { ChangeRecordRef } from '../../../../shared/types/changelog-types.ts';
import { GenshinControl } from '../../../domain/genshin/genshinControl.ts';
import { toBoolean } from '../../../../shared/util/genericUtil.ts';
import ExcelUsagesResult from '../../../components/shared/api_results/ExcelUsagesResult.vue';

export async function handleExcelUsagesEndpoint(ctrl: AbstractControl, req: Request, res: Response) {
  const ids: (number | string)[] = String(req.query.q).split(/,/g).map(s => s.trim()).filter(s => /^-?[a-zA-Z0-9_]+$/.test(s)).map(maybeInt);
  const idToUsages: IdToExcelUsages = {};
  const changeRecordRefs: ChangeRecordRef[] = [];

  await ids.asyncForEach(async id => {
    await ctrl.getExcelUsages(id).then(usages => {
      // console.log('[Excel-Usages] Finished getting usages for', id);
      idToUsages[id] = usages;
    });
  });

  if (ctrl instanceof GenshinControl) {
    for (let id of ids) {
      changeRecordRefs.push(...await ctrl.selectChangeRecordAdded(id));
    }
  }

  if (req.headers.accept && req.headers.accept.toLowerCase() === 'text/html') {
    return res.render(ExcelUsagesResult, {
      idToUsages,
      changeRecordRefs,
      embed: toBoolean(req.query.embed),
    });
  } else {
    return idToUsages;
  }
}
