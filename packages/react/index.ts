import currentDispatcher, {
  Dispatcher,
  resolveDispatcher,
} from "./src/currentDispatcher";
import { jsx, isValidElement as isValidElementFn, jsxDEV } from "./src/jsx";

// 暴露useState hook
// 这里返回的是一个可以调用真正dispatcher中useState的函数，这样开发者就不能直接操作原始的hooks
export const useState = <State>(initialState: (() => State) | State) => {
  const dispatcher = resolveDispatcher() as Dispatcher;
  return dispatcher.useState<State>(initialState);
};

// 暴露数据共享层
export const _SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = {
  currentDispatcher,
};
export const version = "0.0.0";
// TODO: 根据环境导出jsx(生产环境)还是jsxDEV(开发环境)
export const createElement = jsxDEV;
export const isValidElement = isValidElementFn;
