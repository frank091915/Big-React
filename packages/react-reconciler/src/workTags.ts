export const FunctionComponent = 0; // 函数组件
export const HostRoot = 3; // 挂在的根节点
export const HostComponent = 5; // 原生的html标签 <div>等
export const HostText = 6; // <div>213</div>的 213文本

export type WorkTag =
  | typeof FunctionComponent
  | typeof HostRoot
  | typeof HostComponent
  | typeof HostText;
