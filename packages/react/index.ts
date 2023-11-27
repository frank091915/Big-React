import currentDispatcher, {
  Dispatcher,
  resolveDispatcher,
} from "./src/currentDispatcher";
import { jsxDEV } from "./src/jsx";

// 暴露useState hook
export const useState: Dispatcher["useState"] = (initialState) => {
  const dispatcher = resolveDispatcher();
  return dispatcher.useState(initialState);
};

// 暴露数据共享层
export const _SCRETE_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = {
  currentDispatcher,
};
export default {
  version: "0.0.0",
  createElement: jsxDEV,
};
