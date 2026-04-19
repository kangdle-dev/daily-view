import { randomBytes } from "crypto";

// In-memory session store: token → { id, name, role, routes, createdAt }
const sessions = new Map();

// Login rate limit: ip → { count, resetAt }
const loginAttempts = new Map();
const RATE_LIMIT  = 10;
const RATE_WINDOW = 15 * 60 * 1000; // 15분

export function createSession(account) {
  const token = randomBytes(32).toString("hex");
  sessions.set(token, { ...account, createdAt: Date.now() });
  return token;
}

export function validateSession(token) {
  if (!token) return null;
  return sessions.get(token) || null;
}

export function destroySession(token) {
  sessions.delete(token);
}

/** IP별 로그인 시도 제한. 허용 시 true 반환 */
export function checkRateLimit(ip) {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export function resetRateLimit(ip) {
  loginAttempts.delete(ip);
}

/** Bearer 토큰 또는 ?token= 쿼리 파라미터(SSE용)로 세션 검증 */
function extractToken(req) {
  const header = (req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
  return header || req.query.token || null;
}

/** 인증 전용 미들웨어 (공개 경로 제외) */
export function authGuard(publicPaths = []) {
  return (req, res, next) => {
    if (publicPaths.some(p => req.path === p || req.path.startsWith(p + "/"))) {
      return next();
    }
    const token = extractToken(req);
    const session = validateSession(token);
    if (!session) return res.status(401).json({ error: "인증이 필요합니다" });
    req.session = session;
    next();
  };
}

/** 역할 기반 접근 제어 미들웨어 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.session) return res.status(401).json({ error: "인증이 필요합니다" });
    if (!roles.includes(req.session.role)) return res.status(403).json({ error: "접근 권한이 없습니다" });
    next();
  };
}
