/**
 *
 * @param {import('esbuild').OnResolveArgs} args
 * @param {import('esbuild').PluginBuild} build
 * @returns {import('esbuild').OnResolveResult|undefined}
 */
function handleResolve(args, build) {
  if (args.kind !== 'import-statement' && args.kind !== 'dynamic-import') {
    return;
  }
  if (args.importer && args.path.startsWith('.')) {
    const pathAlreadyHasExt = args.path.endsWith('.js');

    if (!pathAlreadyHasExt) {
      return {
        path: `${args.path}.js`,
        external: true,
        namespace: undefined
      };
    }
  }

  return {
    path: args.path,
    external: true,
    namespace: undefined,
  };
}

/** @type {import('esbuild-node-tsc/dist/config').Config} */
module.exports = {
  esbuild: {
    bundle: true,
    minify: false,
    format: 'esm',
    treeShaking: true,
    platform: 'node',
    plugins: [
      {
        name: 'esbuild-jsext',
        setup(build) {
          const filter = /.*/;
          const namespace = undefined;
          build.onResolve({ filter, namespace }, (args) => handleResolve(args, build));
        }
      }
    ]
  },

  // Prebuild hook
  prebuild: async () => {
    console.log("Prebuild");
    const rimraf = await import("rimraf");
    rimraf.sync("./dist"); // clean up dist folder
  },

  // Postbuild hook
  postbuild: async () => {
    console.log("Postbuild");
    const cpy = (await import("cpy")).default;

    await cpy(
      [
        "src/**/*.{css,html,ejs,py}"
      ],
      "dist"
    );
  },
};