import feather, { type FeatherAttributes, type FeatherIconNames } from 'feather-icons';
import { rtrim, toString } from './stringUtil.ts';

export type IconProps = Partial<FeatherAttributes & { style: string }>;
export type IconName = FeatherIconNames | CustomIconNames;

export function iconSvg(iconName: IconName): string;
export function iconSvg(iconName: IconName, size: number): string;
export function iconSvg(iconName: IconName, props: IconProps): string;
export function iconSvg(iconName: IconName, size: number, props: IconProps): string;
export function iconSvg(iconName: IconName, props: IconProps, size: number): string;

export function iconSvg(iconName: IconName,
                        sizeOrProps?: number|IconProps,
                        propsOrSize?: number|IconProps): string {
  let size: number = undefined;
  let props: IconProps = {};

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

  if (CUSTOM_ICONS[iconName as CustomIconNames]) {
    const customIcon = CUSTOM_ICONS[iconName as CustomIconNames];
    return `<svg ${customAttrString(customIcon, props)}>${customIcon.content}</svg>`;
  } else {
    return feather.icons[iconName].toSvg(props);
  }
}

function customAttrString(conf: CustomIconConf, props: IconProps): string {
  const finalProps: IconProps = { ... conf.baseProps };

  for (const [key, value] of Object.entries(props)) {
    if (key === 'class') {
      finalProps.class = !!finalProps.class?.length ? `${finalProps.class} ${value}` : toString(value);
    } else if (key === 'style') {
      finalProps.style = !!finalProps.style?.length ? `${rtrim(finalProps.style, '; ')}; ${value}` : toString(value);
    } else {
      finalProps[key] = value;
    }
  }

  return Object.entries(finalProps)
    .map(([k, v]) => `${k}="${v}"`)
    .join(' ');
}

type CustomIconConf = {
  baseProps: Record<string, string>;
  content: string;
}

type CustomIconNames = 'drag-handle' | 'translate';

const CUSTOM_ICONS: Record<CustomIconNames, CustomIconConf> = {
  'drag-handle': {
    baseProps: {
      'class': 'icon icon-drag-handle',
      'xmlns': 'http://www.w3.org/2000/svg',
      'x': '0px',
      'y': '0px',
      'viewBox': '0 0 512 512',
      'xml:space': 'preserve',
    },
    content: `
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
      </g>`
  },
  'translate': {
    baseProps: {
      'class': 'icon icon-translate',
      'xmlns': 'http://www.w3.org/2000/svg',
      'stroke-width': '1.5',
      'viewBox': '0 0 512 512',
      'fill': 'none',
    },
    content: `
      <path d="M2 5H9M16 5H13.5M9 5L13.5 5M9 5V3M13.5 5C12.6795 7.73513 10.9612 10.3206 9 12.5929M4 17.5C5.58541 16.1411 7.376 14.4744 9 12.5929M9 12.5929C8 11.5 6.4 9.3 6 8.5M9 12.5929L12 15.5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M13.5 21L14.6429 18M21.5 21L20.3571 18M14.6429 18L17.5 10.5L20.3571 18M14.6429 18H20.3571" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>`
  }
};

