import { REACT_ELEMENT_TYPE } from "shared/ReactSymbols";
import { Type, Key, Ref, Props, ReactElementType } from "shared/ReactTypes";
// ReactElement 数据结构
const ReactElement = function (
  type: Type,
  key: Key,
  ref: Ref,
  props: Props,
): ReactElementType {
  const element = {
    $$typeof: REACT_ELEMENT_TYPE,
    type,
    key,
    ref,
    props,
    _mark: "Finn",
  };
  return element;
};

export const jsx = function (
  type: ReactElementType,
  config: any,
  ...maybeChildren: any
) {
  // 单独处理 key 和 ref
  let key: Key = null;
  let ref: Ref = null;
  const props: Props = {};

  // 遍历config 给 key ref props赋值
  for (const propNmae in config) {
    const val = config[propNmae];
    if (propNmae === "key") {
      if (val != undefined) {
        key = val + "";
      }
      continue;
    }
    if (propNmae === "ref") {
      if (val != undefined) {
        ref = val;
      }
      continue;
    }
    // 只取config自身的值
    if (Object.hasOwnProperty.call(config, propNmae)) {
      props[propNmae] = val;
    }
    // 根据maybeChildren 给props赋值
    if (maybeChildren) {
      if (maybeChildren.length === 1) {
        props.children = maybeChildren[0];
      } else {
        props.children = maybeChildren;
      }
    }

    // 返回ReactElement元素
    return ReactElement(type, key, ref, props);
  }
};

export const jsxDEV = function (type: ReactElementType, config: any) {
  // 单独处理 key 和 ref
  let key: Key = null;
  let ref: Ref = null;
  const props: Props = {};

  // 遍历config 给 key ref props赋值
  for (const propNmae in config) {
    const val = config[propNmae];
    if (propNmae === "key") {
      if (val != undefined) {
        key = val + "";
      }
      continue;
    }
    if (propNmae === "ref") {
      if (val != undefined) {
        ref = val;
      }
      continue;
    }
    // 只取config自身的值
    if (Object.hasOwnProperty.call(config, propNmae)) {
      props[propNmae] = val;
    }

    // 返回ReactElement元素
    return ReactElement(type, key, ref, props);
  }
};
