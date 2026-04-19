import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(__dirname, "..", "data", "accounts.json");

export const ROLE_ROUTES = {
  basic:   ["/dashboard", "/report", "/insight", "/simple", "/methodology"],
  analyst: ["/dashboard", "/report", "/insight", "/simple", "/methodology", "/newspim"],
  admin:   ["/dashboard", "/report", "/insight", "/simple", "/methodology", "/newspim", "/feeds", "/accounts"],
};

const ROLE_LABELS = { basic: "기본", analyst: "분석가", admin: "관리자" };
export { ROLE_LABELS };

async function readFile() {
  try { return JSON.parse(await fs.readFile(FILE, "utf-8")); }
  catch { return { accounts: [] }; }
}

async function writeFile(data) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(data, null, 2));
}

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = (await scryptAsync(password, salt, 32)).toString("hex");
  return `${salt}:${hash}`;
}

async function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(":");
  const hashBuf = Buffer.from(hash, "hex");
  const derivedBuf = await scryptAsync(password, salt, 32);
  return timingSafeEqual(hashBuf, derivedBuf);
}

const DEFAULTS = [
  { id: "1", name: "기본 사용자", password: "gamja!",  role: "basic" },
  { id: "2", name: "분석가",     password: "gamja1!", role: "analyst" },
  { id: "3", name: "관리자",     password: "gamja2!", role: "admin" },
];

export async function initAccounts() {
  const data = await readFile();
  if (data.accounts.length > 0) return;
  const accounts = await Promise.all(DEFAULTS.map(async d => ({
    id: d.id, name: d.name, role: d.role,
    password: await hashPassword(d.password),
    createdAt: new Date().toISOString(),
  })));
  await writeFile({ accounts });
  console.log("[auth] 기본 계정 3개 초기화 완료");
}

export async function authenticate(password) {
  const data = await readFile();
  for (const acc of data.accounts) {
    try {
      if (await verifyPassword(password, acc.password)) {
        return { id: acc.id, name: acc.name, role: acc.role, routes: ROLE_ROUTES[acc.role] || [] };
      }
    } catch { /* 해시 형식 오류 무시 */ }
  }
  return null;
}

export async function getAccounts() {
  const data = await readFile();
  return data.accounts.map(({ id, name, role, createdAt, updatedAt }) => ({ id, name, role, createdAt, updatedAt }));
}

export async function addAccount({ name, password, role }) {
  if (!ROLE_ROUTES[role]) throw new Error("유효하지 않은 역할입니다");
  const data = await readFile();
  const hashed = await hashPassword(password);
  const account = { id: Date.now().toString(), name, role, password: hashed, createdAt: new Date().toISOString() };
  data.accounts.push(account);
  await writeFile(data);
  return { id: account.id, name, role };
}

export async function updateAccount(id, { name, role, password }) {
  if (role && !ROLE_ROUTES[role]) throw new Error("유효하지 않은 역할입니다");
  const data = await readFile();
  const idx = data.accounts.findIndex(a => a.id === id);
  if (idx === -1) throw new Error("계정을 찾을 수 없습니다");
  data.accounts[idx] = {
    ...data.accounts[idx],
    ...(name ? { name } : {}),
    ...(role ? { role } : {}),
    ...(password ? { password: await hashPassword(password) } : {}),
    updatedAt: new Date().toISOString(),
  };
  await writeFile(data);
  const a = data.accounts[idx];
  return { id: a.id, name: a.name, role: a.role };
}

export async function removeAccount(id) {
  const data = await readFile();
  const filtered = data.accounts.filter(a => a.id !== id);
  if (filtered.length === data.accounts.length) throw new Error("계정을 찾을 수 없습니다");
  if (filtered.filter(a => a.role === "admin").length === 0) {
    throw new Error("관리자 계정은 최소 1개 유지해야 합니다");
  }
  await writeFile({ accounts: filtered });
}
