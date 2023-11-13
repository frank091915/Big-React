import { Action } from "shared/ReactTypes";
// 定义一个泛型类型Update<State> 返回一个包含类型为Action<State>的action属性的对象
export interface Update<State> {
  // Action<State> 可能是一个任意类型的值，也可能是一个接受该类型值再返回该类型值的函数
  action: Action<State>;
}
// action有两种形式 state 或者 函数
// this.setState(state) or this.setState((preState) => state)

// 定义一个UpdateQueue<State>泛型类型 这是一个包含shared.pending的对象,pending的类型为 Update<State>或者null
export interface UpdateQueue<State> {
  shared: {
    pending: Update<State> | null;
  };
}

export const createUpdate = <State>(action: Action<State>): Update<State> => {
  return {
    action,
  };
};

// 定义一个创建updateQueue的方法
export const createUpdateQueue = <Action>(): UpdateQueue<Action> => {
  return {
    shared: {
      pending: null,
    },
  };
};

// 将update插入updateQueue的方法
export const enQueueUpdate = <Action>(
  updateQueue: UpdateQueue<Action>,
  update: Update<Action>,
) => {
  updateQueue.shared.pending = update;
};

// 消费update的方法
/**
 * @param baseState state状态
 * @param pendingUpdate update更新
 * @returns {
 *    memoizedState: State;
 *  }
 */
export const processUpdateQueue = <State>(
  baseState: State,
  pendingUpdate: Update<State> | null,
): {
  memoizedState: State;
} => {
  const result: ReturnType<typeof processUpdateQueue<State>> = {
    memoizedState: baseState,
  };
  if (pendingUpdate !== null) {
    if (pendingUpdate.action instanceof Function) {
      result.memoizedState = pendingUpdate.action(baseState);
    } else {
      result.memoizedState = pendingUpdate.action;
    }
  }
  return result;
};
