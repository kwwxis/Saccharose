import sharp from 'sharp';
import exifReader from 'exif-reader';

export class GenshinContainerDiscriminator {
  static toDiscriminator(containerId: number): string {
    const isNegative: boolean = containerId < 0;
    return (isNegative ? 'n' : '') + Math.abs(containerId).toString(16);
  }
  static toContainerId(discriminator: string): number {
    const isNegative = discriminator.startsWith('n');
    const hexPart = isNegative ? discriminator.slice(1) : discriminator;
    const value = parseInt(hexPart, 16);
    return isNegative ? -value : value;
  }
  static async getDiscriminatorFromExif(myPath: string): Promise<string> {
    const exifBuf = (await sharp(myPath).metadata()).exif;
    const exifData = exifBuf ? exifReader(exifBuf) : null;
    return exifData?.Image?.Model;
  }

}
