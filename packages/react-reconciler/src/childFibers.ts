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
    if (!shouldTrackEffects) {
      return;
    }
    // 给fiberNode拓展一个deletion属性，保存需要删除的子FiberNode
    const deletions = retureFiber.deletions;
    if (deletions === null) {
      retureFiber.deletions = [childToDelete];
      retureFiber.flags |= ChildDeletion;
    } else {
      deletions.push(childToDelete);
    }
  }

  function deleteRemainingChildren(
    returnFiber: FiberNode,
    firstChildToDelete: FiberNode | null,
  ) {
    let currentChildToDelete: FiberNode | null;
    currentChildToDelete = firstChildToDelete;
    while (currentChildToDelete !== null) {
      deleteChild(returnFiber, currentChildToDelete);
      currentChildToDelete = currentChildToDelete.sibling;
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
    while (currentFiber !== null) {
      const key = currentFiber.key;
      const type = currentFiber.type;
      if (key === element.key) {
        // 最开始少了reactElement的合法校验
        if (element.$$typeof === REACT_ELEMENT_TYPE) {
          if (type === element.type) {
            // 复用 注意这里用的props是babel解析jsx后拿到在标签上的props，不是currentFiber上的，currentFiber是旧的props
            const existing = useFiber(currentFiber, element.props);
            // 单节点diff时 key相同,type相同, 说明其他节点不会复用，直接删除
            deleteRemainingChildren(returnFiber, currentFiber.sibling);
            existing.return = returnFiber;
            return existing;
          } else {
            // key相当，但是type不相等，可能是html标签改变了，不能复用
            // 唯一一个key相同的子节点不能复用，可以直接删掉所有的节点
            deleteRemainingChildren(returnFiber, currentFiber);
            break;
          }
        } else {
          if (__DEV__) {
            console.warn("未实现的类型");
          }
          break;
        }
      } else {
        // 新旧key不同,需要删除
        deleteChild(returnFiber, currentFiber);
        currentFiber = currentFiber.sibling;
      }
    }
    // 根据reactElement创建fiber
    const fiber = createFiberFromElement(element);
    // 创建好子fiber后，与return连接
    fiber.return = returnFiber;
    return fiber;
  };

  type ExistingChildrenType = Map<string | number, FiberNode>;

  function updateFromMap(
    returnFiber: FiberNode,
    existingChildrenMap: ExistingChildrenType,
    index: number,
    element: any,
  ) {
    const keyToUse = element.key !== null ? element.key : index;
    const before = existingChildrenMap.get(keyToUse);

    // 当前element是string或number的情况，说明最新的fiber是HostText, 判断之前fiber是否也是HostText类型
    if (typeof element === "string" || typeof element === "number") {
      // 如果之前的fiber也是HostText类型，可以复用
      if (before?.tag === HostText) {
        // 将复用的fiber从existingChildrenMap中删掉
        existingChildrenMap.delete(keyToUse);
        return useFiber(before, { content: element + "" });
      }
      // 新建一个HostText类型的fiberNode
      return new FiberNode(HostText, { content: element + "" }, null);
    }
    // ReactElement 对象或函数类型
    if (typeof element === "object" && element !== "null") {
      switch (element.$$typeof) {
        case REACT_ELEMENT_TYPE: {
          if (before) {
            // key相同，type也相同才能复用
            if (before.type === element.type) {
              existingChildrenMap.delete(keyToUse);
              return useFiber(before, element.props);
            }
          }
          return createFiberFromElement(element);
        }
      }

      if (Array.isArray(element) && __DEV__) {
        console.warn("未实现的数组子节点类型");
      }
    }

    return null;
  }

  function reconcileChildrenArray(
    returnFiber: FiberNode,
    currentFirstChild: FiberNode | null,
    newChildren: any[],
  ) {
    // 1 将当前子节点存入 map
    const existingChildrenMap: ExistingChildrenType = new Map();
    let lastPlacedIndex: number = 0;
    let lastNewFiber: FiberNode | null = null;
    let firstNewFiber: FiberNode | null = null;
    let current = currentFirstChild;
    while (current !== null) {
      existingChildrenMap.set(
        current.key ? current.key : current.index,
        current,
      );
      current = current.sibling;
    }

    // 遍历新子节点的element
    for (let i = 0; i < newChildren.length; i++) {
      // 2 判断是否能复用
      const after = newChildren[i];
      const newFiber = updateFromMap(
        returnFiber,
        existingChildrenMap,
        i,
        after,
      );

      // jsx返回false或者null
      if (newFiber === null) {
        continue;
      }

      // 3 判断是插入或移动
      newFiber.index = i; // 给多节点fiber加上index，用于之后的reconcile
      newFiber.return = returnFiber;

      if (lastNewFiber === null) {
        firstNewFiber = newFiber;
        lastNewFiber = newFiber;
      } else {
        // 将新fiber和上一次的fiber链接
        lastNewFiber.sibling = newFiber;
        lastNewFiber = lastNewFiber.sibling;
      }

      if (!shouldTrackEffects) {
        continue;
      }

      //  newFiber.alternate !== null,说明newFiber复用了current fiber
      const currentFiber = newFiber.alternate;
      if (currentFiber !== null) {
        // 比较这一次复用节点index是否比上一次复用节点的index小，如果是说明那么节点向右移了
        const oldIndex = currentFiber.index;
        if (oldIndex < lastPlacedIndex) {
          newFiber.flags |= Placement;
        } else {
          // lastPlacedIndex始终是原来节点位置中最右边可复用的fiber索引,所以拿后续可复用节点的current位置和lastPlacedIndex比较
          lastPlacedIndex = oldIndex;
        }
      } else {
        // current === null，说明是新建的fiber
        newFiber.flags |= Placement;
      }
    }

    // 4 将existingChildrenMap剩余的节点删除
    existingChildrenMap.forEach((fiber) => {
      deleteChild(returnFiber, fiber);
    });

    return firstNewFiber;
  }

  // 叶子节点,父节点为原生html标签或FC,传入的content为string或number
  const reconcileSingleTextNode = (
    returnFiber: FiberNode,
    currentFiber: FiberNode | null,
    content: string | number,
  ) => {
    while (currentFiber !== null) {
      // update阶段
      if (currentFiber.tag === HostText) {
        // tag类型没变，可以复用
        const existing = useFiber(currentFiber, { content });
        existing.return = returnFiber;
        // !! bug 之前第二个参数是currentFiber,所以把复用fiber的returnFiber打上了childDeletion,导致stateNode被删除
        deleteRemainingChildren(returnFiber, currentFiber.sibling);
        return existing;
      } else {
        // tag变了，先删除，比如<div> => 666
        deleteChild(returnFiber, currentFiber);
        currentFiber = currentFiber.sibling;
      }
    }
    // 直接创建HostTextComponent
    const fiber = new FiberNode(HostText, { content }, null);
    // 创建好子fiber后，与return连接
    fiber.return = returnFiber;
    return fiber;
  };

  function useFiber(fiber: FiberNode, props: Props) {
    const existing = createWorkInProgress(fiber, props);
    existing.index = 0;
    existing.sibling = null;
    return existing;
  }
  return function reconcileChildFibers(
    returnFiber: FiberNode,
    currentFiber: FiberNode | null,
    newChild?: ReactElementType,
  ) {
    //child对应的ReactElement 可能是object function array 还可能是string number

    // 先判断, 对象或函数 HostComponent 或 FunctionComponent
    if (typeof newChild === "object" && newChild !== null) {
      // 单节点的话, newChild是一个reactElement对象，就会有$$typeof属性
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

      // 多节点类型 是一个reactElement数组
      if (Array.isArray(newChild)) {
        // 如果newChild为多节点,那么currentFiber就是一串child链表,currentFiber也是第一个child
        return reconcileChildrenArray(returnFiber, currentFiber, newChild);
      }
    }

    // 如果是string，number，那么对应的fier是hostText节点
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
