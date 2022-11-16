// File to set 'use strict' and load environment variables

import 'use-strict';
import dotenv from 'dotenv';
dotenv.config();

const deleteEnvVarIfFalsey = envKey => {
  let val = process.env[envKey];
  if (!val || val === '0' || val.toLowerCase() === 'false' || val.toLowerCase() === 'off') {
    delete process.env[envKey];
  }
};

deleteEnvVarIfFalsey('VHOSTED');
deleteEnvVarIfFalsey('TEXTMAP_LANG_CODES');