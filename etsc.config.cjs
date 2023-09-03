/** @type {import('esbuild-node-tsc/dist/config').Config} */

module.exports = {
  esbuild: {
    minify: false,
    format: 'esm',
    treeShaking: true,
    platform: 'node'
  }
};