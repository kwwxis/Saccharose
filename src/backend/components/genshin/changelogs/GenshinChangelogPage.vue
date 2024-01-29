<template>
  <section class="card">
    <h2 class="valign">
      <a href="/changelog" style="text-decoration: none">Changelogs</a>
      <Icon name="chevron-right" />
      <span>{{ genshinVersion.previous }} &ndash; {{ genshinVersion.number }}</span>
    </h2>

    <div id="tablist-changelogAreas" class="tab-list" role="tablist">
      <button id="tab-summary" role="tab" class="tab active" ui-action="tab: #tabpanel-summary, changelogAreas">
        Summary
      </button>
      <button id="tab-byExcels" role="tab" class="tab" ui-action="tab: #tabpanel-byExcels, changelogAreas">
        By Excels
      </button>
    </div>

    <div id="tabpanel-summary" role="tabpanel" aria-labelledby="tab-summary" class="tabpanel active">
      <h3 class="secondary-header valign">
        <span class="expando spacer5-right" ui-action="expando: #new-characters-content"><Icon name="chevron-down" :size="17" /></span>
        New Characters
      </h3>
      <div id="new-characters-content" class="content alignStart flexWrap">
        <div class="alignStart spacer25-right" v-for="avatar of newSummary.avatars">
          <img class="framed-icon x64" :src="`/images/genshin/${avatar.IconName}.png`" loading="lazy" decoding="async" />
          <div class="spacer5-left">
            <strong class="dispBlock">{{ avatar.NameText }}</strong>
            <a class="dispBlock" style="font-size:15px" :href="`/character/stories/${toParam(avatar.NameText)}`">Character Story</a>
            <a class="dispBlock" style="font-size:15px" :href="`/character/companion-dialogue/${toParam(avatar.NameText)}`">Serenitea Pot Dialogue</a>
            <a class="dispBlock" style="font-size:15px" :href="`/character/VO/${toParam(avatar.NameText)}`">Character VO</a>
          </div>
        </div>
      </div>

      <h3 class="secondary-header valign">
        <span class="expando spacer5-right" ui-action="expando: #new-weapons-content"><Icon name="chevron-down" :size="17" /></span>
        New Weapons
      </h3>
      <div id="new-weapons-content" class="content alignStart flexWrap">
        <template v-for="weapon of newSummary.weapons">
          <GenshinItem :item="weapon" />
        </template>
      </div>

      <h3 class="secondary-header valign">
        <span class="expando spacer5-right" ui-action="expando: #new-foods-content"><Icon name="chevron-down" :size="17" /></span>
        New Materials: Foods
      </h3>
      <div id="new-foods-content" class="content alignStart flexWrap">
        <template v-for="food of newSummary.foods">
          <GenshinItem :item="food" />
        </template>
      </div>

      <h3 class="secondary-header valign">
        <span class="expando spacer5-right" ui-action="expando: #new-tcg-materials-content"><Icon name="chevron-down" :size="17" /></span>
        New Materials: TCG
      </h3>
      <div id="new-tcg-materials-content" class="content alignStart flexWrap">
        <template v-for="item of newSummary.tcgItems">
          <GenshinItem :item="item" />
        </template>
      </div>

      <h3 class="secondary-header valign">
        <span class="expando spacer5-right" ui-action="expando: #new-blueprints-content"><Icon name="chevron-down" :size="17" /></span>
        New Materials: Blueprints
      </h3>
      <div id="new-blueprints-content" class="content alignStart flexWrap">
        <template v-for="item of newSummary.blueprints">
          <GenshinItem :item="item" />
        </template>
      </div>

      <h3 class="secondary-header valign">
        <span class="expando spacer5-right" ui-action="expando: #new-avatar-material-content"><Icon name="chevron-down" :size="17" /></span>
        New Materials: Avatar Items, Constellations, &amp; Namecards
      </h3>
      <div id="new-avatar-material-content" class="content alignStart flexWrap">
        <template v-for="item of newSummary.avatarItems">
          <GenshinItem :item="item" />
        </template>
      </div>

      <h3 class="secondary-header valign">
        <span class="expando spacer5-right" ui-action="expando: #new-items-content"><Icon name="chevron-down" :size="17" /></span>
        New Materials: Items
      </h3>
      <div id="new-items-content" class="content alignStart flexWrap">
        <template v-for="item of newSummary.items">
          <GenshinItem :item="item" />
        </template>
      </div>

      <h3 class="secondary-header valign">
        <span class="expando spacer5-right" ui-action="expando: #new-artifacts-content"><Icon name="chevron-down" :size="17" /></span>
        New Artifacts
      </h3>
      <div id="new-artifacts-content" class="content alignStart flexWrap">
        <p>Artifacts not implemented by Saccharose at this time.</p>
      </div>

      <h3 class="secondary-header valign">
        <span class="expando spacer5-right" ui-action="expando: #new-furnishings-content"><Icon name="chevron-down" :size="17" /></span>
        New Furnishings
      </h3>
      <div id="new-furnishings-content" class="content alignStart flexWrap">
        <template v-for="item of newSummary.furnishings">
          <GenshinItem :item="item" />
        </template>
      </div>

      <h3 class="secondary-header valign">
        <span class="expando spacer5-right" ui-action="expando: #new-furnishing-sets-content"><Icon name="chevron-down" :size="17" /></span>
        New Furnishing Sets
      </h3>
      <div id="new-furnishing-sets-content" class="content alignStart">
        <div v-if="newSummary.furnishingSets.length" v-for="setList of [
          newSummary.furnishingSets.slice(0, Math.ceil(newSummary.furnishingSets.length / 2)),
          newSummary.furnishingSets.slice(Math.ceil(newSummary.furnishingSets.length / 2))
        ]" class="w50p">
          <div style="padding:0 5px">
            <table class="article-table">
              <tr style="font-size: 14px;text-align: left;line-height: 16px;">
                <th>ID</th>
                <th>Name</th>
                <th>Favors</th>
                <th>Image</th>
              </tr>
              <tr class="furnishing-set-row" v-for="suite of setList" :data-id="suite.SuiteId">
                <td class="code">{{suite.SuiteId}}</td>
                <td style="font-size:15px"><a :href="`/furnishing-sets/${suite.SuiteId}`">{{suite.SuiteNameText}}</a></td>
                <td style="width:180px">
                  <div v-if="!!suite.FavoriteNpcVec?.length" class="dispFlex flexWrap">
                    <template v-for="npc of suite.FavoriteNpcVec">
                      <img class="icon framed-icon x48 spacer3-all" :src="`/images/genshin/${npc.Avatar.IconName}.png`" loading="lazy" decoding="async" />
                    </template>
                  </div>
                </td>
                <td style="width:250px">
                  <img v-if="suite.ItemIcon" class="w100p" style="height:100px;width:auto"
                       :src="`/serve-image/genshin/${suite.ItemIcon}.png/Furnishing Set ${encodeURIComponent(suite.SuiteNameText)} Display.png`"
                       loading="lazy" decoding="async" />
                </td>
              </tr>
            </table>
          </div>
        </div>
      </div>

      <h3 class="secondary-header valign">
        <span class="expando spacer5-right" ui-action="expando: #new-monsters-content"><Icon name="chevron-down" :size="17" /></span>
        New Living Beings: Monsters
      </h3>
      <div id="new-monsters-content">
        <div class="content">
          <p>May contain special variants of enemies with the same name as an already existing enemy.</p>
        </div>
        <div class="content alignStart flexWrap">
          <GenshinLb v-for="monster of newSummary.monsters" :monster="monster" />
        </div>
      </div>

      <h3 class="secondary-header valign">
        <span class="expando spacer5-right" ui-action="expando: #new-wildlife-content"><Icon name="chevron-down" :size="17" /></span>
        New Living Beings: Wildlife
      </h3>
      <div id="new-wildlife-content" class="content alignStart flexWrap">
        <GenshinLb v-for="monster of newSummary.wildlife" :monster="monster" />
      </div>

      <h3 class="secondary-header valign">
        <span class="expando spacer5-right" ui-action="expando: #new-tcg-character-cards-content"><Icon name="chevron-down" :size="17" /></span>
        New TCG Cards: Character Cards
      </h3>
      <div id="new-tcg-character-cards-content" class="content alignStart flexWrap">
        <TcgCard v-for="card of newSummary.tcgCharacterCards" :card="card" />
      </div>

      <h3 class="secondary-header valign">
        <span class="expando spacer5-right" ui-action="expando: #new-tcg-action-cards-content"><Icon name="chevron-down" :size="17" /></span>
        New TCG Cards: Action Cards
      </h3>
      <div id="new-tcg-action-cards-content" class="content alignStart flexWrap">
        <TcgCard v-for="card of newSummary.tcgActionCards" :card="card" />
      </div>

      <h3 class="secondary-header valign">
        <span class="expando spacer5-right" ui-action="expando: #new-tcg-stages-content"><Icon name="chevron-down" :size="17" /></span>
        New TCG Stages
      </h3>
      <div id="new-tcg-stages-content" class="content">
        <table class="article-table" v-if="newSummary.tcgStages.length">
          <tr style="font-size: 14px;text-align: left;line-height: 16px;">
            <th>Icon</th>
            <th>ID</th>
            <th>Character</th>
            <th>Stage</th>
            <th>Internal<br/>Type</th>
            <th>Wiki<br/>Group</th>
            <th>Wiki<br/>Type</th>
          </tr>
          <tr v-for="stage of newSummary.tcgStages" style="font-size:15px">
            <td>
              <img v-if="stage?.Reward?.TalkDetailIcon?.IconName"
                   :src="`/images/genshin/${stage.Reward.TalkDetailIcon.IconName}.png`" class="framed-icon x42" />
            </td>
            <td>
              <span class="code" style="font-size:14px">{{ String(stage.Id).padStart(6, '0') }}</span>
            </td>
            <td>
              <span>{{ stage.WikiCharacter }}</span>
            </td>
            <td>
              <a :href="`/TCG/stages/${String(stage.Id).padStart(6, '0')}`" role="button"
                 class="spacer5-all secondary dispBlock textAlignLeft">{{ stage.WikiLevelName }}</a>
            </td>
            <td>
              <span class="code" style="font-size:14px">{{ stage.LevelType }}</span>
            </td>
            <td>
              <span style="display:inline-block;font-size:14px;line-height:18px;">{{ stage.WikiGroup || 'No Group' }}</span>
            </td>
            <td>
              <span style="display:inline-block;font-size:14px;line-height:18px;">{{ stage.WikiType || 'No Type' }}</span>
            </td>
          </tr>
        </table>
      </div>

      <h3 class="secondary-header valign">
        <span class="expando spacer5-right" ui-action="expando: #new-viewpoints-content"><Icon name="chevron-down" :size="17" /></span>
        New Viewpoints
      </h3>
      <div id="new-viewpoints-content" class="content">
        <table class="article-table" v-if="newSummary.viewpoints.length">
          <tr>
            <th>Title</th>
            <th>Subarea</th>
            <th>Area</th>
            <th>Region</th>
            <th>Text</th>
            <th>Image</th>
          </tr>
          <tr v-for="viewpoint of newSummary.viewpoints" style="font-size:15px">
            <td><a :href="`/viewpoints/${viewpoint.CityNameText}#viewpoint-${viewpoint.Id}`">{{ viewpoint.NameText }}</a></td>
            <td>{{ viewpoint.WorldArea.AreaNameText || '' }}</td>
            <td>{{ viewpoint.ParentWorldArea ? viewpoint.ParentWorldArea.AreaNameText : '' }}</td>
            <td>{{ viewpoint.CityNameText }}</td>
            <td><Wikitext :value="viewpoint.DescText ? trace.normGenshinText(viewpoint.DescText) : ''" :seamless="true" /></td>
            <td>
              <img :src="`/serve-image/genshin/${viewpoint.Image}.png/${viewpoint.DownloadImage}`"
                   loading="lazy" decoding="async" style="height:100px" />
            </td>
          </tr>
        </table>
      </div>

      <h3 class="secondary-header valign">
        <span class="expando spacer5-right" ui-action="expando: #new-loading-tips-content"><Icon name="chevron-down" :size="17" /></span>
        New Loading Tips
      </h3>
      <div id="new-loading-tips-content" class="content">
        <table class="article-table" v-if="newSummary.loadingTips.length" style="font-size:15px">
          <tr>
            <th>Title</th>
            <th>Description</th>
            <th>Enabled by</th>
            <th>Disabled by</th>
          </tr>
          <tr v-for="tip of newSummary.loadingTips">
            <td>{{ tip.TipsTitleText }}</td>
            <td><Wikitext :value="tip.TipsDescText" :seamless="true" /></td>
            <td><a v-if="tip.EnableMainQuestName" :href="`/quests/${tip.EnableMainQuestId}`">{{ tip.EnableMainQuestName }}</a></td>
            <td><a v-if="tip.DisableMainQuestName" :href="`/quests/${tip.DisableMainQuestId}`">{{ tip.DisableMainQuestName }}</a></td>
          </tr>
        </table>
      </div>

      <h3 class="secondary-header valign">
        <span class="expando spacer5-right" ui-action="expando: #new-achievements-content"><Icon name="chevron-down" :size="17" /></span>
        New Achievements
      </h3>
      <div id="new-achievements-content" class="content">
        <table class="article-table" v-if="newSummary.achievements.length" style="font-size:15px">
          <tr>
            <th>ID</th>
            <th>Title</th>
            <th>Description</th>
            <th>Category</th>
            <th>Primogems</th>
          </tr>
          <tr v-for="achievement of newSummary.achievements">
            <td class="code"><a :href="`/achievements/${achievement.Id}`">{{ achievement.Id }}</a></td>
            <td><a :href="`/achievements/${achievement.Id}`">{{ achievement.TitleText }}</a></td>
            <td><Wikitext :value="achievement.DescText" :seamless="true" /></td>
            <td><a :href="`/achievements/${toParam(achievement.Goal.NameText)}`">{{ achievement.Goal.NameText }}</a></td>
            <td>{{ achievement.FinishReward.RewardSummary.PrimogemCount }}</td>
          </tr>
        </table>
      </div>

      <h3 class="secondary-header valign">
        <span class="expando spacer5-right" ui-action="expando: #new-tutorials-content"><Icon name="chevron-down" :size="17" /></span>
        New Tutorials
      </h3>
      <div id="new-tutorials-content" class="content">
        <table class="article-table" v-if="newSummary.tutorials.length" style="font-size:15px">
          <tr>
            <th>ID</th>
            <th>Title</th>
            <th>Subtitle</th>
            <th>Wikitext</th>
            <th>Type</th>
            <th>Transclude</th>
            <th>Images</th>
          </tr>
          <tr v-for="tutorial of newSummary.tutorials">
            <td class="code" style="vertical-align: top">{{ tutorial.Id }}</td>
            <td style="vertical-align: top">{{ tutorial.PushTip?.TitleText || '(No title)' }}</td>
            <td style="vertical-align: top">{{ tutorial.PushTip?.SubtitleText || '' }}</td>
            <td style="vertical-align: top"><Wikitext :value="tutorial.Wikitext" :seamless="true" /></td>
            <td style="vertical-align: top"><a :href="`/tutorials/${toParam(tutorial.CodexTypeName)}`">{{ tutorial.CodexTypeName }}</a></td>
            <td style="vertical-align: top">
              <Wikitext v-if="tutorial.PushTip?.TitleText" :value="`{{Tutorial|${tutorial.PushTip.TitleText}}}`" :seamless="true" />
            </td>
            <td style="vertical-align: top">
              <div v-for="image of tutorial.Images">
                <img class="w100p" style="height:100px;width:auto"
                     :src="`/serve-image/genshin/${image.originalName}.png/${image.downloadName}`"
                     loading="lazy" decoding="async" />
              </div>
            </td>
          </tr>
        </table>
      </div>

      <h3 class="secondary-header valign">
        <span class="expando spacer5-right" ui-action="expando: #new-readables-content"><Icon name="chevron-down" :size="17" /></span>
        New Readables
      </h3>
      <div id="new-readables-content">
        <template v-if="Object.values(newSummary.readables.BookCollections).length">
          <h4 class="content" style="padding-bottom:0">Book Collections</h4>
          <div class="content">
            <div class="w100p spacer-top" v-for="collection of Object.values(newSummary.readables.BookCollections)">
              <a class="secondary spacer3-all valign textAlignLeft" role="button" :href="`/readables/book-collection/${collection.Id}`">
                <img class="icon x32" :src="`/images/genshin/${collection.Books[0]?.Material?.Icon}.png`" loading="lazy" decoding="async" />
                <span class="spacer10-left">{{ collection.SuitNameText }}</span>
              </a>
              <div style="padding-left:20px">
                <div class="w100p" v-for="readable of collection.Books">
                  <GenshinReadableLink :readable-view="readable" />
                </div>
              </div>
            </div>
          </div>
        </template>
        <template v-if="newSummary.readables.Materials.filter(v => v?.Material?.MaterialType === 'MATERIAL_QUEST').length">
          <h4 class="content" style="padding-bottom:0">Quest Items</h4>
          <div class="content dispFlex flexWrap alignStart">
            <div class="w50p" v-for="readable of newSummary.readables.Materials.filter(v => v?.Material?.MaterialType === 'MATERIAL_QUEST')">
              <GenshinReadableLink :readable-view="readable" />
            </div>
          </div>
        </template>
        <template v-if="newSummary.readables.Materials.filter(v => v?.Material?.MaterialType === 'MATERIAL_FLYCLOAK').length">
          <h4 class="content" style="padding-bottom:0">Glider Descriptions</h4>
          <div class="content dispFlex flexWrap alignStart">
            <div class="w50p" v-for="readable of newSummary.readables.Materials.filter(v => v?.Material?.MaterialType === 'MATERIAL_FLYCLOAK')">
              <GenshinReadableLink :readable-view="readable" />
            </div>
          </div>
        </template>
        <template v-if="newSummary.readables.Materials.filter(v => v?.Material?.MaterialType === 'MATERIAL_COSTUME').length">
          <h4 class="content" style="padding-bottom:0">Costume Descriptions</h4>
          <div class="content dispFlex flexWrap alignStart">
            <div class="w50p" v-for="readable of newSummary.readables.Materials.filter(v => v?.Material?.MaterialType === 'MATERIAL_COSTUME')">
              <GenshinReadableLink :readable-view="readable" />
            </div>
          </div>
        </template>
        <template v-if="newSummary.readables.Weapons.length">
          <h4 class="content" style="padding-bottom:0">Weapons</h4>
          <div class="content dispFlex flexWrap alignStart">
            <div class="w50p" v-for="readable of newSummary.readables.Weapons">
              <GenshinReadableLink :readable-view="readable" />
            </div>
          </div>
        </template>
        <template v-if="newSummary.readables.Artifacts.length">
          <h4 class="content" style="padding-bottom:0">Artifacts</h4>
          <div class="content dispFlex flexWrap alignStart">
            <div class="w50p" v-for="readable of newSummary.readables.Artifacts">
              <GenshinReadableLink :readable-view="readable" />
            </div>
          </div>
        </template>
      </div>

      <h3 class="secondary-header valign">
        <span class="expando spacer5-right" ui-action="expando: #new-chapters-content"><Icon name="chevron-down" :size="17" /></span>
        New Chapters
      </h3>
      <div id="new-chapters-content">
        <template v-if="Object.keys(newSummary.chapters.AQ).length">
          <h4 class="content" style="padding-bottom:0">New Archon Quest Chapters</h4>
          <div class="content" v-for="entry1 of chapterGroup1('AQ')">
            <div v-for="entry2 of chapterGroup2('AQ', entry1.chapterName)">
              <div class="spacer15-bottom" v-for="chapter of entry2.chapters">
                <a class="secondary spacer3-all valign textAlignLeft" role="button" :href="`/chapters/${chapter.Id}`">
                  <img v-if="chapter.ChapterIcon"
                       :src="`/images/genshin/${chapter.ChapterIcon}.png`" class="spacer10-right" loading="lazy" decoding="async"
                       style="width:48px;height:48px;background:#333;border-radius:50%;border:1px solid #fff;"/>
                  <span>{{ entry1.chapterName }}</span>
                  <span>&nbsp;&mdash;&nbsp;</span>
                  <span>{{ entry2.subChapterName }}</span>
                  <span>&nbsp;&mdash;&nbsp;</span>
                  <template v-if="chapter.Summary.ActNumText">
                    <span>{{ chapter.Summary.ActNumText }}</span>
                    <span>:&nbsp;</span>
                  </template>
                  <strong>{{ chapter.Summary.ActName }}</strong>
                </a>
                <div style="padding-left:72px">
                  <GenshinChapterListItem :quests="chapter.OrderedQuests" />
                </div>
              </div>
            </div>
          </div>
        </template>

        <template v-if="Object.keys(newSummary.chapters.SQ).length">
          <h4 class="content" style="padding-bottom:0">New Story Quest Chapters</h4>
          <div class="content" v-for="entry1 of chapterGroup1('SQ')">
            <div v-for="entry2 of chapterGroup2('SQ', entry1.chapterName)">
              <div class="spacer15-bottom" v-for="chapter of entry2.chapters">
                <a class="secondary spacer3-all valign textAlignLeft" role="button" :href="`/chapters/${chapter.Id}`">
                  <img v-if="chapter.ChapterIcon"
                       :src="`/images/genshin/${chapter.ChapterIcon}.png`" class="spacer10-right" loading="lazy" decoding="async"
                       style="width:48px;height:48px;background:#333;border-radius:50%;border:1px solid #fff;"/>
                  <span>{{ entry1.chapterName }}</span>
                  <span>&nbsp;&mdash;&nbsp;</span>
                  <span>{{ entry2.subChapterName }}</span>
                  <span>&nbsp;&mdash;&nbsp;</span>
                  <template v-if="chapter.Summary.ActNumText">
                    <span>{{ chapter.Summary.ActNumText }}</span>
                    <span>:&nbsp;</span>
                  </template>
                  <strong>{{ chapter.Summary.ActName }}</strong>
                </a>
                <div style="padding-left:72px">
                  <GenshinChapterListItem :quests="chapter.OrderedQuests" />
                </div>
              </div>
            </div>
          </div>
        </template>

        <template v-if="Object.keys(newSummary.chapters.EQ).length">
          <h4 class="content" style="padding-bottom:0">New Event Quest Chapters</h4>
          <div class="content" v-for="(chapters, chapterName) in newSummary.chapters.EQ">
            <div class="spacer15-bottom" v-for="chapter of chapters">
              <a class="secondary spacer3-all valign textAlignLeft" role="button" :href="`/chapters/${chapter.Id}`">
                <img v-if="chapter.ChapterIcon"
                     :src="`/images/genshin/${chapter.ChapterIcon}.png`" class="spacer10-right" loading="lazy" decoding="async"
                     style="width:48px;height:48px;background:#333;border-radius:50%;border:1px solid #fff;"/>
                <span>{{ chapterName }}</span>
                <span>&nbsp;&mdash;&nbsp;</span>
                <template v-if="chapter.Summary.ActNumText">
                  <span>{{ chapter.Summary.ActNumText }}</span>
                  <span>:&nbsp;</span>
                </template>
                <strong>{{ chapter.Summary.ActName }}</strong>
              </a>
              <div style="padding-left:72px">
                <GenshinChapterListItem :quests="chapter.OrderedQuests" />
              </div>
            </div>
          </div>
        </template>

        <template v-if="Object.keys(newSummary.chapters.WQ).length">
          <h4 class="content" style="padding-bottom:0">New World Quest Chapters</h4>
          <div class="content" v-for="(chapters, chapterName) in newSummary.chapters.WQ">
            <div class="spacer15-bottom" v-for="chapter of chapters">
              <a class="secondary spacer3-all valign textAlignLeft" role="button" :href="`/chapters/${chapter.Id}`">
                <img v-if="chapter.ChapterIcon"
                     :src="`/images/genshin/${chapter.ChapterIcon}.png`" class="spacer10-right" loading="lazy" decoding="async"
                     style="width:48px;height:48px;background:#333;border-radius:50%;border:1px solid #fff;"/>
                <span>{{ chapterName }}</span>
                <span>&nbsp;&mdash;&nbsp;</span>
                <template v-if="chapter.Summary.ActNumText">
                  <span>{{ chapter.Summary.ActNumText }}</span>
                  <span>:&nbsp;</span>
                </template>
                <strong>{{ chapter.Summary.ActName }}</strong>
              </a>
              <div style="padding-left:72px">
                <GenshinChapterListItem :quests="chapter.OrderedQuests" />
              </div>
            </div>
          </div>
        </template>
      </div>

      <h3 class="secondary-header valign">
        <span class="expando spacer5-right" ui-action="expando: #new-non-chapter-quests-content"><Icon name="chevron-down" :size="17" /></span>
        New Non-Chapter Quests
      </h3>
      <div id="new-non-chapter-quests-content" class="content">
        <div v-for="mainQuest of newSummary.quests.filter(mq => !!mq.TitleText)">
          <a class="secondary dispBlock spacer5-bottom textAlignLeft" role="button" :href="`/quests/${mainQuest.Id}`">
            <strong>ID {{ mainQuest.Id }} {{ mainQuest.Type }}:&nbsp;</strong>
            <span>{{ mainQuest.TitleText }}</span>
          </a>
        </div>
      </div>

      <h3 class="secondary-header valign">
        <span class="expando spacer5-right" ui-action="expando: #new-internal-quests-content"><Icon name="chevron-down" :size="17" /></span>
        Internal Quests
      </h3>
      <div id="new-internal-quests-content" class="content">
        <div v-for="mainQuest of newSummary.quests.filter(mq => !mq.TitleText)">
          <a class="secondary dispBlock spacer5-bottom textAlignLeft" role="button" :href="`/quests/${mainQuest.Id}`">
            <strong>ID {{ mainQuest.Id }}:&nbsp;</strong>
            <span>(No title)</span>
          </a>
        </div>
      </div>
    </div>

    <div id="tabpanel-byExcels" role="tabpanel" aria-labelledby="tab-byExcels" class="tabpanel hide">
      <template v-for="excelFileChanges of sort(Object.values(fullChangelog.excelChangelog), 'name')">
        <h3 class="secondary-header valign">{{ excelFileChanges.name }}</h3>
        <div class="content">
          <dl>
            <dt>Added records</dt>
            <dd>{{ Object.values(excelFileChanges.changedRecords).filter(r => r.changeType === 'added').length }}</dd>
            <dt>Updated records</dt>
            <dd>{{ Object.values(excelFileChanges.changedRecords).filter(r => r.changeType === 'updated').length }}</dd>
            <dt>Removed records</dt>
            <dd>{{ Object.values(excelFileChanges.changedRecords).filter(r => r.changeType === 'removed').length }}</dd>
            <dt>
              <a role="button" class="secondary spacer5-top" :href="`/changelog/${genshinVersion.number}/${excelFileChanges.name}`">Browse records</a>
            </dt>
            <dd><!-- intentionally empty --></dd>
          </dl>
        </div>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import { sort } from '../../../../shared/util/arrayUtil.ts';
