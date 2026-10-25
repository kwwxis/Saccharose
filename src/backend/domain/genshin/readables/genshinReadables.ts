import { GenshinControl, GenshinControlState } from '../genshinControl.ts';
import {
  BooksCodexExcelConfigData,
  BookSuitExcelConfigData,
  DocumentExcelConfigData, LANG_CODE_TO_LOCALIZATION_PATH_PROP, LANG_CODE_TO_LOCALIZATION_PATH_PROP_ENTRIES,
  LocalizationExcelConfigData, Readable, ReadableArchive, ReadableItem, ReadableLoadConf, ReadableSearchResult, ReadableText,
  ReadableVariantInfo,
} from '../../../../shared/types/genshin/readable-types.ts';
import { Knex } from 'knex';
import { isStringBlank, createTextMatchRanker } from '../../../../shared/util/stringUtil.ts';
import { LangCode } from '../../../../shared/types/lang-types.ts';
import { pairArrays, sort } from '../../../../shared/util/arrayUtil.ts';
import { grepStream } from '../../../util/shellutil.ts';
import { getReadableRelPath } from '../../../loadenv.ts';
import path from 'node:path';
import { Marker } from '../../../../shared/util/highlightMarker.ts';
import { isset } from '../../../../shared/util/genericUtil.ts';
import { fsRead } from '../../../util/fsutil.ts';
import { toInt } from '../../../../shared/util/numberUtil.ts';
import { Duration } from '../../../../shared/util/duration.ts';
import { GameVersion, GameVersions } from '../../../../shared/types/game-versions.ts';

export class GenshinReadables {
  constructor(readonly ctrl: GenshinControl) {}

  private get state(): GenshinControlState {
    return this.ctrl.state;
  }
  private get knex(): Knex {
    return this.ctrl.knex;
  }
  private get inputLangCode(): LangCode {
    return this.ctrl.inputLangCode;
  }
  private get outputLangCode(): LangCode {
    return this.ctrl.outputLangCode;
  }

  // region Book Suit/Codex
  // --------------------------------------------------------------------------------------------------------------
  private async selectBookSuitById(id: number): Promise<BookSuitExcelConfigData> {
    if (this.state.bookSuitCache[id]) {
      return this.state.bookSuitCache[id];
    }
    let res: BookSuitExcelConfigData = await this.knex.select('*').from('BookSuitExcelConfigData')
      .where({Id: id}).first().then(this.ctrl.commonLoadFirst);
    res.Books = [];
    this.state.bookSuitCache[id] = res;
    return res;
  }

  public async selectBookCodexByMaterialId(id: number): Promise<BooksCodexExcelConfigData> {
    return await this.knex.select('*').from('BooksCodexExcelConfigData')
      .where({MaterialId: id}).first().then(this.ctrl.commonLoadFirst);
  }

  public async selectBookCodexById(id: number): Promise<BooksCodexExcelConfigData> {
    return await this.knex.select('*').from('BooksCodexExcelConfigData')
      .where({Id: id}).first().then(this.ctrl.commonLoadFirst);
  }

  public async selectBookCollection(suitId: number, loadConf: ReadableLoadConf = {}): Promise<BookSuitExcelConfigData> {
    let archive: ReadableArchive = await this.selectArchive({
      LoadReadableItems: readable => {
        const superCondition = readable?.BookSuit?.Id === toInt(suitId);

        if (typeof loadConf.LoadReadableItems === 'function') {
          return superCondition && loadConf.LoadReadableItems(readable);
        } else if (typeof loadConf.LoadReadableItems === 'boolean') {
          return superCondition && loadConf.LoadReadableItems;
        } else {
          return superCondition;
        }
      },
      ... loadConf
    });
    return archive.BookCollections[suitId];
  }
  // endregion

  // region Readable Search Logic
  // --------------------------------------------------------------------------------------------------------------
  private async getDocumentIdsByTitleMatch(langCode: LangCode, searchText: string, flags?: string): Promise<number[]> {
    if (isStringBlank(searchText)) {
      return [];
    }
    const ranker = createTextMatchRanker(searchText, (flags || '').includes('i'));
    await this.ctrl.streamTextMapMatchesWithIndex({
      inputLangCode: langCode,
      outputLangCode: langCode,
      searchText,
      textIndexName: 'Readable',
      stream: (id: number, entityIndexName, textMapHash, text: string) => {
        ranker.add(id, text);
      },
      flags
    });
    return ranker.orderedIds();
  }

