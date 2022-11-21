// File to set 'use strict' and load environment variables
import 'use-strict';
import '../shared/polyfills';
import path from 'path';
import dotenv from 'dotenv';
const envFile = path.resolve(__dirname, '../../.env');
console.log('[Init] envFile:', envFile);
dotenv.config({ path: envFile });