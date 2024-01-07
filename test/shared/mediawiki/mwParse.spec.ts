import { MwParentNode } from '../../../src/shared/mediawiki/mwParseTypes.ts';
import { mwParse } from '../../../src/shared/mediawiki/mwParse';
import util from 'util';
import { loadResourceAsString } from '../../spec-util';

test('parse and stringify', () => {
  const input: string = loadResourceAsString('Nahida_EN_VO.wt');
  const result: MwParentNode = mwParse(input);
  console.log(util.inspect(result, false, null, true));

  expect(result.toString()).toBe(input);
});
