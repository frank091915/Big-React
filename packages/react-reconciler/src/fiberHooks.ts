import { Dispatch, Dispatcher } from "react/src/currentDispatcher";
import internals from "shared/internals";
import { Action } from "shared/ReactTypes";
import { FiberNode } from "./fiber";
import {
  createUpdate,
  createUpdateQueue,
  enqueueUpdate,
  processUpdateQueue,
  UpdateQueue,
} from "./updateQueue";
import { scheduleUpdateOnFiber } from "./workLoop";

let currentlyRenderingFiber: FiberNode | null = null;
let workInProgressHook: Hook | null = null; // mount阶段,每次调用react hook时,记录最近一次wip hook对象,用于判断是不是fiberNode第一个hook对象,然后连接新hook对象
let currentHook: Hook | null = null; // update阶段,每次调用react hook时,记录最近一次current hook对象,用于判断是不是fiberNode第一个hook对象,然后连接新hook对象
const { currentDispatcher } = internals;

export type Hook = {
  next: Hook | null;
  memoizedState: any;
  updateQueue: unknown;
};

export const renderWithHooks = (wip: FiberNode) => {
  // 赋值操作
  currentlyRenderingFiber = wip;
  wip.memoizedState = null; // 先赋值为null,后面再重新创建hooks链表

  const component = wip.type;
  const pendingProps = wip.pendingProps;
  const children = component(pendingProps);

  const current = wip.alternate;

  if (current === null) {
    // mount阶段 给currentDispatcher赋值mount阶段的hooks集合
    currentDispatcher.current = HooksDispatcherOnMount;
  } else {
    // 调用mount阶段导出的dispatch方法时，会从hostRootFiber开始beginWork和completeWork,调用FC时，有cerrent会走updte分支
    // update阶段
    currentDispatcher.current = HooksDispatcherOnUpdate;
  }

  //重置操作
  currentlyRenderingFiber = null;
  return children;
};

export const HooksDispatcherOnMount: Dispatcher = {
  useState: mountState,
};
// update阶段 hooks集合
export const HooksDispatcherOnUpdate: Dispatcher = {
  useState: updateState,
};

function mountState<State>(
  initialState: State | (() => State),
): [State, Dispatch<State>] {
  // 创建mount时的hook对象
  const hook = mountWorkInProgressHook();

  let memoizedState;
  if (initialState instanceof Function) {
    memoizedState = initialState();
  } else {
    memoizedState = initialState;
  }

  // 通过reconciler中的方法createUpdateQueue给hook对象添加updateQueue
  const updateQueue = createUpdateQueue<State>();
  hook.updateQueue = updateQueue;
  hook.memoizedState = memoizedState;

  // 通过bind返回dispatchSetState,给dispatch预设了currentlyRenderingFiber,所以dispatch可以在FC外调用
  // 使用的时候只需要传入action
  // ts知识补充 bind 后续可传参数 arg1, …, argN Optional Arguments to prepend to arguments provided to the bound function when invoking func.
  // @ts-ignore
  const dispatch = dispatchSetState.bind(
    null,
    // @ts-ignore
    currentlyRenderingFiber,
    // @ts-ignore
    updateQueue,
  );
  updateQueue.dispatch = dispatch;
  return [memoizedState, dispatch];
}

function updateState<State>(): [State, Dispatch<State>] {
  // 创建mount时的hook对象
  const hook = updateWorkInProgressHook();

  // 计算updateState中state
  const queue = hook.updateQueue as UpdateQueue<State>;
  const pendingUpdate = (hook.updateQueue as UpdateQueue<State>).shared.pending;
  if (pendingUpdate) {
    const { memoizedState } = processUpdateQueue<State>(
      hook.memoizedState,
      pendingUpdate,
    );
    hook.memoizedState = memoizedState;
  }
  // 直接返回之前的dispatch方法
  return [hook.memoizedState, queue.dispatch as Dispatch<State>];
}

// dispatch实现
function dispatchSetState<State>(
  fiber: FiberNode,
  updateQueue: UpdateQueue<State>,
  action: Action<State>,
) {
  // 创建update对象{action: Action<State>}
  const update = createUpdate(action);
  // 向updateQueue中插入update
  // TODO: 注意这里的updateQueue是在hook对象上(fiber.memoizedState.updateQueue)，调度更新后，是执行fiber.updateQueue
  enqueueUpdate(updateQueue, update);
  // 开始调度更新
  scheduleUpdateOnFiber(fiber);
}

function mountWorkInProgressHook(): Hook {
  const hook: Hook = {
    memoizedState: null,
    updateQueue: null,
    next: null,
  };
  // 如果workInProgressHook为null,说明这是mount阶段第一个hook
  if (workInProgressHook === null) {
    // currentlyRenderingFiber 为null，说明没有对应的fiber,没在FC中执行，应该提醒开发者正确使用FC
    if (currentlyRenderingFiber === null) {
      throw new Error("请在函数组件中使用hooks");
    }
    workInProgressHook = hook;
    currentlyRenderingFiber.memoizedState = hook;
  } else {
    // 这是后面的hook,通过next串联成单向链表
    workInProgressHook.next = hook;
    workInProgressHook = hook;
  }
  return workInProgressHook;
}

function updateWorkInProgressHook(): Hook {
  // TODO: 差一个 处理render阶段触发的更新
  let currentNextHook: Hook | null = null;

  // 如果currentHook为null,说明这是update阶段第一个hook
  if (currentHook === null) {
    // 从current中获取之前的hook
    const current = currentlyRenderingFiber?.alternate;
    if (current !== null) {
      currentNextHook = current?.memoizedState;
    } else {
      // current fiber为null的话，说明是mount阶段，不应该走到updateWorkInProgressHook中
      currentNextHook = null;
    }
  } else {
    // 这是后面的hook,通过next串联成单向链表
    currentNextHook = currentHook.next;
  }

  if (currentNextHook === null) {
    // mount/update h1 h2 h3
    // update       h1 h2 h3 h4(currentHook.next 没有hook了)
    // 多了一个hook调用，说明hooks是在条件语句中执行
    if (__DEV__) {
      console.warn();
    }
  }

  currentHook = currentNextHook as Hook;
  // 为啥要创建一个新对象，后面对hook对象有修改操作吗？
  const newHook: Hook = {
    memoizedState: currentHook.memoizedState,
    updateQueue: currentHook.updateQueue,
    next: null,
  };

  // 始终还是根据workInProgressHook判断，是第一个hook还是后续hook
  if (workInProgressHook === null) {
    // currentlyRenderingFiber 为null，说明没有对应的fiber,没在FC中执行，应该提醒开发者正确使用FC
    if (currentlyRenderingFiber === null) {
      throw new Error("请在函数组件中使用hooks");
    }
    workInProgressHook = newHook;
    currentlyRenderingFiber.memoizedState = newHook;
  } else {
    // 这是后面的hook,通过next串联成单向链表
    workInProgressHook.next = newHook;
    workInProgressHook = newHook;
  }
  return workInProgressHook;
}
