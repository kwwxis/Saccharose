import { NextFunction, Request, Response, Router } from 'express';
import { create } from '../routing/router';
import path from 'path';
import { IMAGEDIR_GENSHIN_EXT } from '../loadenv';
import fs from 'fs';
import { convertFoodImageToDelicious, convertFoodImageToSuspicious } from '../domain/genshin/misc/food-sharp';

export default async function(): Promise<Router> {

  const router: Router = create();

  router.endpoint('/genshin/:imageName/:downloadName?', {
    get: async (req: Request, res: Response, _next: NextFunction) => {
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

      if (!req.params.imageName) {
        return res.status(400).end('BadRequest: "imageName" parameter is required.');
      }

      let imageName = String(req.params.imageName).replaceAll(/\\/g, '/');
      const downloadAs = req.query.downloadAs ? String(req.query.downloadAs).replaceAll(/\\/g, '/') : null;

      if (imageName.includes('/') || (downloadAs && downloadAs.includes('/'))) {
        return res.status(400).end('BadRequest: "image" cannot include "/" character.');
      }

      if (!imageName.endsWith('.png')) {
        imageName += '.png';
      }

      while (imageName.endsWith('.png.png'))
        imageName = imageName.slice(0, -4);

      const filePath = path.join(IMAGEDIR_GENSHIN_EXT, imageName);

      if (filePath.indexOf(IMAGEDIR_GENSHIN_EXT + path.sep) !== 0) {
        return res.status(403).end('Forbidden');
      }

      if (!fs.existsSync(filePath)) {
        return res.status(400).end('Not found: ' + imageName);
      }

      const type = mime[path.extname(filePath).slice(1)] || 'text/plain';

      try {
        let data: Buffer = fs.readFileSync(filePath);

        if (req.query.convert) {
          switch (String(req.query.convert).toUpperCase()) {
            case 'NORMAL':
            case 'FOOD-NORMAL':
            case 'FOOD_QUALITY_ORDINARY':
              // no-op
              break;
            case 'FOOD-SUSPICIOUS':
            case 'FOOD_QUALITY_STRANGE':
              data = await convertFoodImageToSuspicious(data);
              break;
            case 'FOOD-DELICIOUS':
            case 'FOOD_QUALITY_DELICIOUS':
              data = await convertFoodImageToDelicious(data);
              break;
            default:
              return res.status(404).end('Unknown convert type: ' + String(req.query.convert));
          }
        }

        if (data == null) {
          return res.status(400).end('Read error: ' + imageName);
        }

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
  });

  router.route('*').all((req: Request, res: Response) => res.status(404).end('Not found'));

  return router;
}