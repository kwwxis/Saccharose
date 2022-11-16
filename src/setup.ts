import 'use-strict';
import moduleAlias from 'module-alias';

let moduleAliasPrefix;
let moduleAliasSuffix;

if (__filename.endsWith('.ts')) {
  moduleAliasPrefix = __dirname;
  moduleAliasSuffix = '';
} else {
  moduleAliasPrefix = __dirname;
  moduleAliasSuffix = '.js';
}

moduleAlias.addAliases({
  '@cache': moduleAliasPrefix + '/util/cache' + moduleAliasSuffix,
  '@db': moduleAliasPrefix + '/util/db' + moduleAliasSuffix,
  '@functions': moduleAliasPrefix + '/util/functions' + moduleAliasSuffix,
  '@router': moduleAliasPrefix + '/util/router' + moduleAliasSuffix,
  '@types': moduleAliasPrefix + '/util/types' + moduleAliasSuffix,
  '@': moduleAliasPrefix + '/'
});

import 'module-alias/register';

import dotenv from 'dotenv';
dotenv.config();

const deleteEnvVarIfFalsey = envKey => {
  let val = process.env[envKey];
  if (!val || val === '0' || val.toLowerCase() === 'false' || val.toLowerCase() === 'off') {
    delete process.env[envKey];
  }
};

deleteEnvVarIfFalsey('VHOSTED');