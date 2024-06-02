import { pathToFileURL } from 'url';
import fs from 'fs';
import path from 'path';

function* walkSync(dir: string): Generator<string> {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    if (file.isDirectory()) {
      yield* walkSync(path.join(dir, file.name));
    } else {
      yield path.join(dir, file.name);
    }
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {

  for (let f of walkSync('C:\\Shared\\HoyoStudioZZZ\\Output\\Sprite_ZZZ')) {
    let fbn = path.basename(f);

    if (fs.existsSync('C:/Shared/HoyoStudioZZZ/Output/Texture2D_ZZZ/' + fbn)) {
      fs.copyFileSync('C:/Shared/HoyoStudioZZZ/Output/Texture2D_ZZZ/' + fbn, 'C:/Shared/HoyoStudioZZZ/Output/Texture2D_ZZZ_Filtered/' + fbn);
    }
  }


}
