const { defineConfig } = require("@vscode/test-cli");
const path = require("node:path");

module.exports = defineConfig([
  {
    label: "unitTests",
    files: "out/test/**/*.test.js",
    version: "insiders",
    workspaceFolder: path.resolve("test-directory"),
    launchArgs: ["--disable-extensions"],
    mocha: {
      ui: "tdd",
      timeout: 20000,
    },
  },
]);
