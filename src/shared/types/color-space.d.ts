declare module "color-space" {

// color convertor function type
  export type ColorConverter = (source: number[] | null) => number[] | null;

  export type ColorSpace = {
    /**
     * Space name
     */
    name: string;

    /**
     * Channel minimums
     */
    min: number[];

    /**
     * Channel Maximum
     */
    max: number[];

    /**
     * Channel names
     */
    channel: string[];

    /**
     * Alias space names
     */
    alias: string[];

    // Require conversions to RGB and XYZ
    rgb: ColorConverter;
    xyz: ColorConverter;
  } & {
    // All other converters
    [name: string]: ColorConverter;
  }

  export const rgb: ColorSpace;
  export const hsl: ColorSpace;
  export const hsv: ColorSpace;
  export const hsi: ColorSpace;
  export const hwb: ColorSpace;
  export const cmyk: ColorSpace;
  export const cmy: ColorSpace;
  export const xyz: ColorSpace;
  export const xyy: ColorSpace;
  export const yiq: ColorSpace;
  export const yuv: ColorSpace;
  export const ydbdr: ColorSpace;
  export const ycgco: ColorSpace;
  export const ypbpr: ColorSpace;
  export const ycbcr: ColorSpace;
  export const xvycc: ColorSpace;
  export const yccbccrc: ColorSpace;
  export const ucs: ColorSpace;
  export const uvw: ColorSpace;
  export const jpeg: ColorSpace;
  export const lab: ColorSpace;
  export const labh: ColorSpace;
  export const lms: ColorSpace;
  export const lchab: ColorSpace;
  export const luv: ColorSpace;
  export const lchuv: ColorSpace;
  export const hsluv: ColorSpace;
  export const hpluv: ColorSpace;
  export const cubehelix: ColorSpace;
  export const coloroid: ColorSpace;
  export const hcg: ColorSpace;
  export const hcy: ColorSpace;
  export const tsl: ColorSpace;
  export const yes: ColorSpace;
  export const osaucs: ColorSpace;
  export const hsp: ColorSpace;
}
