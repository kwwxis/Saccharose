import { wssHandle } from '../websocket/ws-server.ts';
import { openPgSite } from '../util/db.ts';
import { cleanEmpty } from '../../shared/util/arrayUtil.ts';
import { isEmpty } from '../../shared/util/genericUtil.ts';
import { LogViewEntity } from '../../shared/types/site/site-logview-types.ts';
import { filterLogView } from './logview.ts';

wssHandle('LogViewRequest', async event => {
  if (!event.user || !event.user.roles.includes('admin')) {
    event.reply('WsBadRequest', {
      message: 'Must be an admin.'
    });
    return;
  }

  const pg = openPgSite();
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
    event.reply('LogViewResult', {
      lines: results
    });
  }
});
