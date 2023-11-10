import path from "path";
import fs from "fs";
import ts from "rollup-plugin-typescript2";
import cjs from "@rollup/plugin-commonjs";
// 获取packages和打包后的对应路径
const pkgPath = path.resolve(__dirname, "../../packages");
// 打包后的产物会放在dist下的node_modules目录
const distPath = path.resolve(__dirname, "../../dist/node_modules");
// 获取包所在路径的方法
export function resolvePackagePath(packageName, isDist) {
  return isDist ? `${distPath}/${packageName}` : `${pkgPath}/${packageName}`;
}
export function getPakcageJson(pkgName) {
  // 获取包的json，首先需要找到包的路径
  const packagePath = `${resolvePackagePath(pkgName)}/package.json`;
  // 将package读取为字符串
  const str = fs.readFileSync(packagePath, { encoding: "utf-8" });
  return JSON.parse(str);
}

// 创建一个返回常用rollup plugin的方法
// 安装两个: 解析commonJS的 将源码的ts解析为js的
export function getCommonPlugins({ typeScript } = {}) {
  return [cjs(), ts({ typeScript })];
}
