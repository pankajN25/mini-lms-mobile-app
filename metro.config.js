const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);
const nwConfig = withNativeWind(config, { input: "./global.css" });

// Hermes parser fails on the 7448-entry MaterialCommunityIcons object literal.
// Redirect to a chunked version (10 x ~800 entries) that Hermes can parse.
const originalResolveRequest = nwConfig.resolver?.resolveRequest;
nwConfig.resolver = nwConfig.resolver ?? {};
nwConfig.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.endsWith("MaterialCommunityIcons.json")) {
    return {
      filePath: path.join(__dirname, "patches/MaterialCommunityIconsGlyphMap.js"),
      type: "sourceFile",
    };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = nwConfig;
