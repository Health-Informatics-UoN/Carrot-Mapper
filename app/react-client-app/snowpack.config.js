// Snowpack Configuration File
// See all supported options: https://www.snowpack.dev/reference/configuration

/** @type {import("snowpack").SnowpackUserConfig } */
module.exports = {
  routes: [
    {
      match: "routes",
      src: ".*",
      dest: "/index.html",
    },
  ],
  mount: {
    /* ... */
  },
  plugins: [
    /* ... */
  ],
  packageOptions: {
    /* ... */
  },
  devOptions: {
    /* ... */
  },
  buildOptions: {
    /* ... */
    out: "../api/static/javascript/react",
    //watch: true
  },
  exclude: [
    "**/node_modules/**/*", // from the default at https://www.snowpack.dev/reference/configuration
    "**/.stories.js",
    "**/stories/**/*",
  ],
};