  private async getReadableFileNamesByContentMatch(langCode: LangCode, searchText: string, flags?: string): Promise<string[]> {
    if (isStringBlank(searchText)) {
      return [];
    }

    let out: string[] = [];

    await grepStream(searchText, this.ctrl.getDataFilePath(getReadableRelPath(langCode)), Duration.ofSeconds(30), line => {
      let exec = /\/([^\/]+)\.txt/.exec(line);
      if (exec) {
        out.push(exec[1]);
      }
    }, { flags: flags || '' });

    return out;
  }

  public async search(searchText: string, versionFilter?: GameVersions): Promise<ReadableSearchResult> {
    if (versionFilter && versionFilter.isEmpty()) {
      versionFilter = null;
    }

    const contentMatchFileNames = await this.getReadableFileNamesByContentMatch(this.inputLangCode, searchText, this.ctrl.searchModeFlags);
    const titleMatchDocumentIds = await this.getDocumentIdsByTitleMatch(this.inputLangCode, searchText, this.ctrl.searchModeFlags);
    const ret: ReadableSearchResult = { ContentResults: [], TitleResults: [] }

    if (contentMatchFileNames.length) {
      const pathVar = LANG_CODE_TO_LOCALIZATION_PATH_PROP[this.inputLangCode];
      const pathVarSearch = contentMatchFileNames.map(f => 'ART/UI/Readable/' + this.inputLangCode + '/' + f.split('.txt')[0]);

      const localizations: LocalizationExcelConfigData[] = await this.knex.select('*')
        .from('LocalizationExcelConfigData')
        .whereIn(pathVar, pathVarSearch)
        .then(this.ctrl.commonLoad);

      const normSearchText: string = this.ctrl.normText(searchText, this.inputLangCode);

      ret.ContentResults = await localizations.asyncMap(async localization => {
        return await this.selectReadableByLocalizationId(localization.Id, {
          LoadReadableItems: true,
          LoadAddedAt: true
        });
      });

      if (versionFilter) {
        ret.ContentResults = ret.ContentResults.filter(view => {
          if (!view || !view.Document || !view.AddedAtVersion) {
            return false;
          }
          return versionFilter.has(view.AddedAtVersion);
        });
      }

      for (let view of ret.ContentResults) {
        for (let item of view.Items) {
          item.ReadableText.Markers = {
            AsNormal: Marker.create(normSearchText, item.ReadableText.AsNormal),
            AsDialogue: Marker.create(normSearchText, item.ReadableText.AsDialogue),
            AsTemplate: Marker.create(normSearchText, item.ReadableText.AsTemplate),
          };
        }
      }
    }

    if (titleMatchDocumentIds.length) {
      ret.TitleResults = await titleMatchDocumentIds.asyncMap(async id => await this.select(id, {
        LoadReadableItems: true,
        LoadAddedAt: true
      }));

      if (versionFilter) {
        ret.TitleResults = ret.TitleResults.filter(view => {
          if (!view || !view.Document || !view.AddedAtVersion) {
            return false;
          }
          return versionFilter.has(view.AddedAtVersion);
        });
      }
    }

    return ret;
  }
  // endregion

  // region Select Readable by Localization ID
  // --------------------------------------------------------------------------------------------------------------
  private async selectDocumentIdByLocalizationId(localizationId: number): Promise<number> {
    if (isNaN(localizationId)) {
      throw new Error(`Localization id ${localizationId} is not a number`);
    }
    return await this.knex.select('DocumentId').from('Relation_LocalizationIdToDocumentId')
      .where({LocalizationId: localizationId})
      .first()
      .then(res => res ? res.DocumentId : undefined);
  }

  public async selectReadableByLocalizationId(localizationId: number, loadConf: ReadableLoadConf = {}): Promise<Readable> {
    if (isNaN(localizationId)) {
      return null;
    }
    return await this.selectDocumentIdByLocalizationId(localizationId)
      .then(docId => isset(docId) ? this.select(docId, loadConf) : null);
  }

