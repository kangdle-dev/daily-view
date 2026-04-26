/**
 * @file accountStore.js
 * 계정 관리 — scrypt 해시 저장, 로그인 검증, 역할별 접근 경로 정의
 * 저장소: data/accounts.json
 */
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
  admin:   ["/dashboard", "/report", "/insight", "/simple", "/methodology", "/newspim", "/feeds", "/settings", "/accounts"],
};

const ROLE_LABELS = { basic: "기본", analyst: "분석가", admin: "관리자" };
export { ROLE_LABELS };

/** accounts.json 읽기 — 파일 없으면 빈 목록 반환 */
async function readFile() {
  try { return JSON.parse(await fs.readFile(FILE, "utf-8")); }
  catch { return { accounts: [] }; }
}

/** accounts.json 쓰기 */
async function writeFile(data) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(data, null, 2));
}

/** scrypt로 비밀번호 해시 생성 — "salt:hash" 형식 반환 */
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = (await scryptAsync(password, salt, 32)).toString("hex");
  return `${salt}:${hash}`;
}

/** 타이밍 안전 비교로 비밀번호 검증 */
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

/** 서버 시작 시 기본 계정 3개 초기화 (이미 있으면 스킵) */
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

/** 비밀번호로 계정 검증 — 일치 시 { id, name, role, routes } 반환, 실패 시 null */
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

/** 전체 계정 목록 반환 (비밀번호 필드 제외) */
export async function getAccounts() {
  const data = await readFile();
  return data.accounts.map(({ id, name, role, createdAt, updatedAt }) => ({ id, name, role, createdAt, updatedAt }));
}

/** 새 계정 추가 — 비밀번호 해시 후 저장 */
export async function addAccount({ name, password, role }) {
  if (!ROLE_ROUTES[role]) throw new Error("유효하지 않은 역할입니다");
  const data = await readFile();
  const hashed = await hashPassword(password);
  const account = { id: Date.now().toString(), name, role, password: hashed, createdAt: new Date().toISOString() };
  data.accounts.push(account);
  await writeFile(data);
  return { id: account.id, name, role };
}

/** 계정 정보 수정 — 전달된 필드만 변경 */
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

/** 계정 삭제 — 관리자 계정이 0개가 되는 경우 차단 */
export async function removeAccount(id) {
  const data = await readFile();
  const filtered = data.accounts.filter(a => a.id !== id);
  if (filtered.length === data.accounts.length) throw new Error("계정을 찾을 수 없습니다");
  if (filtered.filter(a => a.role === "admin").length === 0) {
    throw new Error("관리자 계정은 최소 1개 유지해야 합니다");
  }
  await writeFile({ accounts: filtered });
}
