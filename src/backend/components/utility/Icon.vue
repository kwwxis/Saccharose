<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { dragHandle, icon } from '../../routing/viewUtilities.ts';
import { FeatherAttributes, FeatherIconNames } from 'feather-icons';
import { toInt } from '../../../shared/util/numberUtil.ts';

export default defineComponent({
  name: 'Icon',
  props: {
    name: { type: String as unknown as PropType<FeatherIconNames|'drag-handle'>, required: true },
    size: { type: Number, required: false },
    class: { type: String, required: false },
    props: { type: Object as PropType<Partial<FeatherAttributes>>, required: false },
  },
  setup(__props, { expose: __expose }) {
    __expose();
    const props = __props;
    const featherProps: Partial<FeatherAttributes> = props.props || {};
    if (props.class) {
      if (featherProps.class) {
        featherProps.class += ' ' + props.class;
      } else {
        featherProps.class = props.class;
      }
    }
    const html = props.name === 'drag-handle' ? dragHandle() : icon(props.name, toInt(props.size), featherProps);
    const __returned__ = { props, html };
    Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
    return __returned__;
  },
  ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
    _push($setup.html);
  }
});
</script>
