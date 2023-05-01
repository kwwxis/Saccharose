import { GenshinControl } from '../../domain/genshin/genshinControl';
import { AvatarExcelConfigData } from '../../../shared/types/genshin/avatar-types';
import { cached } from '../../util/cache';
import { fetchCharacterStories } from '../../domain/genshin/character/fetchStoryFetters';
import { Request } from '../../util/router';
import { isInt, toInt } from '../../../shared/util/numberUtil';
import { isString } from '../../../shared/util/stringUtil';
import { createLangCodeMap } from '../../domain/genshin/textmap';
import jsonMask from 'json-mask';
import { HomeWorldNPCExcelConfigData } from '../../../shared/types/genshin/homeworld-types';
import { getHomeWorldCompanions } from '../../domain/genshin/character/companion_dialogue';

export const avatarMaskProps = 'Id,' +
  'QualityType,' +
  'NameText,' +
  'NameTextMapHash,' +
  'DescText,' +
  'DescTextMapHash,' +
  'InfoDescText,' +
  'InfoDescTextMapHash,' +
  'InitialWeapon,' +
  'WeaponType,' +
  'BodyType,' +
  'IconName,' +
  'ImageName,' +
  'SideIconName';

export async function getAvatars(ctrl: GenshinControl): Promise<AvatarExcelConfigData[]> {
  return cached('AvatarListCache_' + ctrl.outputLangCode, async () => {
    let storiesByAvatar = await fetchCharacterStories(ctrl);
    return Object.values(storiesByAvatar)
      .map(x => jsonMask(x.avatar, avatarMaskProps))
      .sort((a,b) => a.NameText.localeCompare(b.NameText));
  });
}

export async function getAvatar(ctrl: GenshinControl, req: Request): Promise<AvatarExcelConfigData> {
  const avatars = await getAvatars(ctrl);
  const arg: string|number = ['avatarId', 'avatarName', 'avatar', 'id'].map(key => req.params[key] || req.query[key]).find(val => !!val);

  if (!arg) {
    return null;
  } else if (isInt(arg)) {
    return avatars.find(a => a.Id === toInt(arg));
  } else if (isString(arg)) {
    const nameCmp = arg.toLowerCase().replace(/_/g, ' ');
    const ret = avatars.find(a => nameCmp === a.NameText.toLowerCase());
    if (ret) {
      return ret;
    } else {
      for (let avatar of avatars) {
        const langCodeMap = createLangCodeMap(avatar.NameTextMapHash, false);
        for (let name of Object.values(langCodeMap)) {
          if (nameCmp === name?.toLowerCase()) {
            req.context.htmlMetaProps['X-ChangeAvatarNameInURL'] = arg + ';' + avatar.NameText;
            return avatar;
          }
        }
      }
    }
    return null;
  }
}

export async function getCompanion(ctrl: GenshinControl, req: Request): Promise<HomeWorldNPCExcelConfigData> {
  const companions = await getHomeWorldCompanions(ctrl);
  const arg: string|number = ['avatarId', 'avatarName', 'avatar', 'id'].map(key => req.params[key] || req.query[key]).find(val => !!val);

  if (!arg) {
    return null;
  } else if (isInt(arg)) {
    return companions.find(c => c.CommonId === toInt(arg));
  } else if (isString(arg)) {
    const nameCmp = arg.toLowerCase().replace(/_/g, ' ');
    const ret = companions.find(a => nameCmp === a.CommonName.toLowerCase());
    if (ret) {
      return ret;
    } else {
      for (let companion of companions) {
        const langCodeMap = createLangCodeMap(companion.CommonNameTextMapHash, false);
        for (let name of Object.values(langCodeMap)) {
          if (nameCmp === name?.toLowerCase()) {
            req.context.htmlMetaProps['X-ChangeAvatarNameInURL'] = arg + ';' + companion.CommonName;
            return companion;
          }
        }
      }
    }
    return null;
  }
}