# Metagent Finance
### An algorithmic treasury that runs on its own.

---

## The Hook

Imagine handing your company's spare cash to a financial team that never sleeps, never panics, never fat-fingers a trade — and **physically cannot run off with your money.**

That's Metagent Finance. A treasury that thinks for itself, trades for itself, and stays inside hard cryptographic guardrails you set once.

---

## The Problem

Every business, DAO, and crypto fund sits on idle treasury money — stablecoins doing nothing while markets move.

The options today are all bad:

- **Do it yourself** → slow, emotional, you miss the moves.
- **Hire a manager** → expensive, and now they hold your keys.
- **Use a bot** → give it your private key and pray it isn't hacked.

The dirty secret of "automated finance" is that automation almost always means **handing over control.** One leaked key, one rogue script, and the money is gone.

---

## The Solution

Metagent flips that. You **grant a budget, not your keys.**

You tell it once: *"You may spend up to $1M of USDC, only on Uniswap, this month."* That permission is signed cryptographically and enforced on-chain. The agents can act freely **inside** that box — and they cannot step one inch outside it. Ever.

Then two AI agents take over:

1. **The CIO Agent** reads live market data and decides *what* to trade and *how much.*
2. **The Swap Agent** figures out *how* to execute it cleanly — slippage, routing, the lot.

They coordinate, sign, and fire the trade. You watch it happen in real time. Gas is paid automatically. You never touch a thing.

---

## How It Works (the 30-second version)

1. **Connect & grant** — one signature sets your spending rules. Non-custodial. Your keys stay in your wallet.
2. **Agents reason** — live ETH/BTC market data flows into the CIO Agent. It sizes the trade. The Swap Agent prepares execution.
3. **Bounded execution** — a one-time "burner" key is issued for the trade, locked to your caveats. It executes, gas-abstracted, and self-destructs.
4. **You see everything** — every decision, every trade, every status, logged live.

The magic word is **delegation, not custody.** The AI works for you on a leash you control.

---

## Why The Tech Is Genuinely Cool

- **ERC-7715 + ERC-7710** — bleeding-edge permission standards. The agent gets a *redelegated, caveat-bounded* slice of authority — not your wallet.
- **Two specialized AI agents** (Venice AI) that actually talk to each other — a strategist and an executor — not one dumb prompt.
- **Gas abstraction via 1Shot + x402** — users pay fees in USDC, never need ETH, never see a gas screen. It just works.
- **Live market data**, real reasoning, real on-chain execution on Base Mainnet.

This isn't a mockup. It's a working agent-to-agent financial pipeline with security baked into the protocol layer.

---

## The Business Case 💰

**For treasuries & funds:** Put idle stablecoins to work 24/7 with zero headcount. No analyst salaries, no overnight risk desk.

**For the nervous CFO:** The math *guarantees* the downside. The agent literally cannot exceed the budget or touch unapproved venues. That's not a promise — it's enforced by the blockchain.

**For scale:** One owner can run many agents, each on its own leash. A whole syndicate of bounded AI traders, all auditable, all revocable in one click.

**The market:** Billions in DAO and corporate crypto treasuries sit idle today because the safe option is to do nothing. Metagent makes "doing something" the safe option.

**The moat:** Anyone can bolt AI onto a wallet. Almost nobody is doing AI **inside cryptographically-enforced permission boundaries.** That combination — autonomous *and* provably safe — is the whole game.

---

## The One Thing To Remember

> **Most AI finance tools ask you to trust them.**
> **Metagent doesn't ask for trust — it removes the need for it.**

Autonomous when you want speed. Bounded when you need safety. Yours, always.

---

### Metagent Finance — your treasury, on autopilot, on a leash.
*Built on Base. Powered by AI agents. Secured by the protocol itself.*
