import { createRoot } from "react-dom/client";
import { MsalProvider } from "@azure/msal-react";
import App from "./App.tsx";
import { msalInstance } from "./auth/entra";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <MsalProvider instance={msalInstance}>
    <App />
  </MsalProvider>,
);
