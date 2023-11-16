import { ReactElementType } from "shared/ReactTypes";
import { mountChildFibers, reconcileChildFibers } from "./childFibers";
import { FiberNode } from "./fiber";
import { processUpdateQueue, UpdateQueue } from "./updateQueue";
import { HostComponent, HostRoot, HostText } from "./workTags";
// 递阶段：beginWork
export const beginWork = (fiber: FiberNode) => {
  // 比较 reactElement 和 fiberNode, 生成返回子FiberNode
  // 根据tag进行不同处理
  switch (fiber.tag) {
    case HostRoot:
      return updateHostRoot(fiber);
    case HostComponent:
      return updateHostComponent(fiber);
    case HostText:
      // 没有子节点了 说明已经遍历到叶子节点，开始completeWork
      return null;
    default:
      console.warn("未进行处理的类型");
      break;
  }
};

export const updateHostRoot = (wip: FiberNode) => {
  // 计算最新状态
  const baseState = wip.memoizedState;
  let pendingUpdate = (wip.updateQueue as UpdateQueue<Element | null>).shared
    .pending;
  const { memoizedState } = processUpdateQueue(baseState, pendingUpdate);
  pendingUpdate = null;
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
  // 对比子reactElement和子current fiberNode，生成子wip fiberNode
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
    reconcileChildFibers(wip, current.child, children);
  } else {
    // mount
    mountChildFibers(wip, null, children);
  }
};
