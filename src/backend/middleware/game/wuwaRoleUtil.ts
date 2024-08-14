import jsonMask from 'json-mask';
import { Request } from 'express';
import { isInt, toInt } from '../../../shared/util/numberUtil.ts';
import { isString } from '../../../shared/util/stringUtil.ts';
import { WuwaControl } from '../../domain/wuwa/wuwaControl.ts';
import { RoleInfo } from '../../../shared/types/wuwa/role-types.ts';

const roleInfoMaskProps: string =
  'Id,' +
  'QualityId,' +
  'RoleType,' +
  'IsTrial,' +
  'Name,' +
  'NameText,' +
  'NickName,' +
  'NickNameText,' +
  'Introduction,' +
  'IntroductionText,' +
  'RoleHeadIconCircle,' +
  'RoleHeadIconLarge,' +
  'RoleHeadIconBig,' +
  'Card,' +
  'RoleHeadIcon,' +
  'FormationRoleCard,' +
  'RoleStand,' +
  'RolePortrait,' +
  'RoleBody,' +
  'IsShow,' +
  'WeaponType,' +
  'Icon,' +
  'CharacterVoice,' +
  'CharacterVoiceText';

export async function getWuwaRoles(ctrl: WuwaControl): Promise<RoleInfo[]> {
  return ctrl.cached('RoleListCache:' + ctrl.outputLangCode, 'json', async () => {
    return (await ctrl.selectAllRoleInfo())
      .filter(a => a.RoleType === 1)
      .map(a => jsonMask(a, roleInfoMaskProps))
      .sort((a: RoleInfo, b: RoleInfo) => a.NameText.localeCompare(b.NameText));
  });
}

export async function getWuwaRole(ctrl: WuwaControl, req: Request): Promise<RoleInfo> {
  const roles = await getWuwaRoles(ctrl);

  const arg: string|number = ['roleId', 'roleName', 'name', 'role', 'id']
    .map(key => req.params[key] || <string> req.query[key]).find(val => !!val);

  if (!arg) {
    return null;
  } else if (isInt(arg)) {
    return roles.find(a => a.Id === toInt(arg));
  } else if (isString(arg)) {
    const nameCmp = arg.toLowerCase().replace(/_/g, ' ');
    const ret = roles.find(a => nameCmp === a.NameText.toLowerCase());
    if (ret) {
      return ret;
    } else {
      for (let role of roles) {
        const langCodeMap = await ctrl.createLangCodeMap(role.Name, false);
        for (let name of Object.values(langCodeMap)) {
          if (nameCmp === name?.toLowerCase()) {
            req.context.htmlMetaProps['X-ReplaceInUrl'] = arg + ';' + role.NameText;
            return role;
          }
        }
      }
    }
    return null;
  }
}
