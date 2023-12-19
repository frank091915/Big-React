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
  const [num, setNum] = useState(666);
  return <p onClick={()=>setNum((num) => num + 1)}>{num}</p>;
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
