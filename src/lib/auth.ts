export type AppRole = "admin" | "production";

export type AppSession = {
  username: string;
  displayName: string;
  role: AppRole;
  signedInAt: string;
};

export type AppUserSummary = {
  username: string;
  displayName: string;
  role: AppRole;
  builtIn: boolean;
  createdAt?: string;
};

type AppUser = {
  username: string;
  displayName: string;
  role: AppRole;
  passwordHash: string;
  builtIn?: boolean;
  createdAt?: string;
};

const SESSION_KEY = "oee-production-session-v1";
const CUSTOM_USERS_KEY = "oee-production-users-v1";

const builtInUsers: AppUser[] = [
  {
    username: "admin",
    displayName: "Administrator",
    role: "admin",
    passwordHash: "c3baf7d2bef9cffb097eb144a14df41f143af3b023ef21d448f449d2e9d4baf0",
    builtIn: true,
  },
  {
    username: "production",
    displayName: "Production",
    role: "production",
    passwordHash: "86a1f963447b489c579084029ae10e1c31ffcc90081bc220fa9da83bf1dfe89f",
    builtIn: true,
  },
];

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

function loadCustomUsers(): AppUser[] {
  try {
    const raw = window.localStorage.getItem(CUSTOM_USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AppUser[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((user) => user.username && user.passwordHash && user.role);
  } catch {
    return [];
  }
}

function saveCustomUsers(users: AppUser[]) {
  window.localStorage.setItem(CUSTOM_USERS_KEY, JSON.stringify(users));
}

function getUsers() {
  return [...builtInUsers, ...loadCustomUsers()];
}

function toSummary(user: AppUser): AppUserSummary {
  return {
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    builtIn: Boolean(user.builtIn),
    createdAt: user.createdAt,
  };
}

export function listUsers() {
  return getUsers().map(toSummary);
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
  const normalized = normalizeUsername(username);
  const user = getUsers().find((item) => item.username === normalized);
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

export async function createUser(input: {
  username: string;
  displayName: string;
  role: AppRole;
  password: string;
}) {
  const username = normalizeUsername(input.username);
  const displayName = input.displayName.trim() || username;
  const password = input.password.trim();

  if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
    throw new Error("Username ต้องเป็น a-z, 0-9, จุด, ขีดกลาง หรือ underscore ความยาว 3-32 ตัว");
  }
  if (password.length < 6) {
    throw new Error("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
  }
  if (input.role !== "admin" && input.role !== "production") {
    throw new Error("Role ไม่ถูกต้อง");
  }
  if (getUsers().some((user) => user.username === username)) {
    throw new Error("Username นี้มีอยู่แล้ว");
  }

  const customUsers = loadCustomUsers();
  customUsers.push({
    username,
    displayName,
    role: input.role,
    passwordHash: await sha256(password),
    createdAt: new Date().toISOString(),
  });
  saveCustomUsers(customUsers);
  return listUsers();
}

export function deleteUser(username: string) {
  const normalized = normalizeUsername(username);
  if (builtInUsers.some((user) => user.username === normalized)) {
    throw new Error("ไม่สามารถลบบัญชีเริ่มต้นได้");
  }
  saveCustomUsers(loadCustomUsers().filter((user) => user.username !== normalized));
  return listUsers();
}

export function canAccessTab(session: AppSession, tab: string) {
  if (session.role === "admin") return true;
  return tab === "entry" || tab === "history";
}
