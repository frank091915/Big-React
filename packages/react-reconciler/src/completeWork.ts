import {
  appendInitialChild,
  createInstance,
  createTextInstance,
} from "hostConfig";
import { Container } from "react-dom/src/hostConfig";
import { FiberNode } from "./fiber";
import { NoFlags, Update } from "./fiberFlags";
import {
  FunctionComponent,
  HostComponent,
  HostRoot,
  HostText,
} from "./workTags";

export const completeWork = (wip: FiberNode) => {
  const newProps = wip.pendingProps;
  const current = wip.alternate;
  // 归阶段
  // 根据tag对fiber进行不同操作
  // hostComponent 创建dom实例, 然后将下一层所有子fiber对应的dom插入parent中
  // hostRoot收集下一层所有子fiber的flags
  switch (wip.tag) {
    case HostRoot:
      bubbleProperties(wip);
      return null;
    case HostComponent:
      // current === null且wip.stateNode有值时，才是mount阶段
      // 为什么要判断wip.stateNode？如果wip复用了，会继承current.stateNode
      // + 新建的fiberNode的stateNode为null，它的instance需要再插入下一层dom节点
      if (current !== null && wip.stateNode) {
        // update
      } else {
        // mount
        // 构建dom 这一步不一定生成浏览器中的dom节点，和宿主环境有关
        const instance = createInstance(wip.type, newProps);
        // 将dom插入dom树中
        appendAllChildren(instance, wip);
        // 当前处于归的阶段,当前dom树是目前最靠上的dom节点
        wip.stateNode = instance;
      }
      bubbleProperties(wip);
      return null;
    case HostText:
      if (current !== null && wip.stateNode) {
        // update
        // 判断content是否一致，有变化的话需要打上update的flag
        const oldContent = current.memoizedProps.content;
        const newContent = newProps.content;
        if (oldContent !== newContent) {
          markUpdate(wip);
        }
      } else {
        // mount
        const instance = createTextInstance(newProps.content);
        // hostText没有child所以不需要appendAllChildren
        wip.stateNode = instance;
      }
      bubbleProperties(wip);
      return null;
    case FunctionComponent:
      bubbleProperties(wip);
      return null;
    default:
      if (__DEV__) {
        console.warn("未执行的类型", wip.tag);
      }
  }
  return null;
};
// function A(){return <span>hello</span>}
// <B><A/></B> 如果父节点只有一个字节点的话，只需要直接插入字节点对应的stateNode
// <B>react<A/><A/></B> 多个字节点的话，对于子节点来说，还需要插入兄弟节点
// 将该节点下面所有子dom插入fiber中,因为fiber和dom节点不是一一对应的，所以要判断tag拿到dom节点
export const appendAllChildren = (parent: Container, wip: FiberNode) => {
  let node = wip.child;
  while (node != null) {
    // 第一步，首先向下遍历到第一层dom节点, HostComponent和HostText就插入到父节点,
    // 其他类型节点如functionComponent就接着向下遍历子节点，将下面第一层HostComponent和HostText类型的子节点插入父节点
    if (node.tag === HostComponent || node.tag === HostText) {
      // 特定的功能建议写成一个方法, 这样可以不耽误大概逻辑, 代码也会变得易读简洁,方法也方便管理
      appendInitialChild(parent, node?.stateNode);
    } else if (node.child !== null) {
      // 如果node不是hostRoot或者hostComponent,可以查看它的子节点
      node.child.return = node; // 建立节点之间的连接
      node = node.child;
      continue;
    }

    // 终止情况: 因为completeWork有一个归阶段，会往上遍历，如果走到当前wip，便停止while循环
    if (node == wip) {
      return;
    }

    // 到此，当前节点是hostComponent或hostText节点，或者是没有child的叶子节点了,轮到遍历到兄弟节点了
    // 第二步: 先判断有没有兄弟节点时，没有的话,则会往上,找祖先节点的兄弟节点

    // 一直往上找祖先节点的sibling的节点，跳过没有sibling的祖先节点，
    // 有两种可能,找到祖先节点的sibling重新开始大循环, 没有祖先sibling了，直到node.return === null || node === wip,整个循环停止
    while (node.sibling === null) {
      // 终止情况: 当回到hostRoot或原点时终止遍历
      if (node.return === null || node === wip) {
        return;
      }
      // 向上遍历
      node = node.return;
    }
    // node赋值为sibling,开始收集兄弟节点的dom
    node.sibling.return = node.return; // 建立连接
    node = node.sibling;
  }
};

// flags散落在不同各个fiber节点，怎么快速找到他们?
// 可以利用completeWork向上遍历阶段可以将子fiber的flags一层一层冒泡到父fiber节点
// 给fiberNode添加一个subtreeFlags保存子fiber的flags
function bubbleProperties(wip: FiberNode) {
  let subtreeFlags = NoFlags;
  let child = wip.child;
  while (child !== null) {
    // 收集子节点和其后代节点上的flags
    subtreeFlags |= child.subTreeFlags;
    subtreeFlags |= child.flags;

    child.return = wip;
    child = child.sibling;
  }
  wip.subTreeFlags |= subtreeFlags;
}

function markUpdate(fiber: FiberNode) {
  fiber.flags != Update;
}
