// noinspection JSUnusedGlobalSymbols

import { AbstractControl } from '../abstract/abstractControl.ts';
import { DATAFILE_HSR_VOICE_ITEMS, getStarRailDataFilePath, isSiteModeDisabled } from '../../loadenv.ts';
import { normalizeRawJson, SchemaTable } from '../../importer/import_db.ts';
import {
  LangCode, LangCodeMap,
  TextMapHash,
  VoiceItem,
  VoiceItemFlatMap,
} from '../../../shared/types/lang-types.ts';
import { __normStarRailText, StarRailNormTextOpts } from './starRailText.ts';
import path from 'path';
import fs from 'fs';
import { defaultMap } from '../../../shared/util/genericUtil.ts';
import { LoadingDesc } from '../../../shared/types/hsr/hsr-misc-types.ts';
import { sort } from '../../../shared/util/arrayUtil.ts';
import { genericNormSearchText, NormTextOptions } from '../abstract/genericNormalizers.ts';
import { Request } from 'express';
import { logInitData } from '../../util/logger.ts';
import { AvatarConfig } from '../../../shared/types/hsr/hsr-avatar-types.ts';
import { hsr_i18n, HSR_I18N_MAP } from '../abstract/i18n.ts';
import { AbstractControlState, ControlUserModeProvider } from '../abstract/abstractControlState.ts';
import { CurrentStarRailVersion, GameVersion, StarRailVersions } from '../../../shared/types/game-versions.ts';
import { Knex } from 'knex';
import { fsReadJson } from '../../util/fsutil.ts';

// region Control State
// --------------------------------------------------------------------------------------------------------------

/**
 * State/cache for only a single control
 */
export class StarRailControlState extends AbstractControlState {
  // Cache:
  avatarCache:   {[Id: number]: AvatarConfig} = {};
  mmNameCache:   {[Id: number]: string} = {};

  // Preferences:
  DisableAvatarCache: boolean = false;

  // Autoload Preferences:
  AutoloadText: boolean = true;
  AutoloadAvatar: boolean = true;

  copy(trx?: Knex.Transaction|boolean): StarRailControlState {
    const state = new StarRailControlState(this.controlUserMode);
    state.avatarCache = Object.assign({}, this.avatarCache);
    state.DisableAvatarCache = this.DisableAvatarCache;
    state.AutoloadText = this.AutoloadText;
    state.AutoloadAvatar = this.AutoloadAvatar;
    state.DbConnection = trx;
    return undefined;
  }
}

export function getStarRailControl(request?: ControlUserModeProvider) {
  return new StarRailControl(request);
}
// endregion

// region Control Object
// --------------------------------------------------------------------------------------------------------------
export class StarRailControl extends AbstractControl<StarRailControlState> {
  // region Constructor
  readonly voice: StarRailVoice = new StarRailVoice(this);

  constructor(modeOrState?: ControlUserModeProvider|StarRailControlState) {
    super({
      siteMode: 'hsr',
      dbName: 'hsr',
      cachePrefix: 'StarRail',
      stateConstructor: StarRailControlState,
      modeOrState: modeOrState,
      excelPath: './ExcelOutput',
      disabledLangCodes: ['IT', 'TR'],
      currentGameVersion: CurrentStarRailVersion,
      gameVersions: StarRailVersions,
      changelogConfig: {
        directory: ENV.HSR_CHANGELOGS,
        textmapEnabled: true,
        excelEnabled: false,
      },
    });
  }

  override getDataFilePath(file: string): string {
    return getStarRailDataFilePath(file);
  }

  override normText(text: string, langCode: LangCode, opts: NormTextOptions<StarRailNormTextOpts> = {}): string {
    if (!opts) opts = {};
    if (this.outputLangCode === 'EN') {
      opts.mcPlaceholderForceLangCode = 'EN';
    }
    return __normStarRailText(text, langCode, opts);
  }

  override normSearchText(text: string, inputLangCode: LangCode): string {
    return genericNormSearchText(text, inputLangCode);
  }

