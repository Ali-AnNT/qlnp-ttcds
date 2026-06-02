import { createRoot } from "react-dom/client";
import App from "./app/App";
import "./index.css";

// Add CSS scope class to body for Radix UI portals (Toast, Dialog, etc.)
// Portals render at body level, so they need .qlnp-app on body to receive scoped styles
document.body.classList.add("qlnp-app");

createRoot(document.getElementById("root")!).render(<App />);
