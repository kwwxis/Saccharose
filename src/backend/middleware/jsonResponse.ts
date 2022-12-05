import jsonMask from 'json-mask';
import { Request, Response, NextFunction } from '../util/router';

function isBadCode(statusCode: number) {
  return statusCode < 200 || statusCode >= 300;
}

function interceptJsonFunction(originalJsonFunction: (body?: any) => Response): (body?: any) => Response {
  return function(obj) {
    const fields = this.req.query['fields'];

    return isBadCode(this.statusCode)
      ? originalJsonFunction(...arguments)
      : originalJsonFunction(jsonMask(obj, fields));
  };
}

export default (req: Request, res: Response, next: NextFunction) => {
  if (!(<any> res).__isJSONMaskWrapped) {
    res.json = interceptJsonFunction(res.json.bind(res));
    (<any> res).__isJSONMaskWrapped = true;
  }
  next();
};