import React from "react";
import ReactDOM from "react-dom/client";
import storage from "./storage.js";
import App from "./App.jsx";
import "./index.css";

// App.jsx wywołuje window.storage.get/set — w Claude.ai to wbudowany mechanizm,
// tutaj podstawiamy pod tę samą nazwę własną implementację opartą o localStorage.
window.storage = storage;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
