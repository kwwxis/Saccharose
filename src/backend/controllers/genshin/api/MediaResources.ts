import { create, Request, Response, Router } from '../../../util/router';
import multer from 'multer';
import { HttpError } from '../../../../shared/util/httpError';
import bodyParser from 'body-parser';
import { uuidv4 } from '../../../util/uuidv4';
import { mediaSearch } from '../../../util/shellutil';
import { isInt } from '../../../../shared/util/numberUtil';
import path from 'path';
import fs from 'fs';

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

router.post('/media-search', (req: Request, res: Response) => {
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

export default router;