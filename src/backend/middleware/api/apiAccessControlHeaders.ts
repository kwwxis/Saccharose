import { NextFunction, Request, Response } from 'express';

export default (req: Request, res: Response, next: NextFunction) => {
  res.header({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers':
      'Origin, Content-Type, Accept, User-Agent, X-CSRF-Token, X-Requested-With, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  });
  next();
};