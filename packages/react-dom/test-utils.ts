import { ReactElementType } from "shared/ReactTypes";
// @ts-ignore 这里不直接从 ./src/root导入 而是从 react-dom包中导入
// 因为对于test-utils来说react 和 react-dom都是外部依赖，打包时不应该包含react-dom代码
import { createRoot } from "react-dom";

export function renderIntoContainer(element: ReactElementType) {
  const div = document.createElement("div");

  createRoot(div).render(element);
}
