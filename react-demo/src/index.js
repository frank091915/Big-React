import React from "react";
import ReactDOM from "react-dom/client";

const jsxFuntions = (
  <div>
    <span>my react</span>
  </div>
);
const rootDom = document.querySelector("#root");
const container = ReactDOM.createRoot(rootDom);
container.render(jsxFuntions);
console.log(React, "React", rootDom);
console.log(ReactDOM, "ReactDOM");
