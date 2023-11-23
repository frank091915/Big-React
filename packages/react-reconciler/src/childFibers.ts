import { REACT_ELEMENT_TYPE } from "shared/ReactSymbols";
import { ReactElementType } from "shared/ReactTypes";
import { FiberNode, createFiberFromElement } from "./fiber";
import { placement } from "./fiberFlags";
import { HostText } from "./workTags";

export const ChildReconciler = (shouldTrackEffects: boolean) => {
  function placeSingleFiber(fiber: FiberNode) {
    // 当前传入的fiber为才创建的wip fiber,如果alternate为null，说明是首屏渲染
    // 首屏渲染 且 应该追踪副作用的时候 标记副作用
    if (shouldTrackEffects && fiber.alternate === null) {
      fiber.flags |= placement;
    }
    return fiber;
  }
  // 根据reactElement创建子fiber
  const reconcileSingleElement = (
    returnFiber: FiberNode,
    currentFiber: FiberNode | null,
    children: ReactElementType,
  ) => {
    // 根据reactElement创建fiber
    const fiber = createFiberFromElement(children);
    // 创建好子fiber后，与return连接
    fiber.return = returnFiber;
    return fiber;
  };
  // 叶子节点,父节点为原生html标签,传入的content为string或number
  const reconcileSingleTextNode = (
    returnFiber: FiberNode,
    currentFiber: FiberNode | null,
    content: string | number,
  ) => {
    // 直接创建HostTextComponent
    const fiber = new FiberNode(HostText, { content }, null);
    // 创建好子fiber后，与return连接
    fiber.return = returnFiber;
    return fiber;
  };
  return function reconcileChildFibers(
    returnFiber: FiberNode,
    currentFiber: FiberNode | null,
    newChild?: ReactElementType,
  ) {
    // 先判断ReactElementType类型, 对象 还是文本节点
    if (typeof newChild === "object" && newChild !== null) {
      switch (newChild?.$$typeof) {
        case REACT_ELEMENT_TYPE:
          return placeSingleFiber(
            reconcileSingleElement(returnFiber, currentFiber, newChild),
          );
        default:
          if (__DEV__) {
            console.warn("未实现的reconscile类型", newChild);
          }
      }
    }
    // TODO: 多节点类型
    if (typeof newChild === "string" || typeof newChild === "number") {
      // updateHostComponent -> ChildReconciler -> reconcileChildFibers
      // 此时newChild的reactElement为字符串或number
      return placeSingleFiber(
        reconcileSingleTextNode(returnFiber, currentFiber, newChild),
      );
    }

    if (__DEV__) {
      console.warn("未实现的reconscile类型", newChild);
    }
    return null;
  };
};

export const reconcileChildFibers = ChildReconciler(false);
export const mountChildFibers = ChildReconciler(true);
