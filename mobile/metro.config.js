const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Fix for "spawn UNKNOWN" error on Windows
config.maxWorkers = 1;

module.exports = config;
