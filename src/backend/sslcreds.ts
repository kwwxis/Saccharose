import fs from 'fs';
import { toBoolean } from '../shared/util/genericUtil.ts';
import { ServerOptions } from 'https';

export const sslEnabled: boolean = toBoolean(ENV.SSL_ENABLED);

export default <ServerOptions> {
  key:  sslEnabled ? fs.readFileSync(ENV.SSL_KEY, 'utf8')  : null,
  cert: sslEnabled ? fs.readFileSync(ENV.SSL_CERT, 'utf8') : null,
  ca:   sslEnabled ? fs.readFileSync(ENV.SSL_CA, 'utf8')   : null,
  maxHeaderSize: 500_000, // 500 KB
};
