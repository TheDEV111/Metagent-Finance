export const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
export const UNISWAP_V3 = "0x2626664c2603336E57B271c5C0b26F421741e481";
export const CURVE = "0x4f37A9d177470499A2dD084621020b023fcffc1F";
export const AAVE_V3 = "0xA238Dd80C259a72e81d7e4664a9801593F98d1c5";

export const treasury = {
  tvl: 12450892.45,
  change24hPct: 2.4,
  pnl24h: 298401.12,
  yieldGen: 45210,
  activeTrading: 253191,
  masterBudget: 1000000,
  masterUsed: 750000,
  network: "Base Mainnet",
  spark: [11.9, 11.95, 11.88, 12.02, 12.1, 12.05, 12.18, 12.24, 12.2, 12.31, 12.28, 12.37, 12.33, 12.41, 12.45],
  equity: [11.42, 11.5, 11.38, 11.61, 11.55, 11.7, 11.82, 11.74, 11.9, 11.85, 12.0, 11.95, 12.1, 12.04, 12.2, 12.15, 12.28, 12.22, 12.34, 12.3, 12.39, 12.33, 12.45],
};

export const allocation = [
  { sym: "USDC", name: "USD Coin", pct: 41.2, value: 5129767, color: "#00f0ff", chain: "Base", apy: 5.1 },
  { sym: "WETH", name: "Wrapped Ether", pct: 28.6, value: 3560955, color: "#b794ff", chain: "Base", apy: 3.2 },
  { sym: "cbBTC", name: "Coinbase BTC", pct: 14.3, value: 1780478, color: "#ffcf5c", chain: "Base", apy: 0 },
  { sym: "AAVE", name: "Aave (aUSDC)", pct: 9.7, value: 1207737, color: "#34e0a1", chain: "Base", apy: 6.4 },
  { sym: "LINK", name: "Chainlink", pct: 6.2, value: 771955, color: "#c0c1ff", chain: "Base", apy: 0 },
];

export const positions = [
  { protocol: "Aave v3", action: "USDC Supply", chain: "Base", amount: 1207737, apy: 6.4, agent: "Yield Manager", health: 2.8 },
  { protocol: "Uniswap v3", action: "WETH/USDC LP", chain: "Base", amount: 842300, apy: 18.2, agent: "LP Manager", range: "in range" },
  { protocol: "Curve", action: "crvUSD/USDC", chain: "Base", amount: 410500, apy: 9.1, agent: "LP Manager", range: "in range" },
  { protocol: "Spot", action: "WETH Hold", chain: "Base", amount: 2718655, apy: 0, agent: "CIO Agent", range: "—" },
];

export const agents = [
  {
    id: "cio", name: "CIO Agent", role: "Chief Investment Officer", kind: "Reasoning",
    model: "Llama 3.3 70B", provider: "Venice AI", status: "deciding", icon: "neurology",
    address: "0x8C2f…D41A", budget: null, executed: 1284, success: 99.2,
    desc: "Analyzes market data and emits strict-JSON trade intents. Delegates execution to sub-agents via redelegatePermissionContext.",
    caveats: ["Read-only market access", "Emits intents only — no signing keys"],
    limit: null,
  },
  {
    id: "swap-alpha", name: "Swap Agent (Alpha)", role: "Execution", kind: "Execution",
    model: "Kimi K2", provider: "Venice AI", status: "swapping", icon: "swap_horiz",
    address: "0x4A7b…9F2C", limit: "$100k / tx", budget: 100000, executed: 612, success: 98.6,
    desc: "Burner-key sub-delegate. Formats swap calldata via Venice Crypto RPC skill and submits through the 1Shot relayer.",
    caveats: ["AllowedTargets: Uniswap v3 router", "ERC20TransferAmount ≤ $100k USDC", "Single-tx scope"],
  },
  {
    id: "swap-beta", name: "Swap Agent (Beta)", role: "Execution", kind: "Execution",
    model: "Kimi K2", provider: "Venice AI", status: "active", icon: "swap_horiz",
    address: "0x1Dd9…7E04", limit: "$50k / tx", budget: 50000, executed: 333, success: 97.9,
    desc: "Secondary execution lane for Curve routes. Identical caveat structure scoped to the Curve router.",
    caveats: ["AllowedTargets: Curve router", "ERC20TransferAmount ≤ $50k USDC", "Single-tx scope"],
  },
  {
    id: "yield", name: "Yield Manager", role: "Yield", kind: "Execution",
    model: "Llama 3.3 70B", provider: "Venice AI", status: "active", icon: "savings",
    address: "0x9b34…A18F", limit: "$250k / day", budget: 250000, executed: 96, success: 100,
    desc: "Routes idle stablecoins into Aave v3 supply positions. Caveats bind it to the Aave Pool target.",
    caveats: ["AllowedTargets: Aave v3 Pool", "ERC20TransferAmount ≤ $250k / day", "Supply + withdraw only"],
  },
  {
    id: "lp", name: "LP Manager", role: "Liquidity", kind: "Execution",
    model: "Kimi K2", provider: "Venice AI", status: "active", icon: "water_drop",
    address: "0x6F0c…2B77", limit: "$500k / day", budget: 500000, executed: 48, success: 99.1,
    desc: "Rebalances concentrated-liquidity ranges on Uniswap v3 and Curve. Rerolls a fresh burner key per epoch.",
    caveats: ["AllowedTargets: Uniswap v3 + Curve", "ERC20TransferAmount ≤ $500k / day", "Mint / burn / collect"],
  },
];

