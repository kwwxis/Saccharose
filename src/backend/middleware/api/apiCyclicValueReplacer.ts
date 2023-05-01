import { CyclicValueReplacer } from '../../../shared/util/genericUtil';

export const ApiCyclicValueReplacer: CyclicValueReplacer = (k: string, v: any) => {
  if (typeof v === 'object' && v.Id) {
    return {
      __cyclicKey: k,
      __cyclicRef: v.Id,
    };
  } else {
    return;
  }
};