  override async isEmptyTextMapItem(langCode: LangCode, hash: TextMapHash): Promise<boolean> {
    return hash === 371857150 || super.isEmptyTextMapItem(langCode, hash);
  }

  override copy(trx?: Knex.Transaction|boolean): StarRailControl {
    return new StarRailControl(this.state.copy(trx));
  }

  override i18n(key: keyof typeof HSR_I18N_MAP, vars?: Record<string, string>): string {
    return hsr_i18n(key, this.outputLangCode, vars);
  }
  // endregion

  // region Post Process
  override async postProcess<T>(object: T, triggerNormalize?: SchemaTable | boolean, doNormText: boolean = false): Promise<T> {
    if (!object)
      return object;
    if (triggerNormalize) {
      object = normalizeRawJson(object, typeof triggerNormalize === 'boolean' ? null : triggerNormalize);
    }
    const objAsAny = object as any;
    for (let prop in object) {
      if (this.state.AutoloadText && (prop.endsWith('MapHash') || prop.endsWith('MapHashList'))) {
        let textProp: string = prop.endsWith('List') ? prop.slice(0, -11) + 'List' : prop.slice(0, -7);
        if (Array.isArray(object[prop])) {
          let newOriginalArray = [];
          object[textProp] = [];
          for (let id of <any[]>object[prop]) {
            let text = await this.getTextMapItem(this.outputLangCode, id);
            if (doNormText) {
              text = this.normText(text, this.outputLangCode);
            }
            if (text) {
              object[textProp].push(text);
              newOriginalArray.push(id);
            }
          }
          objAsAny[prop] = newOriginalArray;
        } else {
          let text = await this.getTextMapItem(this.outputLangCode, <TextMapHash> object[prop]);
          if (doNormText) {
            text = this.normText(text, this.outputLangCode);
          }
          if (!!text) {
            object[textProp] = text;
          }
        }
      }
      if (prop === 'AvatarId' && typeof objAsAny[prop] === 'number' && this.state.AutoloadAvatar) {
        objAsAny.Avatar = await this.selectAvatarById(objAsAny[prop]);
      }
      if (object[prop] === null || objAsAny[prop] === '') {
        delete object[prop];
      }
    }
    return object;
  }

  // endregion

  // region Avatars
  private async postProcessAvatar(avatar: AvatarConfig): Promise<AvatarConfig> {
    if (!avatar) {
      return avatar;
    }
    avatar.BaseTypeData = await this.knex.select('*').from('AvatarBaseType')
      .where({Id: avatar.BaseType}).first().then(this.commonLoadFirst);
    return avatar;
  }

  async selectAllAvatars(): Promise<AvatarConfig[]> {
    return await this.knex.select('*').from('AvatarConfig')
      .then(this.commonLoad)
      .then((avatars: AvatarConfig[]) => avatars.asyncMap(a => this.postProcessAvatar(a)));
  }

  async selectAvatarById(id: number): Promise<AvatarConfig> {
    if (this.state.avatarCache.hasOwnProperty(id)) {
      return this.state.avatarCache[id];
    }
    let avatar: AvatarConfig = await this.knex.select('*').from('AvatarConfig')
      .where({Id: id}).first().then(this.commonLoadFirst);
    avatar = await this.postProcessAvatar(avatar);
    if (!this.state.DisableAvatarCache) {
      this.state.avatarCache[id] = avatar;
    }
    return avatar;
  }
  // endregion

  async getLoadingTips(): Promise<{[category: string]: string[]}> {
    const out: {[category: string]: string[]} = defaultMap('Array');

    let loadingTips: LoadingDesc[] = await this.readExcelDataFile('./LoadingDesc.json');
    sort(loadingTips, 'TitleText', 'DescText');

    for (let loadingTip of loadingTips) {
      let title = this.normText(loadingTip.TitleText, this.outputLangCode);
      let desc = this.normText(loadingTip.DescText, this.outputLangCode);

      out[title].push(desc);
    }

    return out;
  }

