import {merge} from 'webpack-merge';
import {Configuration} from 'webpack';
import baseConfig from './webpack.base';
import { EsbuildPlugin } from 'esbuild-loader';

// noinspection JSUnusedGlobalSymbols (used in package.json)
export default <Configuration> merge(baseConfig('production'), {
  mode: 'production',
  optimization: {
    minimize: true,
    minimizer: [
      //new CssMinimizerPlugin(),
      //new TerserPlugin(),
      new EsbuildPlugin({
        target: 'es2015',
        css: true,
        minify: true,
        minifyWhitespace: true,
        minifyIdentifiers: true,
        minifySyntax: true,
        legalComments: 'none'
      })
    ]
  },
  devtool: 'source-map',
});