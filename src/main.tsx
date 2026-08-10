import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./components/App";
// @ts-expect-error: CSS side-effect import
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);