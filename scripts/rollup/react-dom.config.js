import { resolvePackagePath, getPakcageJson, getCommonPlugins } from "./util";
import generatePackageJson from "rollup-plugin-generate-package-json";
import alias from "@rollup/plugin-alias";

const { name, module, peerDependencies } = getPakcageJson("react-dom");
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
        name: "ReactDom",
        // 格式制定为兼容cjs 和ESM的umd格式
        format: "umd",
      },
      // React18版本导出的是client.js,17之前导出的是index.js
      {
        file: `${pkgDistPath}/client.js`,
        name: "client",
        // 格式制定为兼容cjs 和ESM的umd格式
        format: "umd",
      },
    ],
    external: [...Object.keys(peerDependencies)],
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
  // test-utils包
  {
    // 根据包的名字获取包的路径
    input: `${pkgPath}/test-utils.ts`,
    output: [
      {
        file: `${pkgDistPath}/test-utils.js`,
        // name 应该不加.js后缀，esm规范下可以正常引入,但是如果在浏览器环境中从window身上引用就需要改为window['test-utils.js'],不然获取不到
        // 所以name直接改成包名,如 react、react-dom
        name: "testUtils",
        // 格式制定为兼容cjs 和ESM的umd格式
        format: "umd",
      },
    ],
    external: ["react", "react-dom"],
    plugins: getCommonPlugins(),
  },
];
