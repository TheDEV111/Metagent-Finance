/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // @wagmi/connectors v8 bundles optional connectors (Porto, BaseAccount) whose
    // peer deps aren't installed. We only use MetaMask, so stub them out.
    config.resolve.alias = {
      ...config.resolve.alias,
      "porto/internal": false,
      "porto": false,
      "@base-org/account": false,
      "pino-pretty": false,
      "@safe-global/safe-apps-provider": false,
      "@safe-global/safe-apps-sdk": false,
      "@metamask/connect-evm": false,
      "@coinbase/wallet-sdk": false,
      "@walletconnect/ethereum-provider": false,
      "accounts": false,
    };
    return config;
  },
};

export default nextConfig;
