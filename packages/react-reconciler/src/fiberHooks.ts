import internals from "shared/internals";
import { FiberNode } from "./fiber";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
let currentlyRenderingFiber: FiberNode | null = null;
const workInProgressHook: Hook | null = null;
const { currentDispatcher } = internals;

export type Hook = {
  next: Hook | null;
  memoizedState: any;
  updateQueue: unknown;
};

export const renderWithHooks = (wip: FiberNode) => {
  // 赋值操作
  currentlyRenderingFiber = wip;
  wip.memoizedState = null; // 先赋值为null,后面再重新创建hooks链表

  const component = wip.type;
  const pendingProps = wip.pendingProps;
  const children = component(pendingProps);

  const current = wip.alternate;

  if (current === null) {
    // mount阶段 给currentDispatcher赋值mount阶段的hooks集合
    console.log(currentDispatcher.current);
  } else {
    // update阶段
  }

  //重置操作
  currentlyRenderingFiber = null;
  return children;
};
