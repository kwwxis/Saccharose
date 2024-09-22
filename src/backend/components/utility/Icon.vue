<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { dragHandle, icon } from '../../routing/viewUtilities.ts';
import { FeatherAttributes } from 'feather-icons';
import { toInt } from '../../../shared/util/numberUtil.ts';

export default defineComponent({
  name: 'Icon',
  props: {
    name: { type: String, required: true },
    size: { type: Number, required: false },
    props: { type: Object as PropType<Partial<FeatherAttributes>>, required: false },
  },
  setup(__props, { expose: __expose }) {
    __expose();
    const props = __props;
    const html = props.name === 'drag-handle' ? dragHandle() : icon(props.name, toInt(props.size), props.props);
    const __returned__ = { props, html };
    Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
    return __returned__;
  },
  ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
    _push($setup.html);
  }
});
</script>
