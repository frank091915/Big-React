import { getHostParent } from "react-reconciler/src/commitWork";
import { FiberNode } from "react-reconciler/src/fiber";
import {
  FunctionComponent,
  HostComponent,
  HostText,
} from "react-reconciler/src/workTags";
import { Props } from "shared/ReactTypes";

// 描述宿主环境的文件
export type Container = Element;
export type Instance = Element;
export type TextInstance = Text;

export const createInstance = (type: string, props: Props) => {
  // TODO: 处理props
  const element = document.createElement(type);
  return element;
};

export const appendInitialChild = (
  parent: Instance | Container,
  child: Instance,
) => {
  parent.appendChild(child);
};

export const createTextInstance = (content: string) => {
  return document.createTextNode(content);
};

export const appendChildToContainer = appendInitialChild;

export const commitUpdate = (fiber: FiberNode) => {
  switch (fiber.tag) {
    case HostText:
      // memoizedProps在fiberNode beginWork后赋值为pendingProps
      const textContent = fiber.memoizedProps.content;
      return commitUpdateTextContent(fiber.stateNode, textContent);
    default:
      if (__DEV__) {
        console.log("未实现的类型");
      }
      break;
  }
};

export const commitUpdateTextContent = (
  textInstance: TextInstance,
  content: string,
) => {
  // content参数为啥是string类型？ text node类型的textContent始终为string，即使设置为number，也会隐式转换为string
  textInstance.textContent = content;
};

export const commitDeletions = (childToDelete: FiberNode) => {
  let rootHostNode: FiberNode | null = null;
  commitNestedComponent(childToDelete, (fiber) => {
    switch (fiber.tag) {
      case HostText:
        // 记录host类型的fiberndoe
        if (rootHostNode === null) {
          rootHostNode = fiber;
        }
        break;
      case HostComponent:
        if (rootHostNode === null) {
          rootHostNode = fiber;
        }
        // TODO: 解绑ref
        break;
      case FunctionComponent:
        // TODO: 消除effect, 解绑ref
        break;
      default:
        if (__DEV__) {
          console.warn("未实现的类型");
        }
    }
  });

  // 如果找到了当前host类型的fiberNode，从childToDelete的hostParent的instance中删除该host类型的fiberNode的stateNode
  // TODO: 目前没实现多节点渲染，之后需要找到childToDelete下面的第一层host类型的fiberNode，然后一起执行removeChild
  if (rootHostNode !== null) {
    const hostParent = getHostParent(childToDelete);
    if (hostParent !== null) {
      removeChild((rootHostNode as FiberNode).stateNode, hostParent);
    }
  }
};

export const commitNestedComponent = (
  root: FiberNode,
  onCommitUnmount: (fiber: FiberNode) => void,
) => {
  let node = root;
  while (true) {
    onCommitUnmount(node);

    if (node.child !== null) {
      node.child.return = node;
      node = node.child;
      continue;
    }

    if (node === root) {
      // 终止条件
      return;
    }

    while (node.sibling === null) {
      if (node.return === null || node.return === root) {
        return;
      }
      // 向上归，如果有sibling节点，向下遍历sibling分支，直到会到root终止遍历children进行delete操作
      node = node.return;
    }

    node.sibling.return = node.return;
    node = node.sibling;
  }
};

export const removeChild = (
  child: Instance | TextInstance,
  container: Container,
) => {
  container.removeChild(child);
};
