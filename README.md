# Metagent Finance

Autonomous A2A (Agent-to-Agent) Algorithmic Treasury Syndicate built for the [Agent Hackathon](https://venice.ai).

A human grants a master USDC budget once. From there, a CIO Agent analyzes market conditions and produces structured trade intents. The backend cryptographically narrows those intents into ERC-7710 sub-delegations. A Swap Agent executes the trades through a gas-abstracted relayer — no further human intervention required.

---

## How It Works

### Phase 1 — Onboarding
1. User connects their wallet (MetaMask / EIP-1193)
2. dApp requests an ERC-20 Periodic Advanced Permission via `wallet_grantPermissions` (e.g. 10,000 USDC/month)
3. The resulting `permissionContext` is stored in Supabase against the user's ID

### Phase 2 — A2A Orchestration
1. **CIO Agent** (Venice AI / Llama 3.3 70B) receives market data and outputs a strict JSON trade intent:
   ```json
   { "target": "ETH", "amount_usdc": 500, "router": "0x2626..." }
   ```
2. Backend generates a one-time **Burner Key** for the Swap Agent
3. `createCaveatBuilder` enforces `amount_usdc` and the exact router address
4. `redelegatePermissionContext` binds the master context to the Burner Key with those caveats

### Phase 3 — Execution
1. **Swap Agent** (Venice AI) uses the sub-delegation and Burner Key to format the exact swap calldata
2. Signed intent is pushed to the **1Shot Public Relayer** (ERC-7710 / x402 gas abstraction)
3. 1Shot fires a webhook → Supabase updates trade status → UI updates via real-time subscription

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), Tailwind CSS, shadcn/ui |
| Wallet | wagmi v3, viem v2, `wallet_grantPermissions` |
| AI | Venice AI — Llama 3.3 70B (OpenAI-compatible SDK) |
| Delegation | `@metamask/smart-accounts-kit` — `createCaveatBuilder`, `signDelegation`, `encodeDelegations` |
| Relayer | 1Shot API — ERC-7710 gas abstraction on Base Mainnet |
| Database | Supabase (PostgreSQL) + Prisma v7 ORM |
| Backend | Node.js + Express (TypeScript) |

---

## Project Structure

```
Metagent-Finance/
├── client/               # Next.js frontend
│   └── src/
│       ├── app/          # App Router pages & layout
│       ├── components/   # UI — dashboard, activity feed, settings, onboarding
│       └── lib/          # wagmi config, Supabase client, API utils
└── server/               # Express backend + agent orchestration
    ├── src/
    │   ├── services/
    │   │   ├── ai/       # CIO Agent + Swap Agent (Venice AI)
    │   │   ├── delegation/  # ERC-7710 caveat builder & redelegation
    │   │   └── relayer/  # 1Shot API integration
    │   ├── routes/       # REST API — /api/user, /api/trade, /api/webhook
    │   └── lib/db.ts     # Prisma singleton (pg adapter)
    └── prisma/           # Schema + migrations
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- A Supabase project (PostgreSQL)
- Venice AI API key
- 1Shot API key
- A funded wallet on Base Mainnet

### Server

```bash
cd server
cp .env.example .env
# Fill in VENICE_API_KEY, SYSTEM_PRIVATE_KEY, ONESHOT_API_KEY, DATABASE_URL
npm install
npm run build       # runs prisma generate + tsc
npm run dev         # http://localhost:3001
```

### Client

```bash
cd client
# Create .env.local:
# NEXT_PUBLIC_SUPABASE_URL=
# NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
# NEXT_PUBLIC_API_URL=http://localhost:3001
npm install
npm run dev         # http://localhost:3000
```

### Test Scripts (run from `server/`)

```bash
npm run script:redelegation   # verify ERC-7710 caveat construction
npm run script:cio            # verify Venice AI CIO trade intent
npm run script:1shot          # verify 1Shot relayer estimate
```

---

## Environment Variables

### `server/.env`

| Variable | Description |
|---|---|
| `VENICE_API_KEY` | Venice AI API key |
| `SYSTEM_PRIVATE_KEY` | Backend wallet private key (viem `generatePrivateKey()`) |
| `ONESHOT_API_KEY` | 1Shot relayer API key |
| `DATABASE_URL` | Supabase Session Pooler URL |
| `PORT` | Server port (default `3001`) |
| `CORS_ORIGIN` | Comma-separated allowed origins (default `http://localhost:3000`) |
| `WEBHOOK_BASE_URL` | Public server URL for 1Shot status webhooks |

### `client/.env.local`

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable (anon) key |
| `NEXT_PUBLIC_API_URL` | Backend URL (default `http://localhost:3001`) |

---

## Hackathon Tracks

- **Best A2A Coordination** — AI agents passing cryptographically bounded budgets via `redelegatePermissionContext`
- **Best Agent** — Autonomous execution using Venice AI and Smart Accounts
- **Best use of Venice AI** — Multi-model A2A reasoning + Crypto RPC skill
- **Best x402 + ERC-7710 / 1Shot** — Machine-to-machine stablecoin gas abstraction with status webhooks
