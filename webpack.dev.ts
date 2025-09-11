import {merge} from 'webpack-merge';
import {Configuration} from 'webpack';
import LiveReloadPlugin from 'webpack-livereload-plugin';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import baseConfig from './webpack.base';
import fs from 'fs';
import { toBoolean } from './src/shared/util/genericUtil';

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
      protocol: toBoolean(process.env.SSL_ENABLED) ? 'https' : 'http',
      port: 35729,
      hostname: process.env.WEB_DOMAIN,
      ... (toBoolean(process.env.SSL_ENABLED) ? {
        key: fs.readFileSync(process.env.SSL_KEY, 'utf8'),
        cert: fs.readFileSync(process.env.SSL_CERT, 'utf8'),
      } : {})
    }),
    new BundleAnalyzerPlugin({
      analyzerMode: 'disabled',
      generateStatsFile: true,
      statsOptions: { source: false }
    }),
  ]
});
