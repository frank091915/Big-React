import { resolvePackagePath, getPakcageJson, getCommonPlugins } from "./util";
import generatePackageJson from "rollup-plugin-generate-package-json";
const { name, module } = getPakcageJson("react");
const pkgPath = resolvePackagePath(name);
const pkgDistPath = resolvePackagePath(name, true);
export default [
  // react包
  {
    // 根据包的名字获取包的路径
    input: `${pkgPath}/${module}`,
    output: {
      file: `${pkgDistPath}/index.js`,
      name: "index.js",
      // 格式制定为兼容cjs 和ESM的umd格式
      format: "umd",
    },
    plugins: [
      ...getCommonPlugins(),
      generatePackageJson({
        inputFolder: pkgPath,
        outputFolder: pkgDistPath,
        baseContents({ name, description, version }) {
          return { name, description, version };
        },
      }),
    ],
  },
  // jsx runtime
  {
    // 根据包的名字获取包的路径
    input: `${pkgPath}/src/jsx.ts`,
    output: [
      {
        file: `${pkgDistPath}/jsx-runtime.js`,
        name: "jsx-runtime.js",
        format: "umd",
      },
      {
        file: `${pkgDistPath}/jsx-dev-runtime.js`,
        name: "jsx-dev-runtime.js",
        format: "umd",
      },
    ],
    plugins: getCommonPlugins(),
  },
];
