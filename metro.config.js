const { getPostHogExpoConfig } = require('posthog-react-native/metro');
const { withNativeWind } = require('nativewind/metro');

const config = getPostHogExpoConfig(__dirname);

module.exports = withNativeWind(config, { input: './src/global.css' });
