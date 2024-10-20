// noinspection PointlessArithmeticExpressionJS

import '../../../loadenv.ts';
import sharp from 'sharp';
import colorspace from 'color-space';
import UPNG from 'upng-js';
import { IMAGEDIR_GENSHIN_EXT, IMAGEDIR_GENSHIN_STATIC } from '../../../loadenv.ts';
import path from 'path';
import { cached } from '../../../util/cache.ts';

async function getDeliciousCompositeBuffer(): Promise<Buffer> {
  return cached('Genshin:UI_CookIcon_Delicious', 'buffer', async () => {
    const filePath = path.resolve(IMAGEDIR_GENSHIN_STATIC, './UI_CookIcon_Delicious.png');
    return await sharp(filePath).toBuffer();
  });
}

export async function convertFoodImageToDelicious(imageNameOrBuffer: string|Buffer): Promise<Buffer> {
  if (typeof imageNameOrBuffer === 'string') {
    if (imageNameOrBuffer.includes('/') || imageNameOrBuffer.includes('\\') || !imageNameOrBuffer.endsWith('.png')) {
      return null;
    }
  }
  const filePathOrBuffer: string|Buffer = typeof imageNameOrBuffer === 'string'
    ? path.resolve(IMAGEDIR_GENSHIN_EXT, + './' + imageNameOrBuffer)
    : imageNameOrBuffer;
  return await sharp(filePathOrBuffer).composite([
    {
      input: await getDeliciousCompositeBuffer(),
      blend: 'over'
    }
  ]).toBuffer();
}

/**
 * Algorithm:
 *
 * 1. Load food icon image into Photoshop or Photopea
 * 2. Create a new layer above the food icon layer
 * 3. Fill the new layer entirely with solid black (`#000`)
 * 4. Enable "Clipping Mask" on the new layer
 * 4. Edit the new layer's blending options and set the blend mode to "color" and the opacity to 50%
 *
 * https://en.wikipedia.org/wiki/Blend_modes#Hue,_saturation_and_luminosity
 *
 * > The Color blend mode preserves the luma of the bottom layer, while adopting the hue and chroma of the top layer.
 */
export async function convertFoodImageToSuspicious(imageNameOrBuffer: string|Buffer) {
  if (typeof imageNameOrBuffer === 'string') {
    if (imageNameOrBuffer.includes('/') || imageNameOrBuffer.includes('\\') || !imageNameOrBuffer.endsWith('.png')) {
      return null;
    }
  }

  // Get file buffer:
  const fileBuffer: Buffer = typeof imageNameOrBuffer === 'string'
    ? await sharp(path.resolve(IMAGEDIR_GENSHIN_EXT, + './' + imageNameOrBuffer)).toBuffer()
    : imageNameOrBuffer;

  // Decode the image:
  let png: UPNG.Image = UPNG.decode(fileBuffer);

  // Convert to 8bit array:
  let frames: ArrayBuffer[] = UPNG.toRGBA8(png);

  // Create the top layer (50% opacity black at RGB rather than RGBA)
  const [_composite_l, composite_c, composite_h] = colorspace.rgb.lchab([128, 128, 128]);

  // Loop over frames in the PNG:
  for (let frame of frames) {
    // byte length is: width * height * 4
    // each pixel has 4 bytes for 4 channels (r, g, b, a)
    const byteLength: number = frame.byteLength;

    const dataView: DataView = new DataView(frame, 0);

    // Every 4 bytes is for one pixel:
    for (let byteOffset = 0; byteOffset < byteLength; byteOffset += 4) {
      // Get the RGBA for this pixel:
      const r: number = dataView.getUint8(byteOffset + 0);
      const g: number = dataView.getUint8(byteOffset + 1);
      const b: number = dataView.getUint8(byteOffset + 2);
      const a: number = dataView.getUint8(byteOffset + 3);

      // From wikipedia: The Color blend mode preserves the luma of the bottom layer, while adopting the hue and chroma of the top layer.
      let [l, c, h] = colorspace.rgb.lchab([r, g, b]);
      c = composite_c; // top layer chroma
      h = composite_h; // top layer hue
      // luma of bottom layer is preserved

      // Update the RGBA for this pixel:
      const [r2, g2, b2] = colorspace.lchab.rgb([l, c, h]);
      dataView.setUint8(byteOffset + 0, r2);
      dataView.setUint8(byteOffset + 1, g2);
      dataView.setUint8(byteOffset + 2, b2);
      if (a > 128) {
        dataView.setUint8(byteOffset + 3, 128);
      }
    }
  }

  const resultArrayBuffer: ArrayBuffer = UPNG.encode(frames, png.width, png.height, 0);
  const resultBuffer: Buffer = await sharp(resultArrayBuffer).toBuffer();

  return await sharp(fileBuffer)
    .composite([
      {
        input: resultBuffer,
        blend: 'atop'
      }
    ])
    .toBuffer();
}
