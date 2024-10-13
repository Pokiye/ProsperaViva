import { jsx as _jsx } from "react/jsx-runtime";
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./App.css";
const container = document.getElementById("root");
const root = createRoot(container); // Create a root.
root.render(_jsx(React.StrictMode, { children: _jsx(App, {}) }));
