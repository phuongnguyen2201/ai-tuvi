import { createRoot } from "react-dom/client";
import { ThirdwebProvider } from "@thirdweb-dev/react";
import { BaseSepoliaTestnet } from "@thirdweb-dev/chains";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <ThirdwebProvider
    activeChain={BaseSepoliaTestnet}
    clientId="5c576d66882f194b89cee467c1ebaffe"
  >
    <App />
  </ThirdwebProvider>
);
