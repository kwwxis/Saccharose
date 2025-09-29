import { md5 } from '../../../util/hash-util.ts';

export function getGIAssetIndexHash(path: string): string {
  path += ".MiHoYoBinData";

  const length = Buffer.byteLength(path, "utf8");
  const l = 256 * 2 ** Math.floor(length / 256);

  // Zero-filled buffer, equivalent to PHP str_pad(..., chr(0))
  const buf = Buffer.alloc(l);
  buf.write(path, "utf8");

  const hash = md5(buf); // md5 must support Buffer input

  return (
    hash[8] + hash[9] +
    hash[6] + hash[7] +
    hash[4] + hash[5] +
    hash[2] + hash[3]
  );
}

// console.log(getGIAssetIndexHash('Data/_BinOutput/InterAction/QuestDialogue/WQ/NodKrai_0/Q6713303'));
