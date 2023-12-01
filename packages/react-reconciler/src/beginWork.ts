import { ReactElementType } from "shared/ReactTypes";
import { mountChildFibers, reconcileChildFibers } from "./childFibers";
import { FiberNode } from "./fiber";
import { renderWithHooks } from "./fiberHooks";
import { processUpdateQueue, Update, UpdateQueue } from "./updateQueue";
import {
  FunctionComponent,
  HostComponent,
  HostRoot,
  HostText,
} from "./workTags";
// 递阶段：beginWork
export const beginWork = (fiber: FiberNode) => {
  // 比较 reactElement 和 current fiberNode, 生成返回子wip FiberNode
  // 根据tag进行不同处理
  switch (fiber.tag) {
    case HostRoot:
      return updateHostRoot(fiber);
    case HostComponent:
      return updateHostComponent(fiber);
    case HostText:
      // 没有子节点了 说明已经遍历到叶子节点，开始completeWork
      return null;
    case FunctionComponent:
      return updateFunctionComponent(fiber);
    default:
      console.warn("未进行处理的类型");
      break;
  }
};

export const updateHostRoot = (wip: FiberNode) => {
  // 计算最新状态
  const baseState = wip.memoizedState;
  const updateQueue = wip.updateQueue as UpdateQueue<Element>;
  const pendingUpdate = updateQueue.shared.pending;
  const { memoizedState } = processUpdateQueue(baseState, pendingUpdate);
  updateQueue.shared.pending = null; // !! 注意不是pendingUpdage = null，是将pendingUpdate.shared.pending改为null
  wip.memoizedState = memoizedState;
  const nextChildren = memoizedState;
  // 对比子reactElement和子current fiberNode，生成子wip fiberNode
  reconcileChildren(wip, nextChildren);
  return wip.child;
};

export const updateHostComponent = (wip: FiberNode) => {
  // <div><span/></div> <span>怎么获取? => <div>.props.children
  // <div>123</div> 子节点的reactElement为hostTextComponent, children为123
  const props = wip.pendingProps;
  const nextChildren = props.children; // props.children可能是 reactElement对象也可能是 字符串或数字
  // 该过程是通过pendingProps的children生成子fiberNode, 如果组件是<div>react</div>那么他的pendingProps.children是react字符串
  // 对比子reactElement和子current fiberNode，生成子wip fiberNode
  reconcileChildren(wip, nextChildren);
  return wip.child;
};

export const updateFunctionComponent = (wip: FiberNode) => {
  const nextChildren = renderWithHooks(wip);
  reconcileChildren(wip, nextChildren);
  return wip.child;
};

export const reconcileChildren = (
  wip: FiberNode,
  children: ReactElementType,
) => {
  const current = wip.alternate;
  if (current !== null) {
    // update
    // 首屏渲染时，renderRoot中会为hostRootFiber调用createWipFiber方法创建wip fiberNode,
    // 所以hostRootFibe在beginWork时已经有current fiberNode和wip fiberNode了，
    // 在reconcileChildren生成子wip fiber时会走这里,hostRootFiber只会标记一个placement flag,最终会将一整颗离屏dom一次性插入界面
    // hostRootFiber下面的fiber节点会走mountChildFibers
    wip.child = reconcileChildFibers(wip, current.child, children);
  } else {
    // mount
    wip.child = mountChildFibers(wip, null, children);
  }
};
