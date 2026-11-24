export default {
  "*.{ts,tsx,js,mjs,json,css}": () =>
    "biome check --write --staged --no-errors-on-unmatched",
};
