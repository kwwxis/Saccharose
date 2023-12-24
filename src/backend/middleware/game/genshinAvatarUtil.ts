import { GenshinControl } from '../../domain/genshin/genshinControl.ts';
import { AvatarExcelConfigData, isTraveler } from '../../../shared/types/genshin/avatar-types.ts';
import { cached } from '../../util/cache.ts';
import { fetchCharacterStories } from '../../domain/genshin/character/fetchStoryFetters.ts';
import { isInt, toInt } from '../../../shared/util/numberUtil.ts';
import { isString } from '../../../shared/util/stringUtil.ts';
import jsonMask from 'json-mask';
import { HomeWorldNPCExcelConfigData } from '../../../shared/types/genshin/homeworld-types.ts';
import { getHomeWorldCompanions } from '../../domain/genshin/character/companion_dialogue.ts';
import { Request } from 'express';

const avatarMaskProps: string =
  'Id,' +
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

export async function getGenshinAvatars(ctrl: GenshinControl, combineTraveler: boolean): Promise<AvatarExcelConfigData[]> {
  return cached('Genshin_AvatarListCache_' + ctrl.outputLangCode + '_' + combineTraveler, async () => {
    const storiesByAvatar = await fetchCharacterStories(ctrl);
    let foundTraveler = false;

    const lumineName = await ctrl.selectManualTextMapConfigDataById('INFO_FEMALE_PRONOUN_YING');
    const aetherName = await ctrl.selectManualTextMapConfigDataById('INFO_MALE_PRONOUN_KONG');

    return Object.values(storiesByAvatar)
      .map(x => jsonMask(x.avatar, avatarMaskProps))
      .filter((x: AvatarExcelConfigData) => {
        if (isTraveler(x) && combineTraveler) {
          if (foundTraveler) {
            return false;
          } else {
            foundTraveler = true;
            x.IconName = 'static/PlayerCombinedIcon';
          }
        }
        if (isTraveler(x) && !combineTraveler) {
          if (isTraveler(x, 'male')) {
            x.NameTextMapHash = aetherName.TextMapContentTextMapHash;
            x.NameText = aetherName.TextMapContentText;
          } else {
            x.NameTextMapHash = lumineName.TextMapContentTextMapHash;
            x.NameText = lumineName.TextMapContentText;
          }
        }
        return true;
      })
      .sort((a,b) => a.NameText.localeCompare(b.NameText));
  });
}

export async function getGenshinAvatar(ctrl: GenshinControl, req: Request, combineTraveler: boolean): Promise<AvatarExcelConfigData> {
  const avatars = await getGenshinAvatars(ctrl, combineTraveler);
  const arg: string|number = ['avatarId', 'avatarName', 'avatar', 'id']
    .map(key => req.params[key] || <string> req.query[key]).find(val => !!val);

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
        const langCodeMap = await ctrl.createLangCodeMap(avatar.NameTextMapHash, false);
        for (let name of Object.values(langCodeMap)) {
          if (nameCmp === name?.toLowerCase()) {
            req.context.htmlMetaProps['X-ReplaceInUrl'] = arg + ';' + avatar.NameText;
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
  const arg: string|number = ['avatarId', 'avatarName', 'avatar', 'id']
    .map(key => req.params[key] || <string> req.query[key]).find(val => !!val);

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
        const langCodeMap = await ctrl.createLangCodeMap(companion.CommonNameTextMapHash, false);
        for (let name of Object.values(langCodeMap)) {
          if (nameCmp === name?.toLowerCase()) {
            req.context.htmlMetaProps['X-ReplaceInUrl'] = arg + ';' + companion.CommonName;
            return companion;
          }
        }
      }
    }
    return null;
  }
}