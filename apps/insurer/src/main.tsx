import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createDriveProofClient } from "@driveproof/driveproof-client";
import App from "./App";
import "../../../shared/styles.css";

const requestedMode = import.meta.env.VITE_DRIVEPROOF_CLIENT_MODE === "midnight" ? "midnight" : "mock";
const driveProofClient = createDriveProofClient(requestedMode);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App client={driveProofClient} />
  </StrictMode>
);