  public async selectLocalizationIdByLocPath(path: string): Promise<number> {
    let pathParts = path.split('/');
    if (pathParts.length < 2) {
      throw new Error('Invalid loc path: ' + path);
    }

    const langCode = pathParts[pathParts.length - 2];
    const name = pathParts[pathParts.length - 1];

    path = `ART/UI/Readable/${langCode}/${name}`;

    return await this.knex.select('Id').from('LocalizationExcelConfigData')
      .where({ [LANG_CODE_TO_LOCALIZATION_PATH_PROP[langCode]]: path })
      .first()
      .then(res => res ? res.Id : undefined);
  }
  // endregion

  // region Select Document
  // --------------------------------------------------------------------------------------------------------------
  private async postProcessDocument(document: DocumentExcelConfigData): Promise<DocumentExcelConfigData> {
    if (!document)
      return document;
    document.TitleTextMap = await this.ctrl.createLangCodeMap(document.TitleTextMapHash);
    return document;
  }

  private async selectDocument(documentId: number): Promise<DocumentExcelConfigData> {
    return await this.knex.select('*').from('DocumentExcelConfigData')
      .where({Id: documentId}).first().then(this.ctrl.commonLoadFirst).then(x => this.postProcessDocument(x));
  }

  private async selectAllDocument(): Promise<DocumentExcelConfigData[]> {
    return await this.knex.select('*').from('DocumentExcelConfigData')
      .then(this.ctrl.commonLoad).then(ret => ret.asyncMap(x => this.postProcessDocument(x)));
  }
  // endregion

  // region Select Readable
  // --------------------------------------------------------------------------------------------------------------
  private async loadLocalization(document: DocumentExcelConfigData,
                                 pageNumber: number,
                                 itemIsAlt: boolean,
                                 contentLocalizedId: number,
                                 triggerCond?: number): Promise<ReadableItem> {
    const localization: LocalizationExcelConfigData = await this.knex.select('*').from('LocalizationExcelConfigData')
      .where({Id: contentLocalizedId}).first().then(this.ctrl.commonLoadFirst);

    const ret: ReadableItem = {
      Page: pageNumber,
      IsAlternate: itemIsAlt,
      Localization: localization,
      ReadableText: {
        LangCode: this.outputLangCode,
        LangPath: null,
        AsNormal: null,
        AsTemplate: null,
        AsDialogue: null,
        Images: [],
      },
      ReadableTextAllLanguages: [],
      ReadableChangesGroup: {} as any,
    };

    if (triggerCond) {
      let quest = await this.ctrl.selectQuestExcelConfigData(triggerCond);
      if (quest) {
        ret.MainQuestTrigger = await this.ctrl.selectMainQuestById(quest.MainId);
      }
    }

    if (!localization) {
      return ret;
    }

    for (let {langCode, pathVar} of LANG_CODE_TO_LOCALIZATION_PATH_PROP_ENTRIES) {
      if (typeof localization[pathVar] !== 'string' || !localization[pathVar].includes('/Readable/')) {
        continue;
      }

      const documentTitle = document.TitleTextMap[langCode];
      const locPath = localization[pathVar].split('/Readable/')[1];
      const fileName = path.basename(locPath);
      const filePath = './Readable/' + locPath + '.txt';

      try {
        const fileText = await fsRead(this.ctrl.getDataFilePath(filePath));

        const readableText = this.generateReadableText(documentTitle, langCode, fileName, fileText);
        ret.ReadableTextAllLanguages.push(readableText);

        if (langCode === this.outputLangCode) {
          ret.ReadableText = readableText;
        }
        ret.ReadableChangesGroup[langCode] = await this.ctrl.readableChanges.getReadableChanges(langCode, locPath);
      } catch (ignore) {}
    }

    return ret;
  }

  private generateReadableText(documentTitle: string, langCode: LangCode, fileName: string, fileText: string): ReadableText {
    const fileNormText = this.ctrl.normText(fileText, this.outputLangCode)
      .replace(/<br ?\/?>/g, '<br>\n')
      .replace(/^\n\n+/gm, fm => {
        return '<br>\n'.repeat(fm.length);
      })
      .replace(/[ \t]+<br ?\/?>/g, '<br>')
      .replace(/[ \t]+$/gm, '');

    let images: string[] = [];
    for (let match of fileNormText.matchAll(/\{\{tx\|Image: ([^}]+)}}/ig)) {
      images.push(match[1]);
    }

