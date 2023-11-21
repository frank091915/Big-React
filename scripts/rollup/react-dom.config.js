import { resolvePackagePath, getPakcageJson, getCommonPlugins } from "./util";
import generatePackageJson from "rollup-plugin-generate-package-json";
import alias from "@rollup/plugin-alias";

const { name, module } = getPakcageJson("react-dom");
const pkgPath = resolvePackagePath(name);
const pkgDistPath = resolvePackagePath(name, true);
export default [
  // react-dom包
  {
    // 根据包的名字获取包的路径
    input: `${pkgPath}/${module}`,
    output: [
      {
        file: `${pkgDistPath}/index.js`,
        name: "index.js",
        // 格式制定为兼容cjs 和ESM的umd格式
        format: "umd",
      },
      // React18版本导出的是client.js,17之前导出的是index.js
      {
        file: `${pkgDistPath}/client.js`,
        name: "client.js",
        // 格式制定为兼容cjs 和ESM的umd格式
        format: "umd",
      },
    ],
    plugins: [
      ...getCommonPlugins(),
      alias({
        entries: {
          hostConfig: `${pkgPath}/src/hostConfig.ts`,
        },
      }),
      generatePackageJson({
        inputFolder: pkgPath,
        outputFolder: pkgDistPath,
        baseContents({ name, description, version }) {
          return {
            name,
            description,
            version,
            peerDependencies: {
              react: version,
            },
          };
        },
      }),
    ],
  },
];
