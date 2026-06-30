import { createRoot } from "react-dom/client";
import App from "./app/App";
import "./index.css";

// Add scoping class to body so postcss-prefix-selector applies CSS under .qlnp-app
// This isolates our styles from parent DNN page's CSS reset
document.body.classList.add("qlnp-app");

createRoot(document.getElementById("root")!).render(<App />);
