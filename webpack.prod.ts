import {merge} from 'webpack-merge';
import {Configuration} from 'webpack';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import baseConfig from './webpack.base';

export default <Configuration> merge(baseConfig, {
  mode: 'production',
  optimization: {
    minimizer: [
      new CssMinimizerPlugin()
    ]
  },
  devtool: 'source-map',
});