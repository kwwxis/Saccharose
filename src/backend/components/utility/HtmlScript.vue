<script lang="ts">
import { defineComponent } from 'vue';
import createHtmlElement from 'create-html-element';
import { cleanEmpty } from '../../../shared/util/arrayUtil.ts';

export default defineComponent({
  name: 'HtmlScript',
  props: {
    content: { type: String, required: false },

    id: { type: String, required: false },
    async: { type: Boolean, required: false },
    blocking: { type: Boolean, required: false },
    crossorigin: { type: Boolean, required: false },
    defer: { type: Boolean, required: false },
    fetchpriority: { type: String, required: false },
    integrity: { type: String, required: false },
    nomodule: { type: String, required: false },
    nonce: { type: String, required: false },
    referrerpolicy: { type: String, required: false },
    src: { type: String, required: false },
    type: { type: String, required: false },
  },
  setup(__props, { expose: __expose }) {
    __expose();
    const props = __props;
    const html = createHtmlElement(cleanEmpty({
      name: 'script',
      attributes: cleanEmpty({
        id: props.id,
        async: props.async,
        blocking: props.blocking,
        crossorigin: props.crossorigin,
        defer: props.defer,
        fetchpriority: props.fetchpriority,
        integrity: props.integrity,
        nomodule: props.nomodule,
        nonce: props.nonce,
        referrerpolicy: props.referrerpolicy,
        src: props.src,
        type: props.type
      }),
      html: props.content,
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
