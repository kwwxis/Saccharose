import { create, Request, Response, Router } from '../../util/router';
import { getControl } from '../../scripts/script_util';
import { ReadableSearchView, ReadableView } from '../../../shared/types/readable-types';

const router: Router = create();

router.restful('/readables/search', {
  get: async (req: Request, res: Response) => {
    const ctrl = getControl(req);

    let readableSearchView: ReadableSearchView = await ctrl.searchReadableView(<string> req.query.text);

    if (req.headers.accept && req.headers.accept.toLowerCase() === 'text/html') {
      return res.render('partials/archive/readable-search-results', {
        searchView: readableSearchView,
        searchText: <string> req.query.text
      });
    } else {
      return readableSearchView;
    }
  }
});

export default router;
