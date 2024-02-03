import { NextFunction, Request, Response, Router } from 'express';
import { create } from '../routing/router.ts';
import path from 'path';
import { IMAGEDIR_GENSHIN_EXT, IMAGEDIR_HSR_EXT, IMAGEDIR_ZENLESS_EXT } from '../loadenv.ts';
import fs from 'fs';
import { convertFoodImageToDelicious, convertFoodImageToSuspicious } from '../domain/genshin/misc/food-sharp.ts';
import { toBoolean } from '../../shared/util/genericUtil.ts';

export default async function(): Promise<Router> {

  const router: Router = create();

  async function generalDownloader(req: Request,
                                   res: Response,
                                   IMAGEDIR: string,
                                   postProcessor?: (data: Buffer) => Promise<Buffer|void>) {
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
      res.status(400).end('BadRequest: "imageName" parameter is required.');
      return;
    }

    let imageName = String(req.params.imageName).replaceAll(/\\/g, '/');
    let downloadName = req.params.downloadName
      ? String(req.params.downloadName).replaceAll(/\\/g, '/')
      : undefined;
    let doDownload: boolean = toBoolean(String(req.query.download));

    const downloadAs = req.query.downloadAs
      ? String(req.query.downloadAs).replaceAll(/\\/g, '/')
      : null;

    if (imageName.includes('/') || (downloadAs && downloadAs.includes('/')) || (downloadName && downloadName.includes('/'))) {
      res.status(400).end('BadRequest: "image" cannot include "/" character.');
      return;
    }

    if (doDownload && downloadAs) {
      res.status(400).end('BadRequest: cannot have both "download" and "downloadAs" query parameters set.');
      return;
    }
    if (doDownload && !downloadName) {
      res.status(400).end('BadRequest: "download" query parameter ' +
        'can only be set when the "downloadName" path parameter is also set.');
      return;
    }

    if (!imageName.endsWith('.png')) {
      imageName += '.png';
    }

    while (imageName.endsWith('.png.png'))
      imageName = imageName.slice(0, -4);

    const filePath = path.join(IMAGEDIR, imageName);

    if (filePath.indexOf(IMAGEDIR + path.sep) !== 0) {
      res.status(403).end('Forbidden');
      return;
    }

    if (!fs.existsSync(filePath)) {
      res.status(400).end('Not found: ' + imageName);
      return;
    }

    const type = mime[path.extname(filePath).slice(1)] || 'text/plain';

    try {
      let data: Buffer = fs.readFileSync(filePath);

      if (postProcessor) {
        let postProcessResult = await postProcessor(data);
        if (postProcessResult) {
          data = postProcessResult;
        }
        if (res.writableEnded) {
          return;
        }
      }

      if (data == null) {
        res.status(400).end('Read error: ' + imageName);
        return;
      }

      if (downloadAs || doDownload) {
        res.set('Content-Type', 'application/octet-stream');
        res.set('Content-Disposition', 'attachment; filename=' + (
          doDownload ? downloadName : downloadAs));
      } else {
        res.set('Content-Type', type);
      }
      res.write(data);
      res.end();
    } catch (err) {
      res.status(400).end('BadRequest');
    }
  }

  router.endpoint('/genshin/:imageName/:downloadName?', {
    get: async (req: Request, res: Response, _next: NextFunction) => {
      await generalDownloader(req, res, IMAGEDIR_GENSHIN_EXT, async (data: Buffer) => {
        if (req.query.convert) {
          switch (String(req.query.convert).toUpperCase()) {
            case 'NORMAL':
            case 'FOOD-NORMAL':
            case 'FOOD_QUALITY_ORDINARY':
              // no-op
              return;
            case 'FOOD-SUSPICIOUS':
            case 'FOOD_QUALITY_STRANGE':
              return await convertFoodImageToSuspicious(data);
            case 'FOOD-DELICIOUS':
            case 'FOOD_QUALITY_DELICIOUS':
              return await convertFoodImageToDelicious(data);
            default:
              res.status(404).end('Unknown convert type: ' + String(req.query.convert));
              return;
          }
        }
      });
    }
  });

  // router.endpoint('/hsr/:imageName/:downloadName?', {
  //   get: async (req: Request, res: Response, _next: NextFunction) => {
  //     await generalDownloader(req, res, IMAGEDIR_HSR_EXT);
  //   }
  // });
  //
  // router.endpoint('/zenless/:imageName/:downloadName?', {
  //   get: async (req: Request, res: Response, _next: NextFunction) => {
  //     await generalDownloader(req, res, IMAGEDIR_ZENLESS_EXT);
  //   }
  // });

  router.route('*').all((req: Request, res: Response) => res.status(404).end('Not found'));

  return router;
}
