import {
  appendChildToContainer,
  commitDeletions,
  commitUpdate,
  Container,
  insertChildToContainer,
  Instance,
} from "hostConfig";
import { FiberNode, FiberRootNode } from "./fiber";
import {
  ChildDeletion,
  MutationMask,
  NoFlags,
  Placement,
  Update,
} from "./fiberFlags";
import { HostComponent, HostRoot, HostText } from "./workTags";

let nextEffect: FiberNode | null;

export const commitMutationEffects = (finishedWork: FiberNode) => {
  // 向下遍历，开启外层while循环,找到没有subtreeFlags的节点或是叶子节点
  // 分支语句一: 如果当前节点有child(child !== null)且该节点的subtreeFlags包含MutationMask(nextEffects.subtreeFlags & MutationMask !== NoFlags)
  // 分支语句一的执行命令: nextEffect = nextEffect.child 继续最外层循环
  // 分支语句二: 开启向上遍历,开启内层while循环,调用commitMutationEffectsOnFiber,如果当前节点有sibling,则给nextEffect赋值为其sibling,break内层循环继续外层循环
  //            没有的话一直向上找祖先节点的兄弟节点,直到回到hostRoot停止整个循环,nextEffect.return === null终止整个循环
  nextEffect = finishedWork;
  while (nextEffect !== null) {
    if (
      (nextEffect.subTreeFlags & MutationMask) !== NoFlags &&
      nextEffect.child !== null
    ) {
      nextEffect = nextEffect.child;
    } else {
      // 父节点subtreeFlags包含MutationMask,但是节点本身没有subtreeFlags,说明节点本身有flags
      up: while (nextEffect !== null) {
        commitMutationEffectsOnFiber(nextEffect);
        const sibling: FiberNode | null = nextEffect.sibling;
        if (sibling !== null) {
          nextEffect = sibling;
          break up;
        } else {
          nextEffect = nextEffect.return;
        }
      }
    }
  }
};

function commitMutationEffectsOnFiber(finishedWork: FiberNode) {
  // finishedWork是本身包含flags的fiberNode
  const flags = finishedWork.flags;
  if ((flags & Placement) !== NoFlags) {
    commitPlacement(finishedWork);
    // 执行placement操作后,消除placement的flag
    finishedWork.flags &= ~Placement;
  }
  // 处理update flags
  if ((flags & Update) !== NoFlags) {
    // commiteUpdate的逻辑取决于宿主环境，放到react-dom的hostConfig中实现
    commitUpdate(finishedWork);
    // 执行placement操作后,消除placement的flag
    finishedWork.flags &= ~Update;
  }

  // 处理childDeletions flags
  if ((flags & ChildDeletion) !== NoFlags) {
    // commiteUpdate的逻辑取决于宿主环境，放到react-dom的hostConfig中实现
    finishedWork.deletions?.forEach((childToDelete) => {
      commitDeletions(childToDelete);
    });
    // 执行placement操作后,消除placement的flag
    finishedWork.flags &= ~ChildDeletion;
  }
}

function commitPlacement(finishedWork: FiberNode) {
  if (__DEV__) {
    console.warn("执行placement操作", finishedWork);
  }
  // 插入操作需要两个变量: parent的dom, finishedWork对应的dom
  const hostParent = getHostParent(finishedWork);

  const hostSibling = getHostSibling(finishedWork);
  if (hostParent !== null) {
    // 然后将finishedWork对应的dom插入parent的dom, insertOrAppendPlacementNodeIntoContainer
    insertOrAppendPlacementNodeIntoContainer(
      finishedWork,
      hostParent,
      hostSibling,
    );
  }
}

export function getHostSibling(fiber: FiberNode) {
  let node: FiberNode = fiber;
  findHostSibling: while (true) {
    // node没有sibling时，向上遍历, 直到找到有sibling的祖先节点，如果祖先节点是HostRoot/HostComponent类型或者hostRootFiber(parent === null)
    // 如果return节点是hostComponent,那么该节点在上一层级没有兄弟节点，再往上找，就算找到host类型的sibling，也是其祖先节点层级的hostSibling
    while (node.sibling === null) {
      //
      const parent = node.return;
      if (
        parent === null ||
        parent.tag === HostRoot ||
        parent.tag === HostComponent
      ) {
        return null;
      }
      node = parent;
    }

    // 将node指向其sibling，向下遍历寻找host类型sibling
    node.sibling.return = node;
    node = node.sibling;

    // 当前节点不是host类型时，一直往下遍历，直到找到host类型节点，如果中途遇到有placement副作用或叶子节点，结束循环
    while (node.tag !== HostText && node.tag !== HostComponent) {
      // 判断是否有placement副作用，如果有的话，则是不稳定的节点，不再往下找，开始下一轮大循环从它的sibling开始找
      if ((node.flags &= Placement) !== NoFlags) {
        continue findHostSibling;
      }

      if (node.child === null) {
        // 找到叶子节点后，开始从其sibling开始找，没有的话，向上遍历
        continue findHostSibling;
      } else {
        node.child.return = node;
        node = node.child;
      }
    }

    // 执行到这里，node是host类型
    // 判断是不是有placement副作用，没有的话返回stateNode
    // 如果有副作用，开始下一轮大循环
    if ((node.flags &= Placement) !== NoFlags) {
      return node.stateNode;
    }
  }
}

export function getHostParent(fiber: FiberNode): Container | null {
  let parent = fiber.return;
  while (parent !== null) {
    const tag = parent.tag;
    if (tag === HostComponent) {
      return parent.stateNode as Container;
    } else if (tag === HostRoot) {
      return (parent.stateNode as FiberRootNode).container;
    }
    parent = parent.return;
  }
  if (__DEV__) {
    console.warn("未找到parent dom");
  }
  return null;
}

function insertOrAppendPlacementNodeIntoContainer(
  finishedWork: FiberNode,
  hostParent: Container,
  before?: Instance,
) {
  // 传进来的finishedWork不一定就是hostComponent或者hostText,所以要向下遍历找到对应的host节点
  if (finishedWork.tag === HostComponent || finishedWork.tag === HostText) {
    // 该方法与宿主有关，先放到hostConfig.ts中
    if (before) {
      insertChildToContainer(finishedWork.stateNode, hostParent, before);
    } else {
      appendChildToContainer(hostParent, finishedWork.stateNode);
    }
    return;
  }
  const child = finishedWork.child;
  // 如果当前fiber节点不是host类型,那么它可能拥有多个子节点，而且处于不同层级，所以要将下面第一层所有子host类型fiber插入到hostParent中
  if (child !== null) {
    insertOrAppendPlacementNodeIntoContainer(child, hostParent, before);
    let sibling = child.sibling;
    while (sibling !== null) {
      insertOrAppendPlacementNodeIntoContainer(sibling, hostParent, before);
      sibling = sibling.sibling;
    }
  }
}
