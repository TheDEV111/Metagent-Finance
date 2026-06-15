const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export interface NotifPrefs {
  confirmed: boolean;
  decisions: boolean;
  reverts: boolean;
  keys: boolean;
}

export interface UserProfile {
  id: string;
  walletAddress: string;
  treasuryName: string | null;
  email: string | null;
  emailVerified: boolean;
  notifPrefs: NotifPrefs | null;
}

export interface LiveTrade {
  id: string;
  cioPromptJson: { target: string; amount_usdc: number; router: string };
  relayerTaskId: string | null;
  status: "PENDING" | "SUBMITTED" | "CONFIRMED" | "REVERTED";
  createdAt: string;
  updatedAt: string;
}

// ── Auth token management ──────────────────────────────────────────────────────
// Token is stored in localStorage under "mg_token" and included on every request.
// Populated automatically when upsertUser returns a sessionToken.

function getAuthHeaders(): Record<string, string> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("mg_token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ── API functions ──────────────────────────────────────────────────────────────

export async function upsertUser(
  walletAddress: string,
  masterContext?: unknown
): Promise<UserProfile> {
  const res = await fetch(`${API}/api/users`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ walletAddress, masterContext }),
  });
  if (!res.ok) throw new Error(`upsertUser failed: ${res.status}`);
  const user = await res.json();
  // Store session token on first connect so all subsequent requests are authenticated
  if (user.sessionToken && typeof window !== "undefined") {
    localStorage.setItem("mg_token", user.sessionToken);
  }
  return user;
}

export async function fetchUser(userId: string): Promise<UserProfile> {
  const res = await fetch(`${API}/api/users/${userId}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`fetchUser failed: ${res.status}`);
  return res.json();
}

export async function updateUserProfile(
  userId: string,
  data: Partial<Pick<UserProfile, "treasuryName" | "email" | "emailVerified" | "notifPrefs">>
): Promise<UserProfile> {
  const res = await fetch(`${API}/api/users/${userId}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`updateUserProfile failed: ${res.status}`);
  return res.json();
}

export async function triggerTrade(
  userId: string
): Promise<{
  tradeId: string;
  taskId: string;
  intent: unknown;
  swapExecution?: { slippageBps: number; reasoning: string };
}> {
  const webhookUrl = `${API}/api/webhook/1shot`;
  const res = await fetch(`${API}/api/trade`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ userId, webhookUrl }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`triggerTrade failed: ${res.status} — ${text}`);
  }
  return res.json();
}

export async function fetchTrades(userId: string): Promise<LiveTrade[]> {
  const res = await fetch(`${API}/api/trades/${userId}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`fetchTrades failed: ${res.status}`);
  return res.json();
}
