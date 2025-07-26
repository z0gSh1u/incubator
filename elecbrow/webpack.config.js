const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

// Update all configs to use tsconfig.build.json
const tsLoaderOptions = {
  transpileOnly: true,
  configFile: path.resolve(__dirname, 'tsconfig.build.json'),
};

// Configuration for the library entry point
const libraryConfig = {
  mode: 'production',
  entry: './src/index.ts',
  target: 'electron-main',
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        include: path.resolve(__dirname, 'src'),
        use: {
          loader: 'ts-loader',
          options: tsLoaderOptions,
        },
      },
    ],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js',
    libraryTarget: 'commonjs2',
  },
  externals: {
    electron: 'electron',
    react: 'react',
    'react-dom': 'react-dom',
  },
};

// Configuration for browser library
const browserLibConfig = {
  mode: 'production',
  entry: './src/lib/browser.ts',
  target: 'electron-main',
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        include: path.resolve(__dirname, 'src'),
        use: {
          loader: 'ts-loader',
          options: tsLoaderOptions,
        },
      },
    ],
  },
  output: {
    path: path.resolve(__dirname, 'dist/lib'),
    filename: 'browser.js',
    libraryTarget: 'commonjs2',
  },
  externals: {
    electron: 'electron',
  },
};

// Configuration for the renderer process
const rendererConfig = {
  mode: 'production',
  entry: './src/renderer/index.tsx',
  target: 'electron-renderer',
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        include: path.resolve(__dirname, 'src'),
        use: {
          loader: 'ts-loader',
          options: tsLoaderOptions,
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'renderer.js',
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/renderer/index.html',
      filename: 'index.html',
    }),
  ],
};

// Configuration for the main process
const mainConfig = {
  mode: 'production',
  entry: './src/main/main.ts',
  target: 'electron-main',
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        include: path.resolve(__dirname, 'src'),
        use: {
          loader: 'ts-loader',
          options: tsLoaderOptions,
        },
      },
    ],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'main.js',
  },
  externals: {
    electron: 'electron',
  },
};

// Configuration for the preload script
const preloadConfig = {
  mode: 'production',
  entry: './src/preload.ts',
  target: 'electron-preload',
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        include: path.resolve(__dirname, 'src'),
        use: {
          loader: 'ts-loader',
          options: tsLoaderOptions,
        },
      },
    ],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'preload.js',
  },
};

// Export different configurations based on environment
module.exports = (env, argv) => {
  // Update mode based on command line arguments
  const mode = argv.mode === 'production' ? 'production' : 'development';

  // Update all configs with the right mode
  [libraryConfig, browserLibConfig, rendererConfig, mainConfig, preloadConfig].forEach((config) => {
    config.mode = mode;

    // Only add devtool for development mode if debugging is needed
    if (mode === 'development' && process.env.DEBUG_SOURCEMAPS === 'true') {
      config.devtool = 'source-map';
    }
  });

  return [libraryConfig, browserLibConfig, rendererConfig, mainConfig, preloadConfig];
};
