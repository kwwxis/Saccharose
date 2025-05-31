import feather, { FeatherAttributes, FeatherIconNames } from 'feather-icons';
import { escapeHtmlAllowEntities } from '../../shared/util/stringUtil.ts';
import { GENSHIN_SPRITE_TAGS } from '../domain/genshin/genshinText.ts';
import { toInt } from '../../shared/util/numberUtil.ts';

export function icon(iconName: string): string;
export function icon(iconName: string, size: number): string;
export function icon(iconName: string, props: Partial<FeatherAttributes>): string;
export function icon(iconName: string, size: number, props: Partial<FeatherAttributes>): string;
export function icon(iconName: string, props: Partial<FeatherAttributes>, size: number): string;

export function icon(iconName: FeatherIconNames, sizeOrProps?: number|Partial<FeatherAttributes>, propsOrSize?: number|Partial<FeatherAttributes>): string {
  let size: number = undefined;
  let props: Partial<FeatherAttributes> = {};

  if (typeof sizeOrProps === 'number') size = sizeOrProps;
  if (typeof propsOrSize === 'number') size = propsOrSize;

  if (typeof sizeOrProps === 'object') props = sizeOrProps;
  if (typeof propsOrSize === 'object') props = propsOrSize;

  props.class = props.class ? (props.class = 'icon ' + props.class) : 'icon';
  if (size) {
    props.width = size;
    props.height = size;
  }
  if ((<any> props).size) {
    props.width = (<any> props).size;
    props.height = (<any> props).size;
    delete (<any> props).size;
  }

  return feather.icons[iconName].toSvg(props);
}

export function dragHandle() {
  return `<svg class="icon icon-drag-handle" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 512 512" xml:space="preserve">
<style type="text/css">
  .st0{fill-rule:evenodd;clip-rule:evenodd;}
</style>
<g>
  <path class="st0" d="M224,448c0,35.22-28.81,64-64,64c-35.22,0-64-28.78-64-64c0-35.19,28.78-64,64-64
    C195.19,384,224,412.81,224,448z M160,192c-35.22,0-64,28.81-64,64c0,35.22,28.78,64,64,64c35.19,0,64-28.78,64-64
    C224,220.81,195.19,192,160,192z M160,0c-35.22,0-64,28.81-64,64c0,35.22,28.78,64,64,64c35.19,0,64-28.78,64-64
    C224,28.81,195.19,0,160,0z M352,128c35.19,0,64-28.78,64-64c0-35.19-28.81-64-64-64c-35.22,0-64,28.81-64,64
    C288,99.22,316.78,128,352,128z M352,192c-35.22,0-64,28.81-64,64c0,35.22,28.78,64,64,64c35.19,0,64-28.78,64-64
    C416,220.81,387.19,192,352,192z M352,384c-35.22,0-64,28.81-64,64c0,35.22,28.78,64,64,64c35.19,0,64-28.78,64-64
    C416,412.81,387.19,384,352,384z"></path>
</g>
</svg>`;
}

export function genshinSpriteTagIconize(s: string, escapeHtmlFirst: boolean = true) {
  if (escapeHtmlFirst) {
    s = escapeHtmlAllowEntities(s);
  }
  return s.replace(/\{SPRITE_PRESET#(\d+)}/g, (fm: string, g1: string) => {
    let image = GENSHIN_SPRITE_TAGS[toInt(g1)].Image;
    image = image.split('/').pop();
    return `<img src="/images/genshin/${image}.png" class="icon x24" />`;
  });
}
