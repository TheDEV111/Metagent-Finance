🏗️ Project Handover: Metagent Finance
Concept: An Autonomous A2A (Agent-to-Agent) Algorithmic Treasury Syndicate.
Core Loop: A human grants a master budget. A "CIO Agent" analyzes markets and creates structured trade intents. The backend cryptographically translates these intents into restricted sub-delegations. A "Swap Agent" executes the trades via a gas-abstracted relayer.

🎯 Targeted Hackathon Tracks
Best A2A Coordination: (Primary) AI agents passing cryptographically bounded budgets via redelegatePermissionContext.

Best Agent: Autonomous execution using Venice AI and Smart Accounts.

Best use of Venice AI: Multi-model A2A reasoning (Opus for logic, Kimi for execution) + Crypto RPC skill.

Best x402 + ERC-7710 / 1Shot: Machine-to-machine stablecoin gas abstraction with status webhooks.

📚 1. Official Source & Documentation Directory
These are the exact resources you need open in your browser tabs.

MetaMask Smart Accounts & Delegation:

Create a Redelegation (Docs)

Execute on Smart Account's Behalf (Docs)

Supported Advanced Permissions (Docs)

x402 Recurring Payments (Docs)

Venice AI Integration:

Venice API Overview

Venice AI Skills Repo (GitHub) - Crucial for agent on-chain RPC access.

1Shot API (Gas & Execution):

1Shot EIP-7710 Gas Sponsorship Quickstart

🛠️ 2. Required Tech Stack (UI to DB)
To move fast and ensure compatibility with the required Web3 libraries, use a modern TypeScript stack.

Frontend (The User Dashboard):

Framework: Next.js 14 (App Router) + React.

Styling: TailwindCSS + shadcn/ui (for fast, professional components).

Web3 Connect: wagmi v2 + @tanstack/react-query.

Backend (The Agent Orchestrator):

Framework: Next.js API Routes (Serverless) OR a lightweight Express/Node.js server if you want to run long-lived cron jobs for the AI.

Web3 Core: viem (v2) for all chain interactions.

MetaMask SDK: @metamask/smart-accounts-kit (Specifically the createCaveatBuilder and erc7710WalletActions).

AI SDK: OpenAI Node SDK (configured to point to Venice AI's base URL: https://api.venice.ai/api/v1).

Database (Minimal MVP State):

DB: PostgreSQL via Supabase. (Highly recommended because Supabase handles webhooks beautifully and offers real-time UI updates out of the box).

ORM: Prisma.

🏗️ 3. System Design & Data Flow
Here is exactly how the data moves through your app.

Phase 1: Human Onboarding (Frontend)
User connects their EOA (MetaMask).

Dapp requests an ERC-20 Periodic Advanced Permission (e.g., 10,000 USDC/month) via wallet_grantPermissions.

Frontend sends the resulting master permissionContext to the Backend Database to be stored against the user's ID.

Phase 2: The A2A Orchestration (Backend Cron/Trigger)
The CIO Agent (Venice AI): Backend queries market data and feeds it to the CIO prompt.

CIO Agent outputs a strict JSON intent: {"target": "ETH", "amount_usdc": 500, "router": "0x..."}.

The Bridge (Smart Accounts Kit): * Backend generates a random Burner Private Key for the Swap Agent.

Backend calls createCaveatBuilder() enforcing amount_usdc and the router address.

Backend calls redelegatePermissionContext() to bind the master context to the Burner Key with caveats.

Phase 3: The Execution (Backend/Agents)
The Swap Agent (Venice AI): Backend feeds the sub-delegation and Burner Key to the Swap Agent.

Swap Agent uses the Venice Crypto RPC skill to format the exact swap transaction data.

The Relayer (1Shot): The signed intent is pushed to the 1Shot Public Relayer API.

The Update: 1Shot fires a webhook -> Supabase updates DB status to Confirmed -> Next.js Frontend updates via real-time subscription.

🗄️ 4. Minimal Database Schema (Prisma)
Keep it lean. You only need to track Users, Delegations, and Tasks.

Code snippet
model User {
  id               String       @id @default(cuid())
  walletAddress    String       @unique
  masterContext    Json?        // Stores the original 10k allowance payload
  createdAt        DateTime     @default(now())
  trades           TradeIntent[]
}

model TradeIntent {
  id               String       @id @default(cuid())
  userId           String
  user             User         @relation(fields: [userId], references: [id])
  cioPromptJson    Json         // What the AI decided to do
  subDelegateKey   String       // The burner key address generated for this trade
  subContext       Json         // The narrowed redelegation payload
  relayerTaskId    String?      // From 1Shot API
  status           String       @default("PENDING") // PENDING, SUBMITTED, CONFIRMED, REVERTED
  createdAt        DateTime     @default(now())
}
🚀 5. IDE "Day 1" Action Plan
When you open your IDE, do not build the UI first. If the crypto cryptography fails, the UI is useless. Follow this exact order:

Step 1: Setup the API Keys & Env Variables

Get a Venice AI API Key.

Get a 1Shot API Key (if required for the relayer endpoints).

Setup your Base Sepolia testnet RPC URL.

Create a .env file and store these.

Step 2: Build the "Bridge" Script (The hardest part)

Create a simple test-redelegation.ts Node script.

Hardcode a master permissionContext (mock it if you have to).

Implement the createCaveatBuilder logic I shared in the previous prompt.

Prove that you can successfully generate a narrowed subAgentContext. Console log it.

Step 3: Connect Venice AI

Create a script test-cio.ts.

Use the standard OpenAI SDK, but change the baseURL to Venice.

Feed it your CIO prompt and verify it returns perfectly structured JSON.

Step 4: The 1Shot Send

Create test-1shot.ts.

Take the mock data from Step 2 and format a payload for the relayer_estimate7710Transaction endpoint.

Ensure you implement the salt generation properly to avoid replay errors.

Step 5: The UI Wrapper

Only once those three scripts work in terminal, wrap them in a Next.js UI.

Build a simple dashboard showing:

"Treasury Balance"

"Recent AI Decisions" (The JSON logs)

"Relayer Status" (Pending/Confirmed dots based on 1Shot webhooks).

⚠️ Final Crucial Hacks/Gotchas
Mocking the Market: Don't waste hackathon time building a complex price oracle. Hardcode an API endpoint that returns fake "arbitrage opportunities" just to trigger the CIO Agent's reasoning. The judges care about the delegation architecture, not your trading alpha.

Timeouts: If your Next.js API route takes more than 10-15 seconds waiting for the Venice AI response + 1Shot submission, standard serverless functions might timeout. Consider using Next.js edge functions or moving the agent logic to a background worker if needed, but test this early.