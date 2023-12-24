export default {
  loaders: [
    {
      loader: 'esm-loader-typescript',
      options: {
        files: [/\.tsx?$/, /\.vue.*lang=ts/]
      }
    },
    {
      loader: 'vue-esm-loader',
      options: {
        files: [/\.vue$/]
      }
    }
  ]
}