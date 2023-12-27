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
  const[num, setNum] = useState(0)
	const arr =
		num % 2 === 0
			? [<li key="1">1</li>, <li key="2">2</li>, <li key="3">3</li>]
			: [<li key="3">3</li>, <li key="2">2</li>, <li key="1">1</li>];

	return <ul onClickCapture={() => setNum(num + 1)}>{arr}</ul>;
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
