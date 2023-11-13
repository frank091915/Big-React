export type Type = any;
export type Key = any;
export type Ref = any;
export type Props = any;
export type ElementType = any;

export interface ReactElementType {
  $$typeof: symbol | number;
  type: ElementType;
  key: Key;
  ref: Ref;
  props: Props;
  _mark: string;
}

// 泛型类型 Action<State> 可以返回一个State类型, 也可以返回一个接受任意类型参数然后返回这一类型值的函数
export type Action<State> = State | ((preState: State) => State);
