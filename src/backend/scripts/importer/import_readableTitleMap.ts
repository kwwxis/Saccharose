import '../../loadenv';
import { pathToFileURL } from 'url';
import { getTextMapItem, loadTextMaps } from '../textmap';
import { getControl } from '../script_util';
import { ReadableView } from '../../../shared/types/readable-types';
import { LANG_CODES, LangCodeMap } from '../../../shared/types/dialogue-types';
import { defaultMap } from '../../../shared/util/genericUtil';
import { getGenshinDataFilePath } from '../../loadenv';
import fs from 'fs';
import { closeKnex } from '../../util/db';

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await loadTextMaps();

  const ctrl = getControl();
  const archive = await ctrl.selectReadableArchiveView();

  const combined: ReadableView[] = [
    ... archive.Artifacts,
    ... archive.Weapons,
    ... archive.Materials,
    ... Object.values(archive.BookCollections).flatMap(bookSuit => bookSuit.Books),
  ];

  const fsOut: LangCodeMap<{[documentId: number]: string}> = {
    CH:  defaultMap('Object'),
    CHS: defaultMap('Object'),
    CHT: defaultMap('Object'),
    DE:  defaultMap('Object'),
    EN:  defaultMap('Object'),
    ES:  defaultMap('Object'),
    FR:  defaultMap('Object'),
    ID:  defaultMap('Object'),
    IT:  defaultMap('Object'),
    JP:  defaultMap('Object'),
    KR:  defaultMap('Object'),
    PT:  defaultMap('Object'),
    RU:  defaultMap('Object'),
    TH:  defaultMap('Object'),
    TR:  defaultMap('Object'),
    VI:  defaultMap('Object'),
  };

  for (let view of combined) {
    for (let langCode of LANG_CODES) {
      fsOut[langCode][view.Id] = getTextMapItem(langCode, view.TitleTextMapHash);
    }
  }

  if (!fs.existsSync(getGenshinDataFilePath('./Readable/TitleMap/'))) {
    fs.mkdirSync(getGenshinDataFilePath('./Readable/TitleMap/'));
  }

  for (let langCode of LANG_CODES) {
    console.log('Writing to ReadableTitleMap' + langCode + '.json');
    fs.writeFileSync(getGenshinDataFilePath('./Readable/TitleMap/ReadableTitleMap' + langCode + '.json'), JSON.stringify(fsOut[langCode], null, 2), 'utf8');
  }

  await closeKnex();
}