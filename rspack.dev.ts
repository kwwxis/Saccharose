import {merge} from 'webpack-merge';
import rspack, {Configuration} from '@rspack/core';
import baseConfig from './rspack.base';
import { toBoolean } from './src/shared/util/genericUtil';
import fs from 'fs';
import { LiveReloadPlugin } from './src/pipeline/RspackLiveReloadPlugin';

// noinspection JSUnusedGlobalSymbols (used in package.json)
export default <Configuration> merge(baseConfig('development'), {
  mode: 'development',
  stats: 'normal',
  output: {
    pathinfo: false
  },
  devtool: 'eval-cheap-module-source-map',
  optimization: {
    removeAvailableModules: false,
    removeEmptyChunks: false,
    minimize: false,
  },
  devServer: {
    hot: false,
    liveReload: false,
  },
  plugins: [
    new LiveReloadPlugin({
      delay: 500,
      protocol: toBoolean(process.env.SSL_ENABLED) ? 'https' : 'http',
      port: 35729,
      hostname: process.env.WEB_DOMAIN,
      ... (toBoolean(process.env.SSL_ENABLED) ? {
        key: fs.readFileSync(process.env.SSL_KEY, 'utf8'),
        cert: fs.readFileSync(process.env.SSL_CERT, 'utf8'),
        ca: fs.readFileSync(process.env.SSL_CA, 'utf8'),
      } : {})
    }),
  ]
});
