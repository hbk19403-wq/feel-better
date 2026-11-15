const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// NOTE: we intentionally do NOT block nested node_modules here. Some packages
// (e.g. react-native-webrtc) ship their own nested copy of a dependency
// (event-target-shim@6 with an `index` entry) that the hoisted version lacks;
// blocking nested node_modules forces Metro onto the wrong copy and breaks the
// release bundle (`Unable to resolve module event-target-shim/index`).

module.exports = config;
