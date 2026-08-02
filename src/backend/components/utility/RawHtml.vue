<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'RawHtml',
  props: {
    html: { type: String, required: true },
  },
  setup(__props, { expose: __expose }) {
    __expose();
    const props = __props;
    const html = props.html;
    const __returned__ = { props, html };
    Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
    return __returned__;
  },
  ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
    _push($setup.html);
  }
});
</script>
