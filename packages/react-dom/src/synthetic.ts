import { Container } from "hostConfig";
import { Props } from "shared/ReactTypes";

const elementPropsKeys = "__propsKey";
const validEventList: string[] = ["click"];

export interface DomElement extends Element {
  [elementPropsKeys]: Props;
}
type eventCallBack = (event: SynTheticEvent) => void;
export interface Path {
  capture: eventCallBack[];
  bubble: eventCallBack[];
}
interface SynTheticEvent extends Event {
  __stopPropagation: boolean;
}

// 在createInstance时保存到dom节点中
export function updateFiberProps(node: DomElement, props: Props) {
  node[elementPropsKeys] = props;
}

export const initEvent = (container: Container, eventType: string) => {
  if (!validEventList.includes(eventType)) {
    console.warn("不合法的事件类型", eventType);
  }
  container.addEventListener(eventType, (e) => {
    dispatchEvent(container, eventType, e);
  });
};

export const dispatchEvent = (
  container: Container,
  eventType: string,
  event: Event,
) => {
  const target = event.target;
  if (!target) {
    if (__DEV__) {
      console.warn("事件不存在target", target);
    }
  }
  // 收集事件
  const { bubble, capture } = collectPaths(
    target as DomElement,
    container,
    eventType,
  );

  // 合成事件对象
  const synTheticEvent = createSyntheticEvent(event);
  // 遍历capture集合触发事件处理函数
  triggerEventFlow(capture, synTheticEvent);
  // 如果没有阻止事件向上冒泡的话才会遍历bubble集合触发事件处理函数
  if (!synTheticEvent.__stopPropagation) {
    triggerEventFlow(bubble, synTheticEvent);
  }
};

function triggerEventFlow(
  paths: eventCallBack[],
  synTheticEvent: SynTheticEvent,
) {
  for (let i = 0; i < paths.length; i++) {
    const callBack = paths[i];
    callBack.call(null, synTheticEvent);
    if (synTheticEvent.__stopPropagation) {
      break;
    }
  }
}

function collectPaths(
  targetElement: DomElement,
  container: Container,
  eventType: string,
) {
  const path: Path = {
    capture: [],
    bubble: [],
  };
  // 为啥需要传targetElement和Container, 因为要收集事件触发对象往上的dom的监听事件
  while (targetElement && targetElement !== container) {
    // 获取dom节点上的props
    const props = targetElement[elementPropsKeys];
    // 根据eventType获取对应的事件监听函数名 click => onClick coClickCapture
    const callBackNameList = getCallBackNamesFromEventType(eventType);
    if (callBackNameList) {
      callBackNameList.forEach((handlerName, index) => {
        const callBack = props[handlerName];
        if (callBack) {
          if (index === 0) {
            // 收集回调是从下往上，但是capture阶段是从上往下开始执行所以越上层的dom事件处理函数，越靠前，需要unshift
            path.capture.unshift(callBack);
          } else {
            path.bubble.push(callBack);
          }
        }
      });
    }
    targetElement = targetElement.parentNode as DomElement;
  }
  return path;
}

export const getCallBackNamesFromEventType = (
  eventType: string,
): string[] | undefined => {
  //这是告诉typeScript编译器，callBackNamesMap有string类型的属性，不然typeScript编译器不知道是否存在eventType类型的属性 {[key: string]: string[]}
  const callBackNamesMap: {
    [key: string]: string[];
  } = {
    click: ["onClickCapture", "onClick"],
  };
  return callBackNamesMap[eventType];
};

export function createSyntheticEvent(event: Event) {
  const synTheticEvent = event as SynTheticEvent;
  synTheticEvent.__stopPropagation = false;
  const originStopPropagation = event.stopPropagation;
  synTheticEvent.stopPropagation = () => {
    synTheticEvent.__stopPropagation = true;
    if (originStopPropagation) originStopPropagation();
  };
  return synTheticEvent;
}
