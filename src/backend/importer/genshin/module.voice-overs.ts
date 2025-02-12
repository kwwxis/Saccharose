import { getGenshinControl, loadGenshinVoiceItems } from '../../domain/genshin/genshinControl.ts';
import { fetchCharacterFetters } from '../../domain/genshin/character/fetchCharacterFetters.ts';
import fs from 'fs';
import chalk from 'chalk';
import { closeKnex } from '../../util/db.ts';

export async function importVoiceOvers() {
  await loadGenshinVoiceItems();

  const outDir = process.env.GENSHIN_DATA_ROOT;

  const ctrl = getGenshinControl();
  const allFetters = await fetchCharacterFetters(ctrl, true);

  fs.writeFileSync(outDir + '/VoiceOvers.json', JSON.stringify(allFetters, null, 2));
  console.log(chalk.blue('Done. Output written to: ' + outDir + '/VoiceOvers.json'));
  await closeKnex();
}
