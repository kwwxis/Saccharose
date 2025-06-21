import { ImageIndexEntity } from '../../../../shared/types/image-index-types.ts';

export function getByteSizeLabel(entity: ImageIndexEntity): string {
  let imageSizeLabel: string = '';

  if (entity.image_size > 1_000_000_000) {
    imageSizeLabel = (entity.image_size / 1_000_000_000).toFixed(2) + ' GB';
  } else if (entity.image_size > 1_000_000) {
    imageSizeLabel = (entity.image_size / 1_000_000).toFixed(2) + ' MB';
  } else {
    imageSizeLabel = (entity.image_size / 1_000).toFixed(2) + ' KB';
  }

  return imageSizeLabel;
}
