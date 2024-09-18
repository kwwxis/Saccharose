<script lang="ts">
import { defineComponent } from 'vue';
import createHtmlElement from 'create-html-element';
import { cleanEmpty } from '../../../shared/util/arrayUtil.ts';

export default defineComponent({
  name: 'HtmlTemplate',
  props: {
    html: { type: String, required: false },
    id: { type: String, required: false }
  },
  setup(__props, { expose: __expose }) {
    __expose();
    const props = __props;
    const html = createHtmlElement(cleanEmpty({
      name: 'template',
      attributes: cleanEmpty({
        id: props.id
      }),
      html: props.html,
    }));
    const __returned__ = { props, html };
    Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
    return __returned__;
  },
  ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
    _push($setup.html);
  }
});
</script>
