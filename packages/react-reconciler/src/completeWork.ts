import { FiberNode } from "./fiber";
// 递阶段：beginWork
export const beginWork = (fiber: FiberNode) => {
  // 比较 reactElement 和 fiberNode, 生成返回子FiberNode
  console.log(fiber);
};
