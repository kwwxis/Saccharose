import {merge} from 'webpack-merge';
import {Configuration} from 'webpack';
import LiveReloadPlugin from 'webpack-livereload-plugin';
import baseConfig from './webpack.base';
import fs from 'fs';

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
  plugins: [
    new LiveReloadPlugin({
      delay: 500,
      protocol: process.env.SSL_ENABLED ? 'https' : 'http',
      port: 35729,
      hostname: process.env.VHOST,
      ... (process.env.SSL_ENABLED ? {
        key: fs.readFileSync(process.env.SSL_KEY, 'utf8'),
        cert: fs.readFileSync(process.env.SSL_CERT, 'utf8'),
      } : {})
    }),
  ]
});