import fs from 'fs';
import { ServerOptions } from 'spdy';
import { toBoolean } from '../shared/util/genericUtil';

export default <ServerOptions> {
  key: toBoolean(process.env.SSL_ENABLED) ? fs.readFileSync(process.env.SSL_KEY, 'utf8') : null,
  cert: toBoolean(process.env.SSL_ENABLED) ? fs.readFileSync(process.env.SSL_CERT, 'utf8') : null,
  ca: toBoolean(process.env.SSL_ENABLED) ? fs.readFileSync(process.env.SSL_CA, 'utf8') : null,
  spdy: {
    plain: false,
    ssl: !!process.env.SSL_ENABLED,
	}
};