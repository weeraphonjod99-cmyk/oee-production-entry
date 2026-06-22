export type AppRole = "admin" | "production";

export type AppSession = {
  username: string;
  displayName: string;
  role: AppRole;
  signedInAt: string;
};

type AppUser = {
  username: string;
  displayName: string;
  role: AppRole;
  passwordHash: string;
};

const SESSION_KEY = "oee-production-session-v1";

const users: AppUser[] = [
  {
    username: "admin",
    displayName: "Administrator",
    role: "admin",
    passwordHash: "c3baf7d2bef9cffb097eb144a14df41f143af3b023ef21d448f449d2e9d4baf0",
  },
  {
    username: "production",
    displayName: "Production",
    role: "production",
    passwordHash: "86a1f963447b489c579084029ae10e1c31ffcc90081bc220fa9da83bf1dfe89f",
  },
];

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function loadSession(): AppSession | null {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AppSession;
    if (!parsed.username || !parsed.role) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearSession() {
  window.localStorage.removeItem(SESSION_KEY);
}

export async function signIn(username: string, password: string) {
  const normalized = username.trim().toLowerCase();
  const user = users.find((item) => item.username === normalized);
  if (!user) throw new Error("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");

  const hash = await sha256(password);
  if (hash !== user.passwordHash) {
    throw new Error("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
  }

  const session: AppSession = {
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    signedInAt: new Date().toISOString(),
  };
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function canAccessTab(session: AppSession, tab: string) {
  if (session.role === "admin") return true;
  return tab === "entry" || tab === "history";
}
