import feather, { FeatherAttributes, FeatherIconNames } from 'feather-icons';
import createHtmlElement from 'create-html-element';
import { isUnset } from '../../shared/util/genericUtil';
import { escapeHtmlAllowEntities } from '../../shared/util/stringUtil';
import { SPRITE_TAGS } from '../domain/genshin/misc/spriteTags';

export function icon(iconName: string, size: number);
export function icon(iconName: string, props: Partial<FeatherAttributes>);
export function icon(iconName: string, size: number, props: Partial<FeatherAttributes>);
export function icon(iconName: string, props: Partial<FeatherAttributes>, size: number);

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

export function printTimestamp(ts: Date|number|string, format=null): string {
  if (ts instanceof Date)
    ts = ts.getTime() / 1000 | 0;
  if (typeof ts !== 'number')
    ts = 'n/a';
  if (!format)
    format = 'MMM DD YYYY hh:mm:ss a';
  return `<span class="timestamp is--formatted is--unconverted" data-timestamp="${ts}" data-format="${format}">${format}</span>`;
}

export function printHumanTiming(ts: Date|number): string {
  if (ts instanceof Date)
    ts = ts.getTime() / 1000 | 0;

  const now = Date.now() / 1000 | 0;

  if (typeof ts !== 'number')
    ts = now;

  let placeholder = ts > now ? 'some time from now' : 'some time ago';

  return `<span class="timestamp is--humanTiming" data-timestamp="${ts}">${placeholder}</span>`;
}

export function toParam(x: any): string {
  if (isUnset(x)) {
    return '';
  }
  x = String(x);
  if (typeof x === 'string') {
    return x.replace(/ /g, '_');
  }
  return x;
}

export function paramCmp(a: any, b: any) {
  if (a === b) {
    return true;
  }
  return String(a).trim().toLowerCase().replace(/_/g, ' ') === String(b).trim().toLowerCase().replace(/_/g, ' ');
}

export function spriteTagIconize(s: string, escapeHtmlFirst: boolean = true) {
  if (escapeHtmlFirst) {
    s = escapeHtmlAllowEntities(s);
  }
  return s.replace(/\{SPRITE_PRESET#(\d+)}/g, (fm: string, g1: string) => {
    let image = SPRITE_TAGS[parseInt(g1)].Image;
    image = image.split('/').pop();
    return `<img src="/images/genshin/${image}.png" class="icon x24" />`;
  });
}