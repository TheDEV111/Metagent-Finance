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

export async function upsertUser(walletAddress: string, masterContext?: unknown): Promise<UserProfile> {
  const res = await fetch(`${API}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ walletAddress, masterContext }),
  });
  if (!res.ok) throw new Error(`upsertUser failed: ${res.status}`);
  return res.json();
}

export async function fetchUser(userId: string): Promise<UserProfile> {
  const res = await fetch(`${API}/api/users/${userId}`);
  if (!res.ok) throw new Error(`fetchUser failed: ${res.status}`);
  return res.json();
}

export async function updateUserProfile(
  userId: string,
  data: Partial<Pick<UserProfile, "treasuryName" | "email" | "emailVerified" | "notifPrefs">>
): Promise<UserProfile> {
  const res = await fetch(`${API}/api/users/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`updateUserProfile failed: ${res.status}`);
  return res.json();
}

export async function triggerTrade(userId: string): Promise<{ tradeId: string; taskId: string; intent: unknown }> {
  const webhookUrl = `${API}/api/webhook/1shot`;
  const res = await fetch(`${API}/api/trade`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, webhookUrl }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`triggerTrade failed: ${res.status} — ${text}`);
  }
  return res.json();
}

export async function fetchTrades(userId: string): Promise<LiveTrade[]> {
  const res = await fetch(`${API}/api/trades/${userId}`);
  if (!res.ok) throw new Error(`fetchTrades failed: ${res.status}`);
  return res.json();
}
