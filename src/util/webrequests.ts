import https from 'https';
import axios from 'axios';
import sslcreds from '@/sslcreds';

export const rejectUnauthorizedSetting = !process.env.VHOST.endsWith('.localhost');

export const httpsAgent = new https.Agent({
  ca: sslcreds.ca,
  rejectUnauthorized: rejectUnauthorizedSetting,
});

export const request = axios.create({ httpsAgent });