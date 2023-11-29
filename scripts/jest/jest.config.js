const { defaults } = require("jest-config");
const config = {
  ...defaults,
  rootDir: process.cwd(),
  // modulePathIgnorePatterns: ["<rootDir>/.history"],
  moduleDirectories: [
    // 对于 React ReactDOM
    "dist/node_modules",
    // 对于第三方依赖
    ...defaults.moduleDirectories,
  ],
  testEnvironment: "jsdom",
};
module.exports = config;
