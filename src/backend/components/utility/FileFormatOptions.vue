<template>
  <fieldset class="file-format-options spacer10-right"
            :data-param-name="paramName"
            :data-cookie-name="cookieName"
            :data-file-format-default="fileFormatDefault || ''"
            :data-file-format-params="fileFormatParams || ''"
            :data-lang-codes="Object.keys(ctx.languages).join(',')">
    <legend><code>{{ paramName }}</code> parameter</legend>
    <div class="field spacer5-horiz" style="padding-right:30px">
      <label class="ui-radio dispBlock" style="padding-left:5px;font-size:13px;">
        <input type="radio" :name="cookieName" value="default"
               :checked="ctx.cookieTernary(cookieName).equals('default').or.isEmpty().get()" />
        <span>Use English wiki format</span>
      </label>
      <label class="ui-radio dispBlock" style="padding-left:5px;font-size:13px;">
        <input type="radio" :name="cookieName" value="remove"
               :checked="ctx.cookieTernary(cookieName).equals('remove').get()" />
        <span>Remove parameter</span>
      </label>
      <label class="ui-radio dispBlock" style="padding-left:5px;font-size:13px;">
        <input type="radio" :name="cookieName" value="custom"
               :checked="ctx.cookieTernary(cookieName).equals('custom').get()" />
        <span>Use custom format</span>
      </label>
      <div class="file-format-options-custom-format"
           :class="{hide: ctx.cookieTernary(cookieName).notEquals('custom').get()}"
           style="margin-left: 29px;">
        <div class="posRel">
        <textarea :name="cookieName + '.CustomFormat'"
                  placeholder="File format" class="code file-format-options-custom-format-input"
                  style="min-width:450px;min-height:100px;padding-right:25px"
                  :value="ctx.cookie(cookieName + '.CustomFormat')"></textarea>
          <span ui-tippy="{content: 'Click to show options.',delay:[200, 100]}"
                class="file-format-options-custom-format-help-button dispInlineBlock spacer5-left posAbs"
                style="height:16px;width:16px;font-size:0;opacity:0.5;right:5px;top:5px;margin:auto 0;cursor:pointer;">
            <Icon name="info" :size="16" />
          </span>
        </div>
      </div>
    </div>
  </fieldset>
</template>

<script setup lang="ts">
import Icon from './Icon.vue';
import { useTrace } from '../../middleware/request/tracer.ts';
const { ctx } = useTrace();

defineProps<{
  paramName?: string,
  cookieName?: string,
  fileFormatParams?: string,
  fileFormatDefault?: string,
}>()
</script>
