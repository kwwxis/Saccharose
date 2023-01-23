import { create, Request, Response, Router } from '../../util/router';
import { getControl } from '../../scripts/script_util';
import { ReadableView } from '../../../shared/types/readable-types';

const router: Router = create();

router.restful('/readables/search', {
  get: async (req: Request, res: Response) => {
    const ctrl = getControl(req);

    let readableViews: ReadableView[] = await ctrl.searchReadableView(<string> req.query.text);

    if (req.headers.accept && req.headers.accept.toLowerCase() === 'text/html') {
      return res.render('partials/item/readable-search-results', {
        readables: readableViews,
        searchText: <string> req.query.text
      });
    } else {
      return readableViews;
    }
  }
});

export default router;
