const JsExtPlugin = require('./etsc-jsext.cjs');

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
    console.log("ETSC prebuild");
    const rimraf = await import("rimraf");
    rimraf.sync("./dist"); // clean up dist folder
  },

  // Postbuild hook
  postbuild: async () => {
    console.log("ETSC postbuild");
    const cpy = (await import("cpy")).default;

    await cpy(
      [
        "src/**/*.{css,html,ejs,py}"
      ],
      "dist"
    );
  },
};