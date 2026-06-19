const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Exclude node_modules from file watching to stay within OS file descriptor limits
config.watchFolders = [__dirname];
config.resolver.blockList = [
  /node_modules\/.*\/node_modules\/.*/,
];

// Use polling fallback to avoid FSEvents limits
config.watcher = {
  ...config.watcher,
  healthCheck: {
    enabled: false,
  },
};

module.exports = config;
