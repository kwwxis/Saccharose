import dotenv from 'dotenv';
dotenv.config();

import path from 'path';
import { Configuration } from 'webpack';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';

const HASH_LENGTH = 6;
const paths = {
  dev: {
    entry: path.resolve(__dirname, './src/frontend/index.ts'),
    dist: path.resolve(__dirname, './public/dist'),
    public: '/dist', // path of distribution folder relative to base path in the browser (not in the repo)
    outputFilename: `[name].bundle.js`,
    outputChunkFilename: `[name].bundle.js`,
    cssFilename: `[name].bundle.css`,
  },
  prod: {
    outputFilename: `[name].[chunkhash:${HASH_LENGTH}].bundle.js`,
    outputChunkFilename: `[name].[chunkhash:${HASH_LENGTH}].bundle.js`,
    cssFilename: `[name].[contenthash:${HASH_LENGTH}].bundle.css`,
  }
}

export default <Configuration> {
  entry: {
    app: path.resolve(__dirname, './src/frontend/index.ts'),
  },
  target: 'web',
  output: {
    filename: paths.dev.outputFilename,
    path: paths.dev.dist,
    chunkFilename: paths.dev.outputChunkFilename,
    publicPath: paths.dev.public,
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
        exclude: /node_modules|backend/,
        use: [{
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
            experimentalWatchApi: true,
          },
        }],
        include: path.resolve(__dirname, 'src'),
      },
      {
        test: /\.(sa|sc|c)ss$/,
        exclude: /node_modules|backend/,
        use: [
          MiniCssExtractPlugin.loader,
          {loader: 'css-loader', options: {url: false, sourceMap: true}},
          'postcss-loader',
          {loader: 'sass-loader', options: {sourceMap: true, implementation: require('sass')}}
        ]
      }
    ],
  },
  plugins: [
    // new HtmlWebpackPlugin({
    //   template: '!!raw-loader!./src/backend/views/layouts/base-layout.ejs',
    //   filename: 'index.ejs',
    //   minify: false,
    // })
    new MiniCssExtractPlugin({ filename: paths.dev.cssFilename }),
    new CleanWebpackPlugin(),
  ],
  externals: {
    moment: 'moment',
    axios: 'axios'
  }
};