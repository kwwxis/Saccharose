import https from 'https';
import axios, { AxiosInstance } from 'axios';
import fs from 'fs';

export const httpsAgent = new https.Agent({
  ca: fs.readFileSync(ENV.SSL_CACERT, 'utf8'),
  rejectUnauthorized: true,
});

export const httpRequest: AxiosInstance = axios.create({ httpsAgent });
