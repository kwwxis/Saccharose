<template>
  <section class="card">
    <h2>Viewpoints</h2>
    <div class="content">
      <fieldset>
        <legend>Sections</legend>
        <div class="content alignStart flexWrap" style="padding-top:0;">
          <template v-for="city of cities">
            <div class="w100p">
              <a role="button" class="spacer5-all secondary dispBlock textAlignLeft"
                 :href="`/genshin/viewpoints/${toParam(city.CityNameTextEN)}`">{{ city.CityNameText }}</a>
            </div>
          </template>
        </div>
      </fieldset>
    </div>
  </section>
  <template v-if="viewpointsList">
    <section class="card">
      <h2>File Format parameter options</h2>
      <div class="content">
        <p>Reload page after changing options to see effect.</p>
        <div class="alignStart spacer15-top flexWrap">
          <FileFormatOptions param-name="image" cookie-name="FileFormat.viewpoint.image"
                             :file-format-params="fileFormatParams" :file-format-default="fileFormatDefault_image" />
          <FileFormatOptions param-name="map" cookie-name="FileFormat.viewpoint.map"
                             :file-format-params="fileFormatParams" :file-format-default="fileFormatDefault_map" />
        </div>
      </div>
    </section>
    <template v-for="[regionName, viewpoints] of entriesOf(viewpointsList)">
      <section class="card" :id="toParam(regionName)">
        <h2>{{ regionName }}</h2>
        <div class="content">
          <div class="card result-count-card">
            <h2>Total: <span>{{ viewpoints.length }}</span></h2>
          </div>
          <p class="error-notice spacer10-bottom">The <code>area</code> and <code>subarea</code> parameter values
            aren't always accurate but the tool tries to figure it out the best it can. Make sure to check it manually in-game.</p>
        </div>
        <template v-for="viewpoint of viewpoints">
          <hr />
          <h3 class="secondary-header">Viewpoint {{ viewpoint.Id }}</h3>
          <div class="viewpoint content" :id="`viewpoint-${viewpoint.Id}`">
            <Wikitext :value="viewpoint.Wikitext" />
            <div class="viewpoint-image spacer15-bottom">
              <a role="button" class="image-loader" ui-action="lazy-image-click"
                 :data-src="`/serve-image/genshin/${viewpoint.Image}.png/${viewpoint.DownloadImage}`"
                 :data-name="viewpoint.DownloadImage"></a>
            </div>
          </div>
        </template>
      </section>
    </template>
  </template>
  <section v-if="citySelected && !viewpointsList" class="card">
    <div class="content">
      <p>Region not found: <b>{{ citySelected }}</b></p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ViewpointsByRegion } from '../../../../shared/types/genshin/viewpoint-types.ts';
import { CityConfigData } from '../../../../shared/types/genshin/general-types.ts';
import { entriesOf } from '../../../../shared/util/arrayUtil.ts';
import { toParam } from '../../../../shared/util/stringUtil.ts';
import Wikitext from '../../utility/Wikitext.vue';
import FileFormatOptions from '../../utility/FileFormatOptions.vue';

defineProps<{
  citySelected?: string,
  cities: CityConfigData[],
  viewpointsList: ViewpointsByRegion,
  fileFormatParams: string,
  fileFormatDefault_image: string,
  fileFormatDefault_map: string,
}>();
</script>
