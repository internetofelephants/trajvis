const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const dotenv = require('dotenv').config( {
  path: path.join(__dirname, '.env')
} );

module.exports = {
  entry: './src/index.js',
  mode: 'none',
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin()],
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel-loader',
        options: { presets: ['@babel/env'] }
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader', 'postcss-loader']
      },
      {
        test: /\.js$/,
        enforce: 'pre',
        use: 'source-map-loader'
      }
    ]
  },
  resolve: {
    extensions: ['*', '.js', '.jsx'],
    fallback: { 'util': false }
  },
  output: {
    path: path.resolve(__dirname, 'dist/'),
    publicPath: '/dist/',
    filename: 'bundle.js'
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'public/')
    },
    port: 3000,
    hot: 'only',
    devMiddleware: {
      publicPath: 'http://localhost:3000/dist/'
    }
  },
  plugins: [
    new webpack.DefinePlugin( { 'process.env': JSON.stringify(process.env) } )
  ]
};
