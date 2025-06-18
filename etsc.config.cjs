// noinspection JSUnusedGlobalSymbols

const JsExtPlugin = require('./etsc-jsext.cjs');
const fs = require('node:fs');
const dotenv = require('dotenv');
dotenv.config();

/** @type {import('esbuild-node-tsc/dist/config').Config} */
module.exports = {
  esbuild: {
    bundle: true,
    minify: false,
    format: 'esm',
    treeShaking: true,
    platform: 'node',
    packages: 'external',
    plugins: [
      JsExtPlugin({ method: 'resolve' })
    ]
  },

  // Prebuild hook
  prebuild: async () => {
    console.time('ETSC rmdir');
    fs.rmSync('./dist', {
      recursive: true,
      force: true,
    });
    console.timeEnd('ETSC rmdir');

    console.time('ETSC build');
  },

  // Postbuild hook
  postbuild: async () => {
    console.timeEnd('ETSC build');

    console.time('ETSC cpy');
    fs.cpSync('./src/backend/views', './dist/backend/views', {
      force: true,
      recursive: true,
    });
    fs.cpSync('./src/pipeline/detect_language.py', './dist/pipeline/detect_language.py', { force: true });
    console.timeEnd('ETSC cpy');
  },
};
