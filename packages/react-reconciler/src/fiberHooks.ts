import { FiberNode } from "./fiber";

export const renderWithHooks = (wip: FiberNode) => {
  const component = wip.type;
  const pendingProps = wip.pendingProps;
  const children = component(pendingProps);
  return children;
};
