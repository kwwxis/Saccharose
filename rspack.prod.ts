import {merge} from 'webpack-merge';
import rspack, {Configuration} from '@rspack/core';
import baseConfig from './rspack.base';

// noinspection JSUnusedGlobalSymbols (used in package.json)
export default <Configuration> merge(baseConfig('production'), {
  mode: 'production',
  optimization: {
    minimize: true,
    minimizer: [
      new rspack.LightningCssMinimizerRspackPlugin(),
      new rspack.SwcJsMinimizerRspackPlugin()
    ]
  },
  devtool: 'source-map',
});
