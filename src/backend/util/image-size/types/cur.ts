import { ICO } from './ico.ts';
import { readUInt16LE } from './utils.ts';
import { IImage } from '../index.ts';

const TYPE_CURSOR = 2
export const CUR: IImage = {
  validate(input) {
    const reserved = readUInt16LE(input, 0)
    const imageCount = readUInt16LE(input, 4)
    if (reserved !== 0 || imageCount === 0) return false

    const imageType = readUInt16LE(input, 2)
    return imageType === TYPE_CURSOR
  },

  calculate: (input) => ICO.calculate(input),
}