export const burnerKeys = [
  { agent: "Swap Agent (Alpha)", address: "0x4A7b…9F2C", target: "Uniswap v3", limit: 100000, used: 71200, scope: "ERC20TransferAmount", status: "active", expires: "in 3d 04h", icon: "swap_horiz" },
  { agent: "Swap Agent (Beta)", address: "0x1Dd9…7E04", target: "Curve", limit: 50000, used: 12400, scope: "ERC20TransferAmount", status: "active", expires: "in 3d 04h", icon: "swap_horiz" },
  { agent: "Yield Manager", address: "0x9b34…A18F", target: "Aave v3 Pool", limit: 250000, used: 120500, scope: "ERC20TransferAmount", status: "active", expires: "in 18h", icon: "savings" },
  { agent: "LP Manager", address: "0x6F0c…2B77", target: "Uniswap v3 / Curve", limit: 500000, used: 252800, scope: "ERC20TransferAmount", status: "active", expires: "in 9h", icon: "water_drop" },
  { agent: "Swap Agent (Gamma)", address: "0x2c81…0Aa", target: "Uniswap v3", limit: 25000, used: 25000, scope: "ERC20TransferAmount", status: "revoked", expires: "expired", icon: "swap_horiz" },
];

export type TxStatus = "estimating" | "signed" | "confirmed" | "pending" | "reverted";

export const activity: Array<{
  id: string; from: string; to: string; venue: string; action: string;
  agent: string; amount: number; status: TxStatus; time: string;
  task: string; gas: number; tx?: string; note?: string;
}> = [
  { id: "0x9f2a", from: "WETH", to: "USDC", venue: "Uniswap v3", action: "Swap", agent: "Swap Agent (Alpha)", amount: 45000, status: "estimating", time: "14:02:21", task: "1s_8821fa", gas: 0.41 },
  { id: "0x4b71", from: "USDC", to: "aUSDC", venue: "Aave v3", action: "Supply", agent: "Yield Manager", amount: 120500, status: "signed", time: "13:58:04", task: "1s_8819b2", gas: 0.33 },
  { id: "0x1c08", from: "LINK", to: "USDC", venue: "Curve", action: "Swap", agent: "Swap Agent (Beta)", amount: 12400, status: "confirmed", time: "13:54:47", task: "1s_8814c7", gas: 0.29, tx: "0x7d3e…b1a9" },
  { id: "0x77e0", from: "USDC", to: "WETH", venue: "Uniswap v3", action: "Swap", agent: "Swap Agent (Alpha)", amount: 88200, status: "confirmed", time: "13:49:12", task: "1s_8810de", gas: 0.44, tx: "0x2a91…ff03" },
  { id: "0x33aa", from: "crvUSD", to: "USDC", venue: "Curve", action: "Swap", agent: "Swap Agent (Beta)", amount: 31050, status: "confirmed", time: "13:41:55", task: "1s_8807a1", gas: 0.31, tx: "0x55cb…7e21" },
  { id: "0xb204", from: "USDC", to: "WETH", venue: "Uniswap v3", action: "LP Mint", agent: "LP Manager", amount: 210400, status: "pending", time: "13:38:20", task: "1s_8802ee", gas: 0.52 },
  { id: "0x0d9c", from: "WETH", to: "USDC", venue: "Uniswap v3", action: "Swap", agent: "Swap Agent (Alpha)", amount: 9800, status: "reverted", time: "13:30:09", task: "1s_8799b0", gas: 0.0, note: "Slippage caveat exceeded" },
  { id: "0xe51f", from: "USDC", to: "cbBTC", venue: "Uniswap v3", action: "Swap", agent: "Swap Agent (Alpha)", amount: 64500, status: "confirmed", time: "13:22:41", task: "1s_8790c2", gas: 0.39, tx: "0x9be1…44da" },
];

export const cioLog = [
  { t: "14:02:11", kind: "INFO", text: "Analyzing market volatility across DEXs." },
  { t: "14:02:15", kind: "INFO", text: "Arbitrage opportunity detected: WETH/USDC (Uniswap v3 vs Curve)." },
  { t: "14:02:18", kind: "REASONING", text: "Spread > 0.4%. Gas fees estimated at $12. Expected net profit: $450. Proceeding with strategy generation." },
  { t: "14:02:19", kind: "INTENT", text: '{ "target": "USDC", "amount_usdc": 45000, "router": "0x2626…e481" }' },
  { t: "14:02:20", kind: "ACTION", text: "Delegating execution to Swap Agent 0x4A7b…9F2C via redelegatePermissionContext." },
  { t: "14:02:21", kind: "RELAY", text: "Sub-delegation signed. Pushed to 1Shot relayer → task 1s_8821fa (Estimating)." },
];

export const relayer = {
  provider: "1Shot",
  standard: "ERC-7710 / EIP-7715",
  feeCollector: "0x5C9e…11Ab",
  targetAddress: "0xDeleg…7710",
  supported: ["USDC", "WETH", "crvUSD"],
  gasPrice: "0.0041 gwei",
  minFee: "$0.18",
  sponsored: 4218,
  sponsoredUsd: 1840.22,
};

export const notifications = [
  { icon: "bolt", color: "primary-container", title: "Swap confirmed", text: "LINK → USDC · $12,400 · Curve", time: "2m" },
  { icon: "neurology", color: "amber", title: "CIO Agent decision", text: "New arbitrage intent generated", time: "4m" },
  { icon: "key", color: "secondary-fixed-dim", title: "Burner key rerolled", text: "LP Manager · expires in 9h", time: "26m" },
  { icon: "warning", color: "error", title: "Tx reverted", text: "Slippage caveat exceeded · refunded", time: "52m" },
];

export const user = { address: "0x4F3a…a2B9", ens: "treasury.metagent.eth" };

export function fmtUSD(n: number, dp = 0): string {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp });
}
