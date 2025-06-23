<template>
  <template v-if="material">
    <section class="card">
      <h2>
        <span class="dispBlock" style="margin-top:-5px"><a role="button" class="secondary fontWeight600" style="font-size:14px;padding:3px 8px" href="/genshin/items">Back to items search</a></span>
        <span class="valign spacer10-top">
          <img class="framed-icon x36" :src="material.IconUrl" loading="lazy" decoding="async" />
          <span class="spacer15-left">{{ material.NameText }}</span>
          <span class="grow"></span>
          <a :href="material.DownloadIconUrl" role="button" class="primary primary--2 small valign">
            <Icon name="download" :size="17" :props="{class: 'spacer5-right'}" /> Download icon for wiki</a>
        </span>
      </h2>
      <div class="content">
        <table class="article-table">
          <tr>
            <td style="width:150px" class="bold">ID</td>
            <td>{{ String(material.Id).padStart(6, '0') }}</td>
            <td rowspan="2" style="width:100px">
              <div class="fr">
                <GenshinItem :item="material" :no-name="true" :no-count="true" :no-link="true" />
              </div>
            </td>
          </tr>
          <tr>
            <td class="bold">Name</td>
            <td>{{ normGenshinText(material.NameText) }}</td>
          </tr>
          <tr>
            <td class="bold">Description</td>
            <td colspan="2">
              <div class="posRel spacer5-top">
                <div style="padding-right:50px;">
                  <Wikitext id="item-desc" :value="normGenshinText(material.DescText)" :seamless="true" />
                </div>
                <button class="secondary small posAbs" ui-action="copy: #item-desc"
                        style="right: 0; top: 0;"
                        ui-tippy-hover="Click to copy to clipboard"
                        ui-tippy-flash="{content:'Copied!', delay: [0,2000]}">Copy</button>
              </div>
            </td>
          </tr>
          <tr v-if="material.EffectDescText">
            <td class="bold">Effect Desc.</td>
            <td colspan="2">
              <div class="posRel spacer5-top">
                <div style="padding-right:50px;">
                  <Wikitext id="item-effect-desc" :value="normGenshinText(material.EffectDescText)" :seamless="true" />
                </div>
                <button class="secondary small posAbs" ui-action="copy: #item-effect-desc"
                        style="right: 0; top: 0;"
                        ui-tippy-hover="Click to copy to clipboard"
                        ui-tippy-flash="{content:'Copied!', delay: [0,2000]}">Copy</button>
              </div>
            </td>
          </tr>
          <tr>
            <td class="bold">Quality</td>
            <td colspan="2">
              <div class="valign">
                <code class="spacer10-right">{{ material.RankLevel || 0 }}</code>
                <GenshinStars :quality="material.RankLevel || 0" />
              </div>
            </td>
          </tr>
          <tr v-if="material.PicPath && material.PicPath.length">
            <td class="bold">Other Images</td>
            <td colspan="2">
              <div v-for="pic of material.PicPath">
                <img :src="`/images/genshin/${pic}.png`" style="max-height:74px" loading="lazy"
                     decoding="async" />
              </div>
            </td>
          </tr>
          <tr>
            <td class="bold">Item Type</td>
            <td colspan="2"><code>{{ material.WikiTypeDescText }}</code></td>
          </tr>
          <tr v-if="material.LoadedItemUse && Object.keys(material.LoadedItemUse).length">
            <td class="bold">Item Use</td>
            <td colspan="2">
              <template v-if="material.LoadedItemUse.Furniture">
                <GenshinItem :item="material.LoadedItemUse.Furniture" />
              </template>
              <span v-if="material.LoadedItemUse.FurnitureSet">
                <span>Unlock furnishing set:&nbsp;</span>
                <a :href="`/genshin/furnishing-sets/${material.LoadedItemUse.FurnitureSet.SuiteId}`">{{ material.LoadedItemUse.FurnitureSet.SuiteNameText }}</a>
              </span>
            </td>
          </tr>
          <tr>
            <td class="bold">Quick Jump</td>
            <td colspan="2">
              <ul class="dispFlex flexWrap">
                <li v-if="readable" class="w33p"><a href="#readable-text">Readable Text</a></li>
                <li v-if="material.Codex && material.Codex.DescText" class="w33p"><a href="#archive-text">Archive Text</a></li>
                <li v-if="material.Relations.Combine?.length" class="w33p"><a href="#crafting">Crafting</a></li>
                <li v-if="material.Relations.Compound?.length" class="w33p"><a href="#processing">Processing</a></li>
                <li v-if="material.Relations.CookRecipe?.length" class="w33p"><a href="#cooking">Cooking</a></li>
                <li v-if="material.Relations.CookBonus?.length" class="w33p"><a href="#special-food-recipe">Special Food Recipe</a></li>
                <li v-if="material.Relations.Forge?.length" class="w33p"><a href="#forging">Forging</a></li>
                <li v-if="ol" class="w33p"><a href="#ol">Other Languages</a></li>
                <li class="w33p"><a href="#raw-json">Raw JSON</a></li>
              </ul>
            </td>
          </tr>
        </table>
      </div>
    </section>
    <section v-if="readable" id="readable-text" class="card">
      <h2 class="valign">
        <span class="expando spacer5-right" ui-action="expando: #readable-text-content"><Icon name="chevron-down" :size="17" /></span>
        <span>Readable Text</span>
        <span class="grow"></span>
        <a class="valign fontWeight500" :href="`/genshin/readables/item/${material.Id}`" style="font-size:18px" target="_blank">
          <span class="spacer5-right" style="font-size:15px">Readable</span><Icon name="external-link" :size="16" />
        </a>
      </h2>
      <div id="readable-text-content" class="content">
        <ReadableTexts :readable="readable" />
      </div>
    </section>
    <section v-if="material.Codex && material.Codex.DescText" id="archive-text" class="card">
      <h2 class="valign">
        <span class="expando spacer5-right" ui-action="expando: #archive-text-content"><Icon name="chevron-down" :size="17" /></span>
        <span>Archive Text{{ material.Codex.NameText ? ': ' + normGenshinText(material.Codex.NameText) : '' }}</span>
      </h2>
      <div id="archive-text-content" class="content">
        <Wikitext :value="normGenshinText(material.Codex.DescText)" />
      </div>
    </section>
    <section v-if="material.Relations.Combine?.length" id="crafting" class="card">
      <h2 class="valign">
        <span class="expando spacer5-right" ui-action="expando: #crafting-content"><Icon name="chevron-down" :size="17" /></span>
        Crafting
      </h2>
      <div id="crafting-content">
        <template v-for="(relation, idx) of material.Relations.Combine">
          <h3 class="secondary-header valign">
            <span>Recipe #{{ relation.RelationId }}</span>
            <span class="grow"></span>
            <small>Role ID: <strong>{{ relation.RoleId }}</strong></small>
            <small class="spacer15-left">Role Type: <strong>{{ relation.RoleType }}</strong></small>
          </h3>
          <div class="content alignStart">
            <template v-for="inputItem of relation.RelationData.MaterialItems">
              <GenshinItem :item="inputItem.Material" :item-count="inputItem.Count" />
            </template>
            <div class="material-sep"><Icon name="chevron-right" :size="28" /></div>
            <template v-if="relation.RelationData.ResultItem">
              <GenshinItem :item="relation.RelationData.ResultItem" :item-count="relation.RelationData.ResultItemCount" />
            </template>
          </div>
          <template v-if="Array.isArray(relation.RecipeWikitext)">
            <template v-for="(recipeWikitext, recipeIdx) of relation.RecipeWikitext">
              <div class="content">
                <div class="posRel">
                  <Wikitext :id="'crafting-recipe-' + idx + '-' + recipeIdx" :value="recipeWikitext" />
                  <button class="secondary small posAbs" :ui-action="`copy: #crafting-recipe-${idx}-${recipeIdx}`"
                          style="right: 0; top: 0;"
                          ui-tippy-hover="Click to copy to clipboard"
                          ui-tippy-flash="{content:'Copied!', delay: [0,2000]}">Copy</button>
                </div>
              </div>
            </template>
          </template>
          <hr>
        </template>
      </div>
    </section>
    <section v-if="material.Relations.Compound?.length" id="processing" class="card">
      <h2 class="valign">
        <span class="expando spacer5-right" ui-action="expando: #processing-content"><Icon name="chevron-down" :size="17" /></span>
        Processing
      </h2>
      <div id="processing-content">
        <template v-for="(relation, idx) of material.Relations.Compound">
          <h3 class="secondary-header valign">
            <span>Recipe #{{ relation.RelationId }}</span>
            <span class="grow"></span>
            <small>Role ID: <strong>{{ relation.RoleId }}</strong></small>
            <small class="spacer15-left">Role Type: <strong>{{ relation.RoleType }}</strong></small>
          </h3>
          <div class="content alignStart">
            <template v-for="inputItem of relation.RelationData.InputVec">
              <GenshinItem :item="inputItem.Material" :item-count="inputItem.Count" />
            </template>
            <div class="material-sep"><Icon name="chevron-right" :size="28" /></div>
            <template v-for="inputItem of relation.RelationData.OutputVec">
              <GenshinItem :item="inputItem.Material" :item-count="inputItem.Count" />
            </template>
          </div>
          <template v-if="Array.isArray(relation.RecipeWikitext)">
            <template v-for="(recipeWikitext, recipeIdx) of relation.RecipeWikitext">
              <div class="content">
                <div class="posRel">
                  <Wikitext :id="'compound-recipe-' + idx + '-' + recipeIdx" :value="recipeWikitext" />
                  <button class="secondary small posAbs" :ui-action="`copy: #compound-recipe-${idx}-${recipeIdx}`"
                          style="right: 0; top: 0;"
                          ui-tippy-hover="Click to copy to clipboard"
                          ui-tippy-flash="{content:'Copied!', delay: [0,2000]}">Copy</button>
                </div>
              </div>
            </template>
          </template>
          <hr>
        </template>
      </div>
    </section>
    <section v-if="material.Relations.CookRecipe?.length" id="cooking" class="card">
      <h2 class="valign">
        <span class="expando spacer5-right" ui-action="expando: #cooking-content"><Icon name="chevron-down" :size="17" /></span>
        Cooking
      </h2>
      <div id="cooking-content">
        <template v-for="(relation, idx) of material.Relations.CookRecipe">
          <h3 class="secondary-header valign">
            <span>Recipe #{{ relation.RelationId }}</span>
            <span class="grow"></span>
            <small>Role ID: <strong>{{ relation.RoleId }}</strong></small>
            <small class="spacer15-left">Role Type: <strong>{{ relation.RoleType }}</strong></small>
          </h3>
          <div class="content alignStart">
            <template v-for="inputItem of relation.RelationData.InputVec">
              <GenshinItem :item="inputItem.Material" :item-count="inputItem.Count" />
            </template>
            <div class="material-sep"><Icon name="chevron-right" :size="28" /></div>
            <template v-for="inputItem of relation.RelationData.QualityOutputVec">
              <GenshinItem :item="inputItem.Material" :item-count="inputItem.Count" />
            </template>
          </div>
          <template v-if="Array.isArray(relation.RecipeWikitext)">
            <template v-for="(recipeWikitext, recipeIdx) of relation.RecipeWikitext">
              <div class="content">
                <div class="posRel">
                  <Wikitext :id="'cook-recipe-' + idx + '-' + recipeIdx" :value="recipeWikitext" />
                  <button class="secondary small posAbs" :ui-action="`copy: #cook-recipe-${idx}-${recipeIdx}`"
                          style="right: 0; top: 0;"
                          ui-tippy-hover="Click to copy to clipboard"
                          ui-tippy-flash="{content:'Copied!', delay: [0,2000]}">Copy</button>
                </div>
              </div>
            </template>
          </template>
          <hr>
        </template>
      </div>
    </section>
    <section v-if="material.Relations.CookBonus?.length" id="special-food-recipe" class="card">
      <h2 class="valign">
        <span class="expando spacer5-right" ui-action="expando: #special-food-recipe-content"><Icon name="chevron-down" :size="17" /></span>
        Special Food Recipe
      </h2>
      <div id="special-food-recipe-content">
        <template v-for="(relation, idx) of material.Relations.CookBonus">
          <h3 class="secondary-header valign">
            <span>Recipe #{{ relation.RelationId }}</span>
            <span class="grow"></span>
            <small>Role ID: <strong>{{ relation.RoleId }}</strong></small>
            <small class="spacer15-left">Role Type: <strong>{{ relation.RoleType }}</strong></small>
          </h3>
          <div class="content">
            <p>Instead of receiving <strong>{{ relation.RelationData.RecipeOrdinaryResult?.Material?.NameText || '(SACCHAROSE MAPPING ERROR)' }}</strong>,
              when cooked with <strong>{{ relation.RelationData.Avatar?.NameText || '(SACCHAROSE MAPPING ERROR)' }}</strong>, there is a chance
              of receiving <strong>{{ relation.RelationData.ResultItem?.NameText || '(SACCHAROSE MAPPING ERROR)' }}</strong> instead.</p>
          </div>
          <div class="content alignStart">
            <template v-for="inputItem of relation.RelationData.Recipe.InputVec">
              <GenshinItem :item="inputItem.Material" :item-count="inputItem.Count" />
            </template>
            <div class="material-sep"><Icon name="user-check" :size="22" /></div>
            <GenshinItem :item="relation.RelationData.Avatar" :no-link="true" />
            <div class="material-sep"><Icon name="chevron-right" :size="28" /></div>
            <template v-if="relation.RelationData.RecipeOrdinaryResult">
              <GenshinItem :item="relation.RelationData.RecipeOrdinaryResult.Material" :item-count="relation.RelationData.RecipeOrdinaryResult.Count" />
            </template>
            <div class="material-sep"><Icon name="repeat" :size="22" /></div>
            <template v-if="relation.RelationData.ResultItem">
              <GenshinItem :item="relation.RelationData.ResultItem" :item-count="1" />
            </template>
          </div>
          <hr>
        </template>
      </div>
    </section>
    <section v-if="material.Relations.Forge?.length" id="forging" class="card">
      <h2 class="valign">
        <span class="expando spacer5-right" ui-action="expando: #forging-content"><Icon name="chevron-down" :size="17" /></span>
        Forging
      </h2>
      <div id="forging-content">
        <template v-for="(relation, idx) of material.Relations.Forge">
          <h3 class="secondary-header valign">
            <span>Recipe #{{ relation.RelationId }}</span>
            <span class="grow"></span>
            <small>Role ID: <strong>{{ relation.RoleId }}</strong></small>
            <small class="spacer15-left">Role Type: <strong>{{ relation.RoleType }}</strong></small>
          </h3>
          <div class="content alignStart">
            <template v-for="inputItem of relation.RelationData.MaterialItems">
              <GenshinItem :item="inputItem.Material" :item-count="inputItem.Count" />
            </template>
            <div class="material-sep"><Icon name="chevron-right" :size="28" /></div>
            <template v-if="relation.RelationData.ResultItem">
              <GenshinItem :item="relation.RelationData.ResultItem" :item-count="relation.RelationData.ResultItemCount" />
            </template>
          </div>
          <template v-if="Array.isArray(relation.RecipeWikitext)">
            <template v-for="(recipeWikitext, recipeIdx) of relation.RecipeWikitext">
              <div class="content">
                <div class="posRel">
                  <Wikitext :id="'forge-recipe-' + idx + '-' + recipeIdx" :value="recipeWikitext" />
                  <button class="secondary small posAbs" :ui-action="`copy: #forge-recipe-${idx}-${recipeIdx}`"
                          style="right: 0; top: 0;"
                          ui-tippy-hover="Click to copy to clipboard"
                          ui-tippy-flash="{content:'Copied!', delay: [0,2000]}">Copy</button>
                </div>
              </div>
            </template>
          </template>
          <hr>
        </template>
      </div>
    </section>
    <section v-if="ol" id="ol" class="card">
      <h2 class="valign">
        <span class="expando spacer5-right" ui-action="expando: #ol-content"><Icon name="chevron-down" :size="17" /></span>
        <span>OL</span>
        <span class="grow"></span>
        <button class="secondary small" ui-action="copy: #ol-textarea"
                ui-tippy-hover="Click to copy to clipboard"
                ui-tippy-flash="{content:'Copied!', delay: [0,2000]}">Copy</button>
      </h2>
      <div id="ol-content" class="content">
        <textarea id="ol-textarea" readonly class="ol-result-textarea w100p wikitext autosize" spellcheck="false" translate="no">{{ ol.result }}</textarea>
      </div>
    </section>
    <section id="raw-json" class="card">
      <h2 class="valign">
        <span class="expando spacer5-right expand-action collapsed-state" ui-action="expando: #json-outer"><Icon name="chevron-down" :size="17" /></span>
        Raw JSON
      </h2>
      <div id="json-outer" class="content collapsed hide">
        <textarea class="code json w100p autosize" spellcheck="false" style="max-width:792px"
                  translate="no">{{ JSON.stringify(material, null, 2) }}</textarea>
      </div>
    </section>
  </template>
  <section v-else class="card">
    <h2>Item not found.</h2>
  </section>
</template>

<script setup lang="ts">
import { MaterialExcelConfigData } from '../../../../shared/types/genshin/material-types.ts';
import { Readable } from '../../../../shared/types/genshin/readable-types.ts';
import { OLResult } from '../../../domain/abstract/basic/OLgen.ts';
import Icon from '../../utility/Icon.vue';
import GenshinItem from '../links/GenshinItem.vue';
import { getTrace } from '../../../middleware/request/tracer.ts';
import GenshinStars from '../links/GenshinStars.vue';
import Wikitext from '../../utility/Wikitext.vue';
import ReadableTexts from '../readables/partials/ReadableTexts.vue';

const { normGenshinText } = getTrace();

defineProps<{
  title?: string,
  material?: MaterialExcelConfigData,
  readable?: Readable,
  ol?: OLResult
}>();
</script>

