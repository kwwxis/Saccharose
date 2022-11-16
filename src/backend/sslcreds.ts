import fs from 'fs';
import { ServerOptions } from 'spdy';

export default <ServerOptions> {
  key: process.env.SSL_ENABLED ? fs.readFileSync(process.env.SSL_KEY, 'utf8') : null,
  cert: process.env.SSL_ENABLED ? fs.readFileSync(process.env.SSL_CERT, 'utf8') : null,
  ca: process.env.SSL_ENABLED ? fs.readFileSync(process.env.SSL_CA, 'utf8') : null,
  spdy: {
    plain: false,
    ssl: process.env.SSL_ENABLED ? true : false,
	}
};