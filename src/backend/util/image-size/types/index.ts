// load all available handlers explicitly for browserify support
import { BMP } from './bmp.ts';
import { CUR } from './cur.ts';
import { DDS } from './dds.ts';
import { GIF } from './gif.ts';
import { HEIF } from './heif.ts';
import { ICNS } from './icns.ts';
import { ICO } from './ico.ts';
import { J2C } from './j2c.ts';
import { JP2 } from './jp2.ts';
import { JPG } from './jpg.ts';
import { JXL } from './jxl.ts';
import { JXLStream } from './jxl-stream.ts';
import { KTX } from './ktx.ts';
import { PNG } from './png.ts';
import { PNM } from './pnm.ts';
import { PSD } from './psd.ts';
import { SVG } from './svg.ts';
import { TGA } from './tga.ts';
import { TIFF } from './tiff.ts';
import { WEBP } from './webp.ts';

export const typeHandlers = new Map([
  ['bmp', BMP],
  ['cur', CUR],
  ['dds', DDS],
  ['gif', GIF],
  ['heif', HEIF],
  ['icns', ICNS],
  ['ico', ICO],
  ['j2c', J2C],
  ['jp2', JP2],
  ['jpg', JPG],
  ['jxl', JXL],
  ['jxl-stream', JXLStream],
  ['ktx', KTX],
  ['png', PNG],
  ['pnm', PNM],
  ['psd', PSD],
  ['svg', SVG],
  ['tga', TGA],
  ['tiff', TIFF],
  ['webp', WEBP],
] as const)

export const types = Array.from(typeHandlers.keys())
export type imageType = (typeof types)[number]
