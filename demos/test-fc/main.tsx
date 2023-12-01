import { useState } from "react";
import ReactDOM from "react-dom/client";

function Child() {
  return (
    <span>
      <Child1></Child1>
    </span>
  );
}
function Child1() {
  const [num, setNum] = useState("Finn's useState");
  window.setNum = setNum
  return num === 3 ? <p>{num}</p> : <span>{num}</span>;
}
function App() {
  return (
    <div>
      <Child />
      {/* <span>Finn's React</span> */}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
