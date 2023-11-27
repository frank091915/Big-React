import React from 'react'
import ReactDOM from 'react-dom/client'

function Child() {
  return (<span id="span1"><Child1></Child1></span>)
}
function Child1() {
  return (<span id="span">Finn's Great React</span>)
}
function App() {
  return <div>
          <Child/>
          {/* <span>Finn's React</span> */}
        </div>
};

ReactDOM.createRoot(document.getElementById('root')).render(
    <App />
)
