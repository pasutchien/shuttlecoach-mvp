/**
 * Babel config for Shuttle Coach.
 * - `jsxImportSource: nativewind` enables NativeWind v4's className prop on RN elements.
 * - `nativewind/babel` transforms Tailwind classes.
 * - The Reanimated/worklets plugin is injected automatically by `babel-preset-expo`.
 */
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
  };
};
