const { getDefaultConfig } = require("expo/metro-config");
const { withRorkMetro } = require("@rork-ai/toolkit-sdk/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

config.resolver = config.resolver || {};
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  "zod/v4": path.resolve(__dirname, "node_modules/zod/v4"),
};

config.resolver.unstable_enablePackageExports = true;

module.exports = withRorkMetro(config);
