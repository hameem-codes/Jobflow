import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Automatic CSRF token forwarding for state-changing requests
const getCsrfToken = () => {
  const match = document.cookie.match(/(?:^|;\s*)csrf-token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
};

const originalFetch = window.fetch;
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const token = getCsrfToken();
  const method = (init?.method || (typeof input === "object" && "method" in input ? (input as Request).method : "GET")).toUpperCase();
  if (token && !["GET", "HEAD", "OPTIONS"].includes(method)) {
    const headers = new Headers(init?.headers || {});
    if (!headers.has("x-csrf-token")) {
      headers.set("x-csrf-token", token);
    }
    init = { ...init, headers };
  }
  return originalFetch(input, init);
};

createRoot(document.getElementById("root")!).render(<App />);
