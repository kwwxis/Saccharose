import {merge} from 'webpack-merge';
import {Configuration} from 'webpack';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import baseConfig from './webpack.base';

// noinspection JSUnusedGlobalSymbols (used in package.json)
export default <Configuration> merge(baseConfig('production'), {
  mode: 'production',
  optimization: {
    minimize: true,
    minimizer: [
      new CssMinimizerPlugin(),
      new TerserPlugin(),
    ]
  },
  devtool: 'source-map',
});