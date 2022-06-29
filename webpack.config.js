const path = require('path')

module.exports = {
  mode: 'production',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'graphite-lib.js',
    library: 'graphiteLib',
    libraryTarget: 'umd'
  },
  resolve: {
    modules: ['node_modules'],
    extensions: ['.js'],
    symlinks: false,
    fallback: {
      // 'buffer': require.resolve('buffer'),
      'http': require.resolve('stream-http'),
      'path': require.resolve('path-browserify'),
      'stream': require.resolve('stream-browserify'),
      'crypto': require.resolve('crypto-browserify'),
      'assert': require.resolve('assert'),
      'url': require.resolve('url'),
      'process': require.resolve('process'),
      'os': require.resolve('os-browserify/browser'),
      'https': require.resolve('https-browserify')
    }
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: ['babel-loader']
      }
    ]
  },
  performance: {
    hints: false,
    maxEntrypointSize: 512000,
    maxAssetSize: 512000
  }
}
