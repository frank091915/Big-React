import { appendChildToContainer, Container } from "hostConfig";
import { FiberNode, FiberRootNode } from "./fiber";
import { MutationMask, noFlags, placement } from "./fiberFlags";
import { HostComponent, HostRoot, HostText } from "./workTags";

let nextEffect: FiberNode | null;

export const commitMutationEffects = (finishedWork: FiberNode) => {
  console.log("commitMutationEffects");
  // 向下遍历，开启外层while循环,找到没有subtreeFlags的节点或是叶子节点
  // 分支语句一: 如果当前节点有child(child !== null)且该节点的subtreeFlags包含MutationMask(nextEffects.subtreeFlags & MutationMask !== noFlags)
  // 分支语句一的执行命令: nextEffect = nextEffect.child 继续最外层循环
  // 分支语句二: 开启向上遍历,开启内层while循环,调用commitMutationEffectsOnFiber,如果当前节点有sibling,则给nextEffect赋值为其sibling,break内层循环继续外层循环
  //            没有的话一直向上找祖先节点的兄弟节点,直到回到hostRoot停止整个循环,nextEffect.return === null终止整个循环
  nextEffect = finishedWork.child;
  while (nextEffect !== null) {
    if (
      (nextEffect.subTreeFlags & MutationMask) !== noFlags &&
      nextEffect.child !== null
    ) {
      nextEffect = nextEffect.child;
    } else {
      // 父节点subtreeFlags包含MutationMask,但是节点本身没有subtreeFlags,说明节点本身有flags
      commitMutationEffectsOnFiber(nextEffect);
      up: while (nextEffect !== null) {
        const sibling: FiberNode | null = nextEffect.sibling;
        if (sibling !== null) {
          nextEffect = nextEffect.sibling;
          break up;
        } else {
          nextEffect = nextEffect.return;
        }
      }
    }
  }
};

function commitMutationEffectsOnFiber(finishedWork: FiberNode) {
  console.log("commitMutationEffectsOnFiber", finishedWork, "finishedWork");
  // finishedWork是本身包含flags的fiberNode
  const flags = finishedWork.flags;
  if ((flags & placement) !== noFlags) {
    commitPlacement(finishedWork);
    // 执行placement操作后,消除placement的flag
    finishedWork.flags &= ~placement;
  }
}

function commitPlacement(finishedWork: FiberNode) {
  // 插入操作需要两个变量: parent的dom, finishedWork对应的dom
  const hostParent = getHostParent(finishedWork);
  console.log(hostParent, "hostParent");
  if (hostParent !== null) {
    // 然后将finishedWork对应的dom插入parent的dom, appendPlacementNodeIntoContainer
    appendPlacementNodeIntoContainer(finishedWork, hostParent);
  }
}

function getHostParent(fiber: FiberNode): Container | null {
  const parent = fiber.return;
  while (parent !== null) {
    const tag = parent.tag;
    if (tag === HostComponent) {
      return parent.stateNode as Container;
    } else if (tag === HostRoot) {
      return (parent.stateNode as FiberRootNode).container;
    }
  }
  if (__DEV__) {
    console.warn("未找到parent dom");
  }
  return null;
}

function appendPlacementNodeIntoContainer(
  finishedWork: FiberNode,
  hostParent: Container,
) {
  console.log("appendPlacementNodeIntoContainer", finishedWork, hostParent);
  // 传进来的finishedWork不一定就是hostComponent或者hostText,所以要向下遍历找到对应的host节点
  if (finishedWork.tag === HostComponent || finishedWork.tag === HostText) {
    // 该方法与宿主有关，先放到hostConfig.ts中
    appendChildToContainer(finishedWork.stateNode, hostParent);
  }
  const child = finishedWork.child;
  if (child !== null) {
    appendPlacementNodeIntoContainer(child, hostParent);
    let sibling = child.sibling;
    while (sibling !== null) {
      appendPlacementNodeIntoContainer(sibling, hostParent);
      sibling = sibling.sibling;
    }
  }
}
