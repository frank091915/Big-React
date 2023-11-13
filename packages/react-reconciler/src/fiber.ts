import { Props, Key, Ref } from "shared/ReactTypes";
import { WorkTag } from "./workTags";
import { FlagType, noFlags } from "./fiberFlags";
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

  memoizedProops: Props | null;
  alternate: Props | null;
  flags: FlagType;

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
    this.memoizedProops = null;

    // 用于指向 另一颗树的FiberNode, 如果是current树的FiberNode,
    // 那么alternate指向workInProgress中对应的FiberNode, 反之亦然
    this.alternate = null;
    // 副作用
    this.flags = noFlags;
  }
}
