import { Request, Response } from '../../util/router';

export default function(statusCode: number, methods: string[]) {
  return (req: Request, res: Response) => {
    let availableMethods = new Set(methods);
    availableMethods.add('options');
    availableMethods.add('head');
    availableMethods.delete('error');
    let availableMethodsStr = Array.from(availableMethods).join(', ').toUpperCase();

    res.header({
      'Allow': availableMethodsStr,
      'Access-Control-Allow-Methods': availableMethodsStr,
    });
    res.status(statusCode).send();
  };
};