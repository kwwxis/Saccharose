import {merge} from 'webpack-merge';
import {Configuration} from 'webpack';
import baseConfig from './webpack.base';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';

// noinspection JSUnusedGlobalSymbols (used in package.json)
export default <Configuration> merge(baseConfig('production'), {
  mode: 'production',
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin(),
      new CssMinimizerPlugin(),
    ]
  },
  devtool: 'source-map',
});