    return {
      LangCode: langCode,
      LangPath: fileName,
      AsNormal: fileNormText
        .replace(/\n\n+/g, '<br><br><!--#DOUBLE_NL#-->')
        .replace(/\n/g, '<!--\n-->')
        .replace(/#DOUBLE_NL#/g, '\n\n'),
      AsTemplate: `{{Readable|title=${documentTitle || ''}\n|text=<!--\n-->`
        + fileNormText
          .replace(/\n\n+/g, '<br><br><!--#DOUBLE_NL#-->')
          .replace(/\n/g, '<!--\n-->')
          .replace(/#DOUBLE_NL#/g, '\n\n') + '}}',
      AsDialogue: fileNormText.split(/\n/g).map(line => {
        if (line.endsWith('<br>')) {
          line = line.slice(0, -4);
        }
        if (!line) {
          return '::&nbsp;'
        }
        return '::' + line;
      }).join('\n'),
      Images: images,
    };
  }

  public async select(documentInput: number|DocumentExcelConfigData,
                      loadConf: ReadableLoadConf = {}): Promise<Readable> {
    const document: DocumentExcelConfigData = typeof documentInput === 'number' ? await this.selectDocument(documentInput) : documentInput;

    if (!document) {
      return null;
    }

    const view: Readable = {
      Id: document.Id,
      Document: document,
      Items: [],
      VariantTypes: [],
      MetaTypes: [],
      Variants: {},
    };

    view.BookCodex = await this.selectBookCodexByMaterialId(document.Id);
    if (view.BookCodex) {
      view.MetaTypes.push('BookCodex');
    } else {
      view.MetaTypes.push('NonBookCodex');
    }

    view.Material = await this.ctrl.selectMaterialExcelConfigData(document.Id);
    view.Artifact = await this.ctrl.selectArtifactByStoryId(document.Id);
    view.Weapon = await this.ctrl.selectWeaponByStoryId(document.Id);
    view.Costume = await this.ctrl.selectAvatarCostumeByMaterialId(document.Id);
    view.Flycloak = await this.ctrl.selectAvatarFlycloakByMaterialId(document.Id);

    if (view.Material && view.Material.SetId) {
      view.BookSuit = await this.selectBookSuitById(view.Material.SetId);
      if (view.BookSuit) {
        view.MetaTypes.push('BookSuit');
      } else {
        view.MetaTypes.push('NonBookSuit');
      }
    } else {
      view.MetaTypes.push('NonBookSuit');
    }

    if (view.Artifact) {
      view.ArtifactSet = await this.ctrl.selectArtifactSetById(view.Artifact.SetId);
      view.ArtifactCodex = await this.ctrl.selectArtifactCodexById(view.Artifact.Id);
    }

    if (view.Material) {
      view.VariantTypes.push('Material');
      view.Variants.Material = {
        VariantType: 'Material',
        TitleText: view.Material.NameText || '(Unnamed item)',
        TitleTextMapHash: view.Material.NameTextMapHash,
        Icon: view.Material.Icon,
      };
    }
    if (view.Artifact) {
      view.VariantTypes.push('Artifact');
      view.Variants.Artifact = {
        VariantType: 'Artifact',
        TitleText: view.Artifact.NameText || '(Unnamed artifact)',
        TitleTextMapHash: view.Artifact.NameTextMapHash,
        Icon: view.Artifact.Icon,
      };
    }
    if (view.Weapon) {
      view.VariantTypes.push('Weapon');
      view.Variants.Weapon = {
        VariantType: 'Weapon',
        TitleText: view.Weapon.NameText || '(Unnamed weapon)',
        TitleTextMapHash: view.Weapon.NameTextMapHash,
        Icon: view.Weapon.Icon,
      };
    }
    if (view.Flycloak) {
      view.VariantTypes.push('Flycloak');
      view.Variants.Flycloak = {
        VariantType: 'Flycloak',
        TitleText: view.Flycloak.NameText || '(Unnamed flycloak)',
        TitleTextMapHash: view.Flycloak.NameTextMapHash,
        Icon: view.Flycloak.Icon,
      };
    }
    if (view.Costume) {
      view.VariantTypes.push('Costume');
      view.Variants.Costume = {
        VariantType: 'Costume',
        TitleText: view.Costume.NameText || '(Unnamed costume)',
        TitleTextMapHash: view.Costume.NameTextMapHash,
        Icon: view.Costume.FrontIconName,
      };
    }

    const primaryVariant: ReadableVariantInfo = view.Variants.Material
      || Object.values(view.Variants).find(variant => !!variant);
    if (primaryVariant) {
      view.PrimaryVariantTitleText = primaryVariant.TitleText;
      view.PrimaryVariantTitleTextMapHash = primaryVariant.TitleTextMapHash;
      view.PrimaryVariantIcon = primaryVariant.Icon;
    } else {
      view.PrimaryVariantTitleText = '(Unidentifiable readable)';
      view.PrimaryVariantIcon = 'static/Item_Unknown';
    }

    const shouldLoadItems: boolean = (typeof loadConf.LoadReadableItems === 'function'
      ? loadConf.LoadReadableItems(view) : loadConf.LoadReadableItems) === true;
    if (shouldLoadItems) {
      view.Items = [
        ...(await view.Document.ContentLocalizedIds.asyncMap((id: number, idx: number) => this.loadLocalization(view.Document, idx + 1, false, id))),
        ...(await pairArrays(view.Document.QuestContentLocalizedIds, view.Document.QuestIdList).asyncMap(
          async ([id, triggerCond], idx: number) => await this.loadLocalization(view.Document, idx + 1, true, id, triggerCond)
        ))
      ];
      if (view.Document.AdditionalQuestContentLocalizedIds && view.Document.AdditionalQuestContentLocalizedIds.length) {
        let startForPage = view.Document.QuestContentLocalizedIds.length;
        view.Items.push(
          ...(await pairArrays(view.Document.AdditionalQuestContentLocalizedIds, view.Document.AdditionalQuestIdList).asyncMap(
            async ([id, triggerCond], idx: number) => await this.loadLocalization(view.Document, startForPage + idx + 1, true, id, triggerCond)
          ))
        );
      }
    }

    if (loadConf.LoadAddedAt) {
      let addedAt = await this.ctrl.excelChangelog.selectChangeRefAddedAt(document.Id, 'DocumentExcelConfigData');
      if (addedAt) {
        view.AddedAtVersion = addedAt.version;
      }

      let lowestChangeVersion: GameVersion = null;

      for (let item of view.Items) {
        if (!item.ReadableChangesGroup) {
          continue;
        }
        for (let changesGroup of Object.values(item.ReadableChangesGroup)) {
          if (!lowestChangeVersion || changesGroup.lowestContentfulVersion.idxOrder < lowestChangeVersion.idxOrder) {
            lowestChangeVersion = changesGroup.lowestContentfulVersion;
          }
        }
      }

      if (lowestChangeVersion && (!view.AddedAtVersion || lowestChangeVersion.idxOrder < view.AddedAtVersion.idxOrder)) {
        view.AddedAtVersion = lowestChangeVersion;
      }
    }

    return view;
  }
  // endregion

  // region Readable Archive
  // --------------------------------------------------------------------------------------------------------------
  public generateArchive(views: Readable[]): ReadableArchive {
    const archive: ReadableArchive = {
      TotalCount: 0,
      BookCollections: {},
      Materials: [],
      Artifacts: [],
      Weapons: [],
    };

    for (let view of views) {
      if (!view)
        continue;
      archive.TotalCount++;
      if (view.BookSuit) {
        if (!archive.BookCollections[view.BookSuit.Id]) {
          archive.BookCollections[view.BookSuit.Id] = view.BookSuit;
        }
        archive.BookCollections[view.BookSuit.Id].Books.push(view);
      } else if (view.Artifact) {
        archive.Artifacts.push(view);
      } else if (view.Weapon) {
        archive.Weapons.push(view);
      } else {
        archive.Materials.push(view);
      }
    }

    for (let collection of Object.values(archive.BookCollections)) {
      sort(collection.Books, 'BookCodex.SortOrder');
    }

    return archive;
  }

  public async selectArchive(loadConf: ReadableLoadConf = {}): Promise<ReadableArchive> {
    const documents = await this.selectAllDocument();
    const readables = await documents.asyncMap(async document => this.select(document, loadConf));
    return this.generateArchive(readables.filter(x => !!x));
  }
  // endregion
}