  async selectMainMissionName(id: number): Promise<string> {
    if (!id) {
      return undefined;
    }
    if (!!this.state.mmNameCache[id]) {
      return this.state.mmNameCache[id];
    }
    let name = await this.knex.select('NameTextMapHash').from('MainMission')
      .where({Id: id}).first().then(async res => res ? await this.getTextMapItem(this.outputLangCode, res.NameTextMapHash) : undefined);
    this.state.mmNameCache[id] = name;
    return name;
  }

  async selectMainMissionNameTextMap(id: number): Promise<LangCodeMap> {
    if (!id) {
      return undefined;
    }
    return await this.knex.select('NameTextMapHash').from('MainMission')
      .where({Id: id}).first().then(async res => res ? await this.createLangCodeMap(res.NameTextMapHash) : undefined);
  }
}
// endregion

// region Voice Items
// --------------------------------------------------------------------------------------------------------------

const HSR_VOICE_ITEMS: VoiceItemFlatMap = {};

export type StarRailVoiceItemType = 'Archive' | 'Cutscene' | 'NPC_Far' | 'NPC_Near' | 'NPC_Normal';

interface StarRailVoiceConfigRaw {
  IsPlayerInvolved: boolean,
  VoiceID: number,
  VoicePath: string,
  VoiceType?: string,
}

export function normalizeStarRailVoicePath(voicePath: string): string {
  return voicePath.replace(/_/g, ' ').toLowerCase() + '.ogg'
}

export async function loadStarRailVoiceItems(): Promise<void> {
  if (isSiteModeDisabled('hsr'))
    return;
  logInitData('Loading HSR Voice Items -- starting...');

  const voiceItemsFilePath = path.resolve(ENV.HSR_DATA_ROOT, DATAFILE_HSR_VOICE_ITEMS);
  const result: StarRailVoiceConfigRaw[] = await fsReadJson(voiceItemsFilePath);

  for (let item of result) {
    HSR_VOICE_ITEMS[item.VoiceID] = {
      id: item.VoiceID,
      fileName: normalizeStarRailVoicePath(item.VoicePath),
      isGendered: item.IsPlayerInvolved,
      type: item.VoiceType
    };
  }

  Object.freeze(HSR_VOICE_ITEMS);
  logInitData('Loading HSR Voice Items -- done!');
}

export class StarRailVoice {
  private prefixingDisabled: boolean;

  constructor(readonly ctrl: StarRailControl) {
    this.prefixingDisabled = ctrl.state.prefs.voPrefixDisabledLangs?.includes(ctrl.outputLangCode);
  }

  getVoiceItemsByType(type: StarRailVoiceItemType): VoiceItem[] {
    let items: VoiceItem[] = [];
    for (let item of Object.values(HSR_VOICE_ITEMS)) {
      if (item.type === type) {
        items.push(item)
      }
    }
    return items;
  }

  getVoiceItemByFile(voFile: string): VoiceItem {
    voFile = voFile.toLowerCase();
    for (let item of Object.values(HSR_VOICE_ITEMS)) {
      if (item.fileName === voFile) {
        return item;
      }
    }
    return null;
  }

  getVoiceItem(id: number|string): VoiceItem {
    return HSR_VOICE_ITEMS[id];
  }

  getVoPrefix(id: number|string, text?: string): string {
    if (this.prefixingDisabled) {
      return '';
    }

    let voItem: VoiceItem = HSR_VOICE_ITEMS[id];
    let voPrefix = '';
    if (voItem) {
      let tmp = [];

      if (voItem.isGendered && (!text || (/{{MC/i.test(text)))) {
        tmp.push(`{{A|${voItem.fileName} M}}`);
        tmp.push(`{{A|${voItem.fileName} F}}`);
      } else {
        tmp.push(`{{A|${voItem.fileName}}}`);
      }

      return tmp.join(' ') + ' ';
    }
    return voPrefix;
  }
}
// endregion
