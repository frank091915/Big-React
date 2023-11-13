import { completeWork } from "./beginWork";
import { beginWork } from "./completeWork";
import { FiberNode } from "./fiber";
// 整体递归流程
// 全局的指针 指向当前FiberNode节点
let workInProgress: FiberNode | null = null;

function prepareFreshStack(fiber: FiberNode) {
  workInProgress = fiber;
}

// 最终执行的方法叫 renderRoot
function renderRoot(root: FiberNode) {
  // 初始化，让workInProgress指向第一个遍历的FiberNode
  prepareFreshStack(root);

  // 开始遍历
  do {
    try {
      function workLoop();
      break;
    } catch (err) {
      console.log("sth went wrong when runing workloop");
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
  fiber.memoizedProops = fiber.pendingProps;
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
      // 兄弟节点进入第阶段
      workInProgress = sibling;
      return;
    }
    node = node.return;
    workInProgress = node;
  } while (node !== null);
}
