import { WssHandle, wssHandle } from '../websocket/ws-server.ts';
import { SavedSearchEntity, SavedSearchUsageTypes } from '../../shared/types/site/site-saved-searches-types.ts';
import { SiteUser } from '../../shared/types/site/site-user-types.ts';
import { openPgSite } from '../util/db.ts';
import { DEFAULT_SEARCH_MODE, SEARCH_MODES } from '../../shared/util/searchUtil.ts';

import { AvailableSiteModes } from '../../shared/types/site/site-mode-type.ts';

function fixForInsertOrUpdate(savedSearch: SavedSearchEntity, user: SiteUser, event: WssHandle<'WsSavedSearchesAdd' | 'WsSavedSearchesEdit'>): boolean {
  savedSearch.user_id = user.id;

  if (!savedSearch.usage_type && !SavedSearchUsageTypes.includes(savedSearch.usage_type)) {
    savedSearch.usage_type = 'recent';
  }

  if (typeof savedSearch.site_mode !== 'string') {
    event.reply('WsBadRequest', {message: 'Site mode is required.'});
    return false;
  }
  if (!AvailableSiteModes.includes(savedSearch.site_mode)) {
    event.reply('WsBadRequest', {message: 'Invalid site mode.'});
    return false;
  }
  if (typeof savedSearch.search_area !== 'string') {
    event.reply('WsBadRequest', {message: 'Search area is required.'});
    return false;
  }
  if (typeof savedSearch.search_query !== 'string') {
    event.reply('WsBadRequest', {message: 'Search query is required.'});
    return false;
  }

  if (!savedSearch.other_fields || typeof savedSearch.other_fields !== 'object' || Array.isArray(savedSearch.other_fields)) {
    savedSearch.other_fields = {};
  }

  if (!savedSearch.search_mode || !SEARCH_MODES.includes(savedSearch.search_mode)) {
    savedSearch.search_mode = user.prefs.searchMode || DEFAULT_SEARCH_MODE;
  }

  (savedSearch as any).other_fields = JSON.stringify(savedSearch.other_fields);

  // TODO: create sha_hash

  return true;
}

function fixForInsert(savedSearch: SavedSearchEntity, user: SiteUser, event: WssHandle<'WsSavedSearchesAdd' | 'WsSavedSearchesEdit'>): boolean {
  if (!fixForInsertOrUpdate(savedSearch, user, event)) {
    return false;
  }
  savedSearch.usage_time = new Date().toISOString();
  return true;
}

function fixForUpdate(savedSearch: SavedSearchEntity, user: SiteUser, event: WssHandle<'WsSavedSearchesAdd' | 'WsSavedSearchesEdit'>): boolean {
  if (!fixForInsertOrUpdate(savedSearch, user, event)) {
    return false;
  }
  delete savedSearch.usage_time;
  return true;
}

wssHandle('WsSavedSearchesAdd', async event => {
  const savedSearch = event.data.search;
  if (!fixForInsert(savedSearch, event.user, event)) {
    return;
  }
  try {
    const pg = openPgSite();
    await pg('site_searches').insert(savedSearch);
  } catch (e) {
    event.reply('WsBadRequest', {message: 'Error adding saved search.'});
    console.error(e);
  }
});

wssHandle('WsSavedSearchesEdit', async event => {
  const savedSearch = event.data.search;

  if (!savedSearch.sha_hash) {
    event.reply('WsBadRequest', {message: 'Saved search ID is required for edit.'});
    return;
  }
  if (!fixForUpdate(savedSearch, event.session.user, event)) {
    return;
  }

  const pg = openPgSite();

  try {
    const affected = await pg('site_searches').where({
      sha_hash: savedSearch.sha_hash,
      user_id: event.user.id,
    }).update(savedSearch).then();

    if (affected === 0) {
      event.reply('WsBadRequest', {message: 'Saved search not found for ID ' + savedSearch.sha_hash});
    }
  } catch (e) {
    event.reply('WsBadRequest', {message: 'Error updating saved search.'});
    console.error(e);
  }
});

wssHandle('WsSavedSearchesRequest', async event => {
  const criteria = event.data.criteria;

  if (!criteria.site_mode) {
    event.reply('WsBadRequest', {message: 'Site mode is required.'});
    return;
  }

  if (!AvailableSiteModes.includes(criteria.site_mode)) {
    event.reply('WsBadRequest', {message: 'Invalid site mode.'});
    return;
  }

  if (!criteria.search_area) {
    event.reply('WsBadRequest', {message: 'Search area is required.'});
    return;
  }

  if (!criteria.search_text) {
    event.reply('WsBadRequest', {message: 'Search text is required.'});
    return;
  }

  const pg = openPgSite();

  let recentResultsPromise = pg<SavedSearchEntity>('site_searches').select('*')
    .where({
      user_id: event.user.id,
      usage_type: 'recent',
      site_mode: criteria.site_mode,
      search_area: criteria.search_area
    })
    .andWhere('search_query', 'ILIKE', `${criteria.search_text}%`)
    .orderBy('usage_time', 'desc')
    .limit(50)
    .then();

  let savedResultsPromise = pg<SavedSearchEntity>('site_searches').select('*')
    .where({
      user_id: event.user.id,
      usage_type: 'saved',
      site_mode: criteria.site_mode,
      search_area: criteria.search_area
    })
    .andWhere(function() {
      this.where('search_query', 'ILIKE', `${criteria.search_text}%`)
        .orWhere('meta_name', 'ILIKE', `%${criteria.search_text}%`)
    })
    .orderBy('usage_time', 'desc')
    .limit(50)
    .then();

  let publicResultsPromise = pg<SavedSearchEntity>('site_searches').select('*')
    .where({
      usage_type: 'public',
      site_mode: criteria.site_mode,
      search_area: criteria.search_area
    })
    .andWhere(function() {
      this.where('search_query', 'ILIKE', `${criteria.search_text}%`)
        .orWhere('meta_name', 'ILIKE', `%${criteria.search_text}%`)
    })
    .orderBy('usage_time', 'desc')
    .limit(50)
    .then();

  let [recentResults, savedResults, publicResults] = await Promise.all([recentResultsPromise, savedResultsPromise, publicResultsPromise]);

  event.reply('WsSavedSearchesResult', {
    recent: recentResults,
    saved: savedResults,
    public: publicResults,
  });
});

export async function startRecentSavedSearchesPruneInterval() {

}