import { GameVersion } from '../../../../shared/types/game-versions.ts';
import { FullChangelog } from '../../../../shared/types/changelog-types.ts';
import Icon from '../../utility/Icon.vue';
import { GenshinChangelogNewRecordSummary } from '../../../domain/genshin/changelog/genshinChangelogHelpers.ts';
import { toParam } from '../../../../shared/util/stringUtil.ts';
import GenshinItem from '../../utility/GenshinItem.vue';
import GenshinLb from '../../utility/GenshinLb.vue';
import TcgCard from '../../utility/TcgCard.vue';
import { getTrace } from '../../../middleware/request/tracer.ts';
import Wikitext from '../../utility/Wikitext.vue';
import GenshinReadableLink from '../../utility/GenshinReadableLink.vue';
import { ChapterExcelConfigData } from '../../../../shared/types/genshin/quest-types.ts';
import GenshinChapterListItem from '../chapters/GenshinChapterListItem.vue';

const {newSummary} = defineProps<{
  genshinVersion: GameVersion,
  fullChangelog: FullChangelog,
  newSummary: GenshinChangelogNewRecordSummary,
}>();

const trace = getTrace();

function chapterGroup1(code: 'AQ' | 'SQ'): { chapterName: string, subChapters: {[subChapterName: string]: ChapterExcelConfigData[]} }[] {
  return Object.entries(newSummary.chapters[code]).map(([chapterName, subChapters]) => ({
    chapterName,
    subChapters
  }));
}

function chapterGroup2(code: 'AQ' | 'SQ', chapterName: string): {subChapterName: string, chapters: ChapterExcelConfigData[]}[] {
  return Object.entries(newSummary.chapters[code][chapterName]).map(([subChapterName, chapters]) => ({
    subChapterName,
    chapters
  }));
}
</script>
