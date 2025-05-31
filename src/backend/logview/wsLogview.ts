import { wssListen } from '../websocket/wsserver.ts';
import { openPg } from '../util/db.ts';
import { cleanEmpty } from '../../shared/util/arrayUtil.ts';
import { isEmpty } from '../../shared/util/genericUtil.ts';
import { LogViewEntity } from '../../shared/types/site/site-logview-types.ts';
import { filterLogView } from './logview.ts';

wssListen('LogViewRequest', async event => {
  const pg = openPg();
  const data = event.data;

  let builder = pg<LogViewEntity>('site_logview').select('*').where(cleanEmpty({
    log_type: 'access',
    wiki_user: data.byWikiUser,
    discord_user: data.byDiscordUser,
  }));

  if (!isEmpty(data.lowerbound)) {
    builder = builder.where('timestamp', '>=', data.lowerbound);
  }
  if (!isEmpty(data.upperbound)) {
    builder = builder.where('timestamp', '<=', data.upperbound);
  }
  if (!isEmpty(data.byContentQuery)) {
    builder = builder.whereRaw(`content ILIKE '%??%'`, [data.byContentQuery]);
  }

  builder = builder.orderBy('timestamp', 'asc');
  builder = builder.limit(5000);

  let results: LogViewEntity[] = filterLogView(await builder.then());

  if (results.length) {
    event.reply('LogViewLine', {
      lines: results,
      fromRequest: data,
    });
  }
});
