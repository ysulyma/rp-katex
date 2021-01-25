const webpack = require("webpack");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
  entry: `${__dirname}/src/rp-katex.tsx`,
  output: {
    filename: "rp-katex.js",
    path: __dirname,
    library: "RPPrompt",
    libraryTarget: "umd"
  },

  devtool: false,

  externals: {
    "katex": {
      commonjs: "katex",
      commonjs2: "katex",
      amd: "katex",
      root: "katex"
    },
    "ractive-player": {
      commonjs: "ractive-player",
      commonjs2: "ractive-player",
      amd: "ractive-player",
      root: "RactivePlayer"
    },
    "react": {
      commonjs: "react",
      commonjs2: "react",
      amd: "react",
      root: "React"
    }
  },

  mode: "production",

  module: {
    rules: [
     {
        test: /\.tsx?$/,
        loader: "ts-loader"
      }
    ]
  },

  optimization: {
    minimizer: [
      new TerserPlugin({
        parallel: true,
        terserOptions: {
          safari10: true
        }
      })
    ],
    emitOnErrors: true
  },

  plugins: [
    new webpack.BannerPlugin({
      banner: () => require("fs").readFileSync("./LICENSE", {encoding: "utf8"})
    })
  ],

  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx", ".json"]
  }
}
