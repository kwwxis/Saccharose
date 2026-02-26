import { giImageHashToImageName } from './domain/genshin/misc/giContainerHash.ts';
import { closeKnex } from './util/db.ts';


console.log(await giImageHashToImageName(12148030755519072392n));
console.log(await giImageHashToImageName(14040972608326749439n));
console.log(await giImageHashToImageName(12392261444407680746n));
console.log(await giImageHashToImageName(99999999999999999999n));

await closeKnex();
