import { openPgSite } from '../../../util/db.ts';
import { isUnset } from '../../../../shared/util/genericUtil.ts';

export function giImageHashToContainerId(imageHash: string|number|bigint) {
  if (isUnset(imageHash) || imageHash === 0) {
    return 0;
  }
  if (typeof imageHash === 'string' || typeof imageHash === 'number') {
    imageHash = BigInt(imageHash);
  }

  const mask = 0xFFFFFFFFFFn;

  const result = (imageHash & mask) >> 8n;

  // Convert to signed 32-bit
  const signed = BigInt.asIntN(32, result);
  try {
    return parseInt(signed.toString());
  } catch (e) {
    return 0;
  }
}

export async function giImageHashToImageName(imageHash: string|number|bigint): Promise<string> {
  const containerId: number = giImageHashToContainerId(imageHash);
  if (!containerId) {
    return null;
  }

  const pg = openPgSite();

  return await pg.select('image_name').from('genshin_image_containers')
    .where({ container_id: containerId }).first().then(x => x?.image_name);
}
