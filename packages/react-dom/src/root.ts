// ReactDom.createRoot(dom).render(<App/>)

import {
  createContainer,
  updateContainer,
} from "react-reconciler/src/fiberReconciler";
import { ReactElementType } from "shared/ReactTypes";
import { Container } from "./hostConfig";
import { initEvent } from "./synthetic";

export const createRoot = (container: Container) => {
  const root = createContainer(container);

  return {
    render(element: ReactElementType) {
      initEvent(container, "click");
      return updateContainer(element, root);
    },
  };
};
