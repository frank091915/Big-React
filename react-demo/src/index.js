import React from 'react';
import  ReactDOM  from 'react-dom';

const jsxFuntions = <div><span>jsx</span></div>
const rootDom = document.querySelector('#root')
const container = ReactDOM.createRoot(rootDom)
console.log(container,'container')
container.render(jsxFuntions)
console.log(React,'React',rootDom)
console.log(ReactDOM,'ReactDOM')
console.log(jsxFuntions,'jsxFuntions')
