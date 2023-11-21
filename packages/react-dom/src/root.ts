// ReactDom.createRoot(dom).render(<App/>)

import {
  createContainer,
  updateContainer,
} from "react-reconciler/src/fiberReconciler";
import { ReactElementType } from "shared/ReactTypes";
import { Container } from "./hostConfig";

export const createRoot = (element: Container) => {
  const root = createContainer(element);
  console.log(root, "root");

  return {
    render(element: ReactElementType) {
      updateContainer(element, root);
    },
  };
};
