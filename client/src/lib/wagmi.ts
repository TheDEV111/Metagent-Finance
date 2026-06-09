import { createConfig, http } from "wagmi";
import { base } from "wagmi/chains";
import { metaMask } from "@wagmi/connectors";

export const wagmiConfig = createConfig({
  chains: [base],
  connectors: [metaMask()],
  transports: {
    [base.id]: http(),
  },
});
