import fs from 'fs';
import { ServerOptions } from 'spdy';

export default <ServerOptions> {
  key: fs.readFileSync(process.env.SSL_KEY, 'utf8'),
  cert: fs.readFileSync(process.env.SSL_CERT, 'utf8'),
  ca: fs.readFileSync(process.env.SSL_CA, 'utf8'),
  spdy: {
    plain: false,
    ssl: true,
	}
};