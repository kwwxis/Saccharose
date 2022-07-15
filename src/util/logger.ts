import debug from 'debug';

export const log = debug(process.env.APP_NAME);
export const error = debug(`${process.env.APP_NAME}:error`);
export const custom = (namespace: string) => debug(`${process.env.APP_NAME}:` + namespace);

export default {
  log,
  error,
  custom,
};