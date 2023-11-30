import { REACT_ELEMENT_TYPE } from "shared/ReactSymbols";
import { Props, ReactElementType } from "shared/ReactTypes";
import {
  FiberNode,
  createFiberFromElement,
  createWorkInProgress,
} from "./fiber";
import { ChildDeletion, Placement } from "./fiberFlags";
import { HostText } from "./workTags";

export const ChildReconciler = (shouldTrackEffects: boolean) => {
  function placeSingleFiber(fiber: FiberNode) {
    // 当前传入的fiber为才创建的wip fiber,如果alternate为null，说明是首屏渲染
    // 首屏渲染 且 应该追踪副作用的时候 标记副作用
    if (shouldTrackEffects && fiber.alternate === null) {
      fiber.flags |= Placement;
    }
    return fiber;
  }

  function deleteChild(retureFiber: FiberNode, childToDelete: FiberNode) {
    // 给fiberNode拓展一个deletion属性，保存需要删除的子FiberNode
    let deletions = retureFiber.deletions;
    if (deletions === null) {
      deletions = [childToDelete];
      retureFiber.flags |= ChildDeletion;
    } else {
      deletions.push(childToDelete);
    }
  }

  // 根据reactElement创建子fiber
  const reconcileSingleElement = (
    returnFiber: FiberNode,
    currentFiber: FiberNode | null,
    element: ReactElementType,
  ) => {
    // 如果当前currentFiber为null,说明为mount阶段
    // update阶段需要判断是否能复用, key和type同时不变则可以，否则先修改returnFiber的deletiongs,然后打上childDeletion的flag
    work: if (currentFiber !== null) {
      const key = currentFiber.key;
      const type = currentFiber.type;
      if (key === element.key) {
        // 最开始少了reactElement的合法校验
        if (element.$$typeof === REACT_ELEMENT_TYPE) {
          if (type === element.type) {
            // 复用 注意这里用的props是babel解析jsx后拿到在标签上的props，不是currentFiber上的，currentFiber是旧的props
            const existing = useFiber(currentFiber, element.props);
            existing.return = returnFiber;
            return existing;
          } else {
            // key相当，但是type不相等，说明html标签改变了，不能复用
            // 当前子节点需要删除删除
            deleteChild(returnFiber, currentFiber);
            break work;
          }
        } else {
          if (__DEV__) {
            console.warn("未实现的类型");
          }
          break work;
        }
      } else {
        // 新旧key不同,需要删除
        deleteChild(returnFiber, currentFiber);
      }
    }
    // 根据reactElement创建fiber
    const fiber = createFiberFromElement(element);
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
    if (currentFiber !== null) {
      // update阶段
      if (currentFiber.tag === HostText) {
        // tag类型没变，可以复用
        const existing = useFiber(currentFiber, { content });
        existing.return = returnFiber;
      } else {
        // tag变了，先删除，比如<div> => 666
        deleteChild(returnFiber, currentFiber);
      }
    }
    // 直接创建HostTextComponent
    const fiber = new FiberNode(HostText, { content }, null);
    // 创建好子fiber后，与return连接
    fiber.return = returnFiber;
    return fiber;
  };

  function useFiber(fiber: FiberNode, props: Props) {
    const existing = createWorkInProgress(fiber, fiber.pendingProps);
    existing.index = 0;
    existing.sibling = null;
    return existing;
  }
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

    // 既不是object又不是string或者number，兜底操作，直接从fiber中删除
    if (currentFiber !== null) {
      deleteChild(returnFiber, currentFiber);
    }

    if (__DEV__) {
      console.warn("未实现的reconscile类型", newChild);
    }
    return null;
  };
};

export const reconcileChildFibers = ChildReconciler(true);
export const mountChildFibers = ChildReconciler(false);
