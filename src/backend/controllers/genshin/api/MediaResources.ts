import { create } from '../../../routing/router.ts';
import multer from 'multer';
import bodyParser from 'body-parser';
import { mediaSearch } from '../../../util/shellutil.ts';
import { isInt, toInt } from '../../../../shared/util/numberUtil.ts';
import path from 'path';
import fs from 'fs';
import { uuidv4 } from '../../../../shared/util/uuidv4.ts';
import { Request, Response, Router } from 'express';
import { getGenshinControl } from '../../../domain/genshin/genshinControl.ts';
import { SearchMode } from '../../../../shared/util/searchUtil.ts';
import { toBoolean } from '../../../../shared/util/genericUtil.ts';

const router: Router = create();
router.use(bodyParser.urlencoded({extended: true}));

const MAX_FILE_SIZE = 1_000_000 * 10; // 10 MB in bytes

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, process.env.TMP_UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    cb(null, uuidv4() + '.png');
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    fieldSize: MAX_FILE_SIZE,
  }
}).single('uploadFile');

router.post('/media/reverse-search', (req: Request, res: Response) => {
  upload(req, res, async function (err) {
    if (err) {
      return res.status(400).json({ error: String(err) });
    }

    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file' });
    }

    if (!isInt(req.body.maxHammingDistance) || parseInt(req.body.maxHammingDistance) < 3) {
      return res.status(400).json({ error: 'Invalid max hamming distance' });
    }

    let maxHammingDistance = req.body.maxHammingDistance;
    if (maxHammingDistance > 20) {
      maxHammingDistance = 20;
    }
    if (maxHammingDistance < 3) {
      maxHammingDistance = 3;
    }

    const result = mediaSearch(file.filename, maxHammingDistance);

    const uploadedFilePath = path.resolve(process.env.TMP_UPLOAD_DIR, file.filename);
    fs.unlinkSync(uploadedFilePath);

    res.json({
      originalName: file.originalname,
      fileName: file.filename,
      mimeType: file.mimetype,
      size: file.size,
      search: result,
    });
  });
});

router.endpoint('/media/search', {
  get: async (req: Request, res: Response) => {
    const ctrl = getGenshinControl(req);

    return await ctrl.searchImageIndex(
      {
        query: (req.query.query || '') as string,
        cat1: req.query.cat1 as string,
        cat2: req.query.cat2 as string,
        cat3: req.query.cat3 as string,
        cat4: req.query.cat4 as string,
        cat5: req.query.cat5 as string,
        catPath: req.query.catPath as string,
        catRestrict: toBoolean(req.query.catRestrict),
        offset: isInt(req.query.offset) ? toInt(req.query.offset) : 0
      },
      req.query.searchMode ? (String(req.query.searchMode) as SearchMode) : ctrl.searchMode
    );
  }
});


router.endpoint('/media/category', {
  get: async (req: Request, res: Response) => {
    const ctrl = getGenshinControl(req);
    return await ctrl.listImageCategories();
  }
});

export default router;
