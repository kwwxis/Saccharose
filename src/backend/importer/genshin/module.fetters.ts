import { getGenshinControl } from '../../domain/genshin/genshinControl';
import { fetchCharacterFetters } from '../../domain/genshin/character/fetchCharacterFetters';
import fs from 'fs';
import chalk from 'chalk';

export async function importFetters() {
  const outDir = process.env.GENSHIN_DATA_ROOT;

  const ctrl = getGenshinControl();
  const allFetters = await fetchCharacterFetters(ctrl, true);

  fs.writeFileSync(outDir + '/CharacterFettersCombined.json', JSON.stringify(allFetters, null, 2));
  console.log(chalk.blue('Done. Output written to: ' + outDir + '/CharacterFettersCombined.json'));
}