import { Container } from "hostConfig";
import { ReactElementType } from "shared/ReactTypes";
import { FiberNode, FiberRootNode } from "./fiber";
import {
  createUpdate,
  createUpdateQueue,
  enqueueUpdate,
  UpdateQueue,
} from "./updateQueue";
import { HostRoot } from "./workTags";
import { scheduleUpdateOnFiber } from "./workLoop";

// 在执行React.CreateRoot方法时，内部会调用createContainer
export const createContainer = (container: Container) => {
  // 创建hostRootFiber节点(宿主环境挂载节点对应的fiberNode) 参数: tag,pendeingProps,key
  const hostRootFiber = new FiberNode(HostRoot, {}, null);
  // 创建fiberRootNode 参数: container, hostRootFiber
  const root = new FiberRootNode(container, hostRootFiber);
  // 给hostRootFiber创建一个updateQueue与更新机制对接
  hostRootFiber.updateQueue = createUpdateQueue();
  console.log(hostRootFiber, "createContainer hostRootFiber");
  return root;
};

// 在执行root.render(<App/>)时，内部会调用updateContainer
export const updateContainer = (
  reactElement: ReactElementType | null,
  root: FiberRootNode,
) => {
  const hostRootFiber = root.current;
  const update = createUpdate<ReactElementType | null>(reactElement);
  enqueueUpdate(
    hostRootFiber.updateQueue as UpdateQueue<ReactElementType | null>,
    update,
  );
  console.log(hostRootFiber, "hostRootFiber");
  scheduleUpdateOnFiber(hostRootFiber);
  return reactElement;
};
