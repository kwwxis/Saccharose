import { create, NextFunction, Request, Response, Router } from '../../../util/router';
import { getGenshinControl } from '../../../domain/genshin/genshinControl';
import path from 'path';
import fs from 'fs';
import { PUBLIC_DIR } from '../../../loadenv';
import {
  handleIdUsagesEndpoint,
  handleOlEndpoint,
  handleTextMapSearchEndpoint,
} from '../../generic/basicResourcesUtil';

const router: Router = create();

router.restful('/search-textmap', {
  get: async (req: Request, res: Response) => {
    await handleTextMapSearchEndpoint(getGenshinControl(req), req, res)
  }
});

router.restful('/OL/generate', {
  get: async (req: Request, res: Response) => {
    await handleOlEndpoint(getGenshinControl(req), req, res);
  }
});

router.restful('/id-usages', {
  get: async (req: Request, res: Response) => {
    await handleIdUsagesEndpoint(getGenshinControl(req), req, res);
  }
});

router.restful('/serve-image', {
  get: async (req: Request, res: Response, _next: NextFunction) => {
    const genshinImagesRoot = path.resolve(PUBLIC_DIR, 'images/genshin');
    const mime = {
      html: 'text/html',
      txt: 'text/plain',
      css: 'text/css',
      gif: 'image/gif',
      jpg: 'image/jpeg',
      png: 'image/png',
      svg: 'image/svg+xml',
      js: 'application/javascript'
    };

    if (!req.query.imageName) {
      return res.status(400).end('BadRequest: "imageName" parameter is required.');
    }

    const imageName = String(req.query.imageName).replaceAll(/\\/g, '/');
    const downloadAs = req.query.downloadAs ? String(req.query.downloadAs).replaceAll(/\\/g, '/') : null;

    if (imageName.includes('/') || (downloadAs && downloadAs.includes('/'))) {
      return res.status(400).end('BadRequest: "image" cannot include "/" character.');
    }

    const filePath = path.join(genshinImagesRoot, String(req.query.imageName));

    if (filePath.indexOf(genshinImagesRoot + path.sep) !== 0) {
      return res.status(403).end('Forbidden');
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).end('Not found');
    }

    const type = mime[path.extname(filePath).slice(1)] || 'text/plain';

    try {
      const data = fs.readFileSync(filePath);
      if (downloadAs) {
        res.set('Content-Type', 'application/octet-stream');
        res.set('Content-Disposition', 'attachment; filename=' + downloadAs);
      } else {
        res.set('Content-Type', type);
      }
      res.write(data);
      return res.end();
    } catch (err) {
      return res.status(400).end('BadRequest');
    }
  }
})

export default router;
