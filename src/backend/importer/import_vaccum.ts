import '../loadenv';
import { openKnex } from '../util/db';

(async () => {
  const knex = openKnex();

  await knex.raw('VACUUM').then();

  await knex.destroy();
})();