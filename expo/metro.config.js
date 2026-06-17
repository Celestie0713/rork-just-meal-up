const { getDefaultConfig } = require("expo/metro-config");
const { withRorkMetro } = require("@rork-ai/toolkit-sdk/metro");

const config = getDefaultConfig(__dirname);

// Prevent Metro from bundling server-side code that imports Node.js-only
// packages (like stripe). These files are for the Cloudflare Functions backend
// and crash React Native if they leak into the client bundle.
config.resolver.blockList = [
  ...(config.resolver.blockList ?? []),
  /backend\/.*/,
];

module.exports = withRorkMetro(config);
