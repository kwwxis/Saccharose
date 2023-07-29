import dotenv from 'dotenv';
import path from 'path';
import webpack from 'webpack';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import * as sass from 'sass';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config();

const pathDefaults = {
  entry: path.resolve(__dirname, './src/frontend/index.ts'),
  dist: path.resolve(__dirname, './public/dist'),
  public: '/dist', // path of distribution folder relative to base path in the browser (not in the repo)
};
const paths = {
  development: {
    ... pathDefaults,
    outputFilename: `[name].bundle.js`,
    outputChunkFilename: `[name].bundle.js`,
    cssFilename: `[name].bundle.css`,
  },
  production: {
    ... pathDefaults,
    outputFilename: `[name].[chunkhash].bundle.js`,
    outputChunkFilename: `[name].[chunkhash].bundle.js`,
    cssFilename: `[name].[contenthash].bundle.css`,
  }
}

export default (env: 'development'|'production') => <webpack.Configuration> {
  entry: {
    app: paths[env].entry,
  },
  target: 'web',
  output: {
    filename: paths[env].outputFilename,
    path: paths[env].dist,
    chunkFilename: paths[env].outputChunkFilename,
    publicPath: paths[env].public,
    library: {
      type: 'module'
    }
  },
  experiments: {
    outputModule: true,
  },
  resolve: {
    extensions: ['.ts', '.js'],
    mainFields: ['browser', 'main', 'module']
  },
  optimization: {
    splitChunks: {
      cacheGroups: {
        vendors: {
          name: 'vendor',
          test: /node_modules/,
          chunks: 'all'
        }
      }
    }
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        include: path.resolve(__dirname, './src'),
        exclude: path.resolve(__dirname, './src/backend'),
        use: [{
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
            experimentalWatchApi: true,
          },
        }],
      },
      {
        test: /\.(sa|sc|c)ss$/,
        include: [
          path.resolve(__dirname, './src/frontend'),
          path.resolve(__dirname, './node_modules/tippy.js'),
          path.resolve(__dirname, './node_modules/ag-grid-community'),
        ],
        use: [
          MiniCssExtractPlugin.loader,
          {loader: 'css-loader', options: {url: false, sourceMap: true}},
          'postcss-loader',
          {loader: 'sass-loader', options: {sourceMap: true, implementation: sass}}
        ]
      }
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({ filename: paths[env].cssFilename }),
    new CleanWebpackPlugin(),
    new webpack.IgnorePlugin({
      resourceRegExp: /^\.\/locale$/,
      contextRegExp: /moment$/,
    }),
  ],
};