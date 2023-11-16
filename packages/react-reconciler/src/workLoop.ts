import { beginWork } from "./beginWork";
import { completeWork } from "./completeWork";
import { createWorkInProgress, FiberNode, FiberRootNode } from "./fiber";
import { HostRoot } from "./workTags";
// 整体递归流程
// 全局的指针 指向当前FiberNode节点
let workInProgress: FiberNode | null = null;

export const scheduleUpdateOnFiber = (hostRootFiber: FiberNode) => {
  // TODO: 任务调度
  // 更新可能发生在任意fiberNode,找到FiberRootNode根节点
  const root = markUpdateFromFiberRoot(hostRootFiber);
  renderRoot(root);
};
export const markUpdateFromFiberRoot = (fiber: FiberNode) => {
  while (fiber.return) {
    fiber = fiber.return;
  }
  if (fiber.tag === HostRoot) {
    return fiber.stateNode;
  }
  return null;
};

function prepareFreshStack(root: FiberRootNode) {
  // FiberRootNode 不能直接当作workInProgress,需要调用创建wip的方法
  workInProgress = createWorkInProgress(root.current, {});
}

// 最终执行的方法叫 renderRoot,参数是一个特殊FiberNode: FiberRootNode
function renderRoot(root: FiberRootNode) {
  // 初始化，让workInProgress指向第一个遍历的FiberNode
  prepareFreshStack(root);

  // 开始遍历
  do {
    try {
      workLoop();
      break;
    } catch (err) {
      if (__DEV__) {
        console.log("sth went wrong when runing workloop");
      }
      workInProgress = null;
    }
  } while (true);
}

// 开启遍历，每次循环就是一次工作，由performUnitOfWork执行
function workLoop() {
  while (workInProgress != null) {
    performUnitOfWork(workInProgress);
  }
}

function performUnitOfWork(fiber: FiberNode) {
  // beginWork 比较ReactElement 与fiberNode,生成子fiberNode
  const next = beginWork(fiber);
  fiber.memoizedProps = fiber.pendingProps;
  // 如果next有值，说明有子fiberNode，按照深度优先遍历原则，开始遍历其子节点

  // 如果没有返回子节点了，说明已经遍历到最深处，开始归阶段
  if (next == null) {
    completeUnitOfWork(fiber);
  } else {
    workInProgress = next;
    // 当workInProgress有值时，workLoop会接着调用performUnitOfWork 进行递阶段，直到遍历到最深层
  }
}

function completeUnitOfWork(fiber: FiberNode) {
  let node: FiberNode | null = fiber;
  // 首先该节点先进行completeWork
  // 此时该fiberNode已经在归阶段：有兄弟节点，右边兄弟节点进入递阶段，没有的话，进入父节点的归阶段
  // 一直遍历兄弟节点执行completeWork，最后进入父节点的归阶段
  do {
    completeWork(fiber);
    const sibling = node.sibling;

    if (sibling !== null) {
      // 兄弟节点进入递阶段
      workInProgress = sibling;
      return;
    }
    node = node.return;
    workInProgress = node;
  } while (node !== null);
}
console.log(renderRoot, workLoop);
