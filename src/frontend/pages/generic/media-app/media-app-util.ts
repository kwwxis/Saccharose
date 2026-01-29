
export function getByteSizeLabel(imageSize: number): string {
  let imageSizeLabel: string = '';

  if (imageSize > 1_000_000_000) {
    imageSizeLabel = (imageSize / 1_000_000_000).toFixed(2) + ' GB';
  } else if (imageSize > 1_000_000) {
    imageSizeLabel = (imageSize / 1_000_000).toFixed(2) + ' MB';
  } else {
    imageSizeLabel = (imageSize / 1_000).toFixed(2) + ' KB';
  }

  return imageSizeLabel;
}
