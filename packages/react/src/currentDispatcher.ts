import { Action } from "shared/ReactTypes";

export type Dispatcher = {
  useState: <T>(initialState: T | (() => T)) => [T, Dispatch<T>];
};

export type Dispatch<State> = (action: Action<State>) => void;

// hooks集合
export const currentDispatcher: { current: Dispatcher | null } = {
  current: null,
};

// 定义一个获取dispatcher的方法
export const resolveDispatcher = (): Dispatcher => {
  const current = currentDispatcher.current;
  if (current === null) {
    throw new Error("hooks只能在function component中执行");
  }
  return current;
};

export default currentDispatcher;
