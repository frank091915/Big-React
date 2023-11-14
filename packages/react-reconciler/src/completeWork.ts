import { FiberNode } from "./fiber";
export const completeWork = (fiber: FiberNode) => {
  // 归阶段
  console.log(fiber);
};
