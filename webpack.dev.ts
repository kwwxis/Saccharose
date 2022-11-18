import {merge} from 'webpack-merge';
import {Configuration} from 'webpack';
import LiveReloadPlugin from 'webpack-livereload-plugin';
import baseConfig from './webpack.base';

export default <Configuration> merge(baseConfig, {
  mode: 'development',
  //watch: true,
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
      protocol: 'https',
      port: 35729,
      hostname: process.env.VHOST
    }),
  ]
});