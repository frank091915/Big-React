import { Props, Key, Ref, ReactElementType } from "shared/ReactTypes";
import { FunctionComponent, HostComponent, WorkTag } from "./workTags";
import { FlagType, noFlags } from "./fiberFlags";
// 为啥不直接引用当前目录的hostConfig呢，这是因为不同宿主环境有不同的container，
// 直接写死引用当前目录的hostConfig的话，把hostConfig的实现限制在了react-reconciler包,
// react-dom包也会有自己的hostConfig, 我猜后面会用到不同环境的hostConfig
import { Container } from "hostConfig";
export class FiberNode {
  /**
   * @param tag fiber type
   * @param pendingProps those props that will changes
   * @param key ReactElement key
   */
  tag: WorkTag;
  key: Key;
  pendingProps: Props;
  stateNode: any;
  type: any;
  ref: Ref;

  return: FiberNode | null;
  sibling: FiberNode | null;
  child: FiberNode | null;
  index: number;

  memoizedProps: Props | null;
  memoizedState: any;
  updateQueue: unknown;
  alternate: Props | null;
  flags: FlagType;
  subTreeFlags: FlagType;

  constructor(tag: WorkTag, pendingProps: Props, key: Key) {
    // 实例
    this.tag = tag;
    this.key = key;
    // 如果这个fibernode是HostComponent(原生html节点),
    // 那个它的fibernode的stateNode就是改html的dom节点
    this.stateNode = null;
    // 如果该组件是一个functionCompoent, 那么他的tag为0，type为改函数组件本身
    this.type = null;

    // 节点之间关系, 构成树状结构
    // return 代表父fiber节点,react把fiber节点当作一个工作单元
    // 当一个节点完成工作后，会轮到他的父fibernode继续工作
    this.return = null;
    // 右边兄弟节点
    this.sibling = null;
    this.child = null;
    // 表示这个是其父节点的第几个字节点
    this.index = 0;

    this.ref = null;

    // 作为工作单元
    // 这个工作单元刚开始工作的时候 的 props
    this.pendingProps = pendingProps;
    // 工作完后(最终确定下来的props)
    this.memoizedProps = null;
    this.memoizedState = null;
    this.updateQueue = null;
    // 用于指向 另一颗树的FiberNode, 如果是current树的FiberNode,
    // 那么alternate指向workInProgress中对应的FiberNode, 反之亦然
    this.alternate = null;
    // 副作用
    this.flags = noFlags;
    this.subTreeFlags = noFlags;
  }
}

export class FiberRootNode {
  // container保存的是在宿主环境挂载的节点，所以不只是dom节点，浏览器环境中container应该是DOMElement类型
  container: Container;
  current: FiberNode;
  finishedWork: FiberNode | null; // 更新完成后的 hostRootFiber
  constructor(container: Container, hostRootFiber: FiberNode) {
    this.container = container;
    this.current = hostRootFiber;
    hostRootFiber.stateNode = this;
    this.finishedWork = null;
  }
}

export const createWorkInProgress = (
  current: FiberNode,
  pendingProps: Props,
): FiberNode => {
  let wip = current.alternate;
  if (wip == null) {
    // mount
    // 新建一个 wip
    wip = new FiberNode(current.tag, pendingProps, current.key);
    // 继承stateNode
    wip.stateNode = current.stateNode;

    // 通过alternate连接wip和current
    wip.alternate = current;
    current.alternate = wip;
  } else {
    // update
    wip.pendingProps = current.pendingProps;
    // cleanup effects
    wip.flags = noFlags;
    wip.subTreeFlags = noFlags;
  }
  // 继承type和type,child,memoizedProps和memoizedState
  wip.type = current.type;
  wip.child = current.child;
  wip.memoizedProps = current.memoizedProps;
  wip.memoizedState = current.memoizedState;
  // issue 不要忘记继承current的updateQueue,不然wip到时候没有updateQueue为null,导致计算最新状态时会报错
  wip.updateQueue = current.updateQueue;

  return wip;
};

export const createFiberFromElement = (element: ReactElementType) => {
  const { type, key, props } = element;
  // 先假设tag为FunctionComponent
  let fiberTag: WorkTag = FunctionComponent;
  if (typeof type === "string") {
    // 如果是 hostComponent,那么这个reactElement的type为 html的tag字符串
    fiberTag = HostComponent;
  } else if (type !== "function" && __DEV__) {
    // 开发时尽量想到边界场景，打印消息方便调试
    console.warn("未定义的类型", element);
  }
  const childFiber = new FiberNode(fiberTag, props, key);
  childFiber.type = type;
  return childFiber;
};
