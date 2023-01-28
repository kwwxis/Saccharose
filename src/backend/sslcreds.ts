import fs from 'fs';
import { ServerOptions } from 'spdy';
import { toBoolean } from '../shared/util/genericUtil';

const sslEnabled: boolean = toBoolean(process.env.SSL_ENABLED);

export default <ServerOptions> {
  key:  sslEnabled ? fs.readFileSync(process.env.SSL_KEY, 'utf8')  : null,
  cert: sslEnabled ? fs.readFileSync(process.env.SSL_CERT, 'utf8') : null,
  ca:   sslEnabled ? fs.readFileSync(process.env.SSL_CA, 'utf8')   : null,
  spdy: {
    plain: false,
    ssl: sslEnabled,
    connection: {
      windowSize: 1024*1024
    }
  },
  maxHeaderSize: 500_000 // 500 KB
};