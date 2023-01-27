import { create, Request, Response, Router } from '../../util/router';
import { getControl } from '../../scripts/script_util';
import { BookSuitExcelConfigData, ReadableView } from '../../../shared/types/readable-types';
import { ol_gen_from_id } from '../../scripts/OLgen/OLgen';

export default async function(): Promise<Router> {
  const router: Router = create();

  router.get('/readables', async (req: Request, res: Response) => {
    const ctrl = getControl(req);
    const archive = await ctrl.selectReadableArchiveView();

    res.render('pages/item/readables', {
      title: 'Books & Readables',
      archive: archive,
      bodyClass: ['pages-readables', 'page--readables-list']
    });
  });

  router.get('/readables/search', async (req: Request, res: Response) => {
    res.render('pages/item/readables-search', {
      title: 'Search Books & Readables',
      bodyClass: ['page--readables-search']
    });
  });

  router.get('/readables/book-collection/:suitId', async (req: Request, res: Response) => {
    const ctrl = getControl(req);
    const collection: BookSuitExcelConfigData = await ctrl.selectBookCollection(req.params.suitId);

    let infobox = `{{Book Collection Infobox
|image     = Book ${collection.SuitNameText}.png
|rarity    = ${collection.Books.find(b => b?.Material?.RankLevel)?.Material?.RankLevel}
|volumes   = ${collection.Books.length}
|publisher = 
|author    =`;
    for (let i = 0; i < collection.Books.length; i++) {
      infobox += `\n|vol${i + 1}`.padEnd(12, ' ') + '='
    }
    infobox += '\n}}';

    res.render('pages/item/readable-collection', {
      title: collection.SuitNameText,
      collection: collection,
      infobox,
      ol: await ol_gen_from_id(ctrl, collection.SuitNameTextMapHash),
      bodyClass: ['pages-readables', 'page--readable-collection']
    });
  });

  router.get('/readables/item/:itemId', async (req: Request, res: Response) => {
    const ctrl = getControl(req);
    const readable: ReadableView = await ctrl.selectReadableView(req.params.itemId);

    res.render('pages/item/readable-item', {
      title: readable.TitleText,
      readable: readable,
      ol: await ol_gen_from_id(ctrl, readable.TitleTextMapHash),
      bodyClass: ['pages-readables', 'page--readable-item']
    });
  });

  return router;
}