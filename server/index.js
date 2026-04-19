import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { getBriefing, saveBriefing, listDates } from "./store.js";
import { saveCollectLog } from "./collectLogger.js";
import { getArticles, listArticleDates } from "./articleStore.js";
import { generateBriefing } from "./generate.js";
import { startScheduler } from "./scheduler.js";
import { collectAll, SOURCES } from "./collectors/index.js";
import { generateReport } from "./report.js";
import { generateInsight, generateAIInsight } from "./insight.js";
import { getCustomSources, addCustomSource, updateCustomSource, removeCustomSource } from "./feedStore.js";
import { initAccounts, authenticate, getAccounts, addAccount, updateAccount, removeAccount } from "./accountStore.js";
import { createSession, destroySession, authGuard, requireRole, checkRateLimit, resetRateLimit } from "./authMiddleware.js";
import Parser from "rss-parser";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const IS_PROD = process.env.NODE_ENV === "production";

// ─── 보안: CORS (프로덕션에서는 동일 오리진만 허용) ──────
const ALLOWED_ORIGINS = IS_PROD
  ? [process.env.ALLOWED_ORIGIN].filter(Boolean)
  : ["http://localhost:5173", "http://localhost:3001"];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error("CORS 차단"));
  },
  credentials: true,
}));

app.use(express.json({ limit: "200kb" }));

// ─── 프로덕션: React 빌드 정적 서빙 ───────────────────────
if (IS_PROD) {
  const distPath = path.join(__dirname, "..", "dist");
  app.use(express.static(distPath));
}

// ─── 인증 미들웨어: /api/auth/login, /api/status 제외 ─────
app.use("/api", authGuard(["/auth/login", "/status"]));

// ─── 인증 ──────────────────────────────────────────────────
app.post("/api/auth/login", async (req, res) => {
  const ip = req.ip || req.socket.remoteAddress || "unknown";

  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: "로그인 시도가 너무 많습니다. 15분 후 다시 시도하세요." });
  }

  const { password } = req.body || {};
  if (!password) return res.status(400).json({ error: "비밀번호를 입력하세요" });

  const account = await authenticate(password);
  if (!account) {
    return res.status(401).json({ error: "비밀번호가 틀렸습니다" });
  }

  resetRateLimit(ip);
  const token = createSession(account);
  res.json({ ok: true, token, name: account.name, role: account.role, routes: account.routes });
});

app.post("/api/auth/logout", (req, res) => {
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
  destroySession(token);
  res.json({ ok: true });
});

app.get("/api/auth/me", (req, res) => {
  const { id, name, role, routes } = req.session;
  res.json({ id, name, role, routes });
});

// ─── 브리핑 조회 ───────────────────────────────────────────
app.get("/api/briefing", async (req, res) => {
  const { date } = req.query;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date))
    return res.status(400).json({ error: "date 파라미터가 필요합니다 (YYYY-MM-DD)" });
  const briefing = await getBriefing(date);
  if (!briefing) return res.status(404).json({ error: "해당 날짜의 브리핑이 없습니다." });
  res.json(briefing);
});

// ─── 브리핑 생성 ───────────────────────────────────────────
app.post("/api/briefing/generate", async (req, res) => {
  const { date, force = false } = req.body || {};
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date))
    return res.status(400).json({ error: "date 필드가 필요합니다 (YYYY-MM-DD)" });
  if (!force) {
    const cached = await getBriefing(date);
    if (cached) return res.json({ ...cached, cached: true });
  }
  try {
    const content = await generateBriefing(date);
    await saveBriefing(date, content);
    const saved = await getBriefing(date);
    res.json({ ...saved, cached: false });
  } catch (err) {
    console.error("[generate] 오류:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── 날짜 목록 ─────────────────────────────────────────────
app.get("/api/briefing/dates", async (_req, res) => {
  res.json({ dates: await listDates() });
});

// ─── 기사 수집 (POST) ──────────────────────────────────────
app.post("/api/collect", async (req, res) => {
  const { source = "all" } = req.body || {};
  try {
    const results = await collectAll(source);
    res.json({ ok: true, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── 소스 목록 (빌트인 + 커스텀) ──────────────────────────
app.get("/api/sources", async (_req, res) => {
  const customs = await getCustomSources();
  const builtin = Object.values(SOURCES).map(({ key, name }) => ({ key, name, builtin: true }));
  const custom  = customs.map(({ key, name }) => ({ key, name, builtin: false }));
  res.json([...builtin, ...custom]);
});

// ─── 수집된 기사 조회 ──────────────────────────────────────
app.get("/api/articles", async (req, res) => {
  const { date, source } = req.query;
  if (!date) return res.status(400).json({ error: "date 파라미터 필요" });
  const articles = await getArticles(date, source || null);
  res.json({ date, source: source || "all", count: articles.length, articles });
});

app.get("/api/articles/dates", async (_req, res) => {
  res.json({ dates: await listArticleDates() });
});

// ─── 리포트 ────────────────────────────────────────────────
app.get("/api/report", async (req, res) => {
  const { date } = req.query;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date))
    return res.status(400).json({ error: "date 파라미터 필요 (YYYY-MM-DD)" });
  try {
    const report = await generateReport(date);
    if (!report) return res.status(404).json({ error: "해당 날짜의 수집 기사가 없습니다." });
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── 수집 SSE ──────────────────────────────────────────────
app.get("/api/collect/stream", async (req, res) => {
  const { source = "all" } = req.query;
  // 인증은 authGuard가 처리 (?token= 쿼리 파라미터 포함)

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const send = (data) => { try { res.write(`data: ${JSON.stringify(data)}\n\n`); } catch {} };

  const logLines = [];
  const origLog   = console.log;
  const origWarn  = console.warn;
  const origError = console.error;
  const makeInterceptor = (level) => (...args) => {
    const msg = args.map(a => (typeof a === "string" ? a : JSON.stringify(a))).join(" ");
    const entry = { time: new Date().toISOString(), level, message: msg };
    logLines.push(entry);
    send({ type: "log", level, message: msg });
    (level === "error" ? origError : level === "warn" ? origWarn : origLog)(...args);
  };
  console.log   = makeInterceptor("info");
  console.warn  = makeInterceptor("warn");
  console.error = makeInterceptor("error");
  const restore = () => { console.log = origLog; console.warn = origWarn; console.error = origError; };

  try {
    await collectAll(source, send);
    restore();
    await saveCollectLog(logLines);
    res.end();
  } catch (err) {
    restore();
    send({ type: "error", error: err.message });
    await saveCollectLog(logLines);
    res.end();
  }
});

// ─── 수집 로그 ─────────────────────────────────────────────
app.get("/api/collect/logs", async (req, res) => {
  const date = req.query.date || new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
  try {
    const { readCollectLog } = await import("./collectLogger.js");
    res.json({ date, lines: await readCollectLog(date) });
  } catch {
    res.json({ date, lines: [] });
  }
});

// ─── 인사이트 ──────────────────────────────────────────────
app.get("/api/insight", async (req, res) => {
  const { date } = req.query;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date))
    return res.status(400).json({ error: "date 파라미터 필요 (YYYY-MM-DD)" });
  try {
    const data = await generateInsight(date);
    if (!data) return res.status(404).json({ error: "해당 날짜의 수집 기사가 없습니다." });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/insight/ai", async (req, res) => {
  const { date } = req.query;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date))
    return res.status(400).json({ error: "date 파라미터 필요 (YYYY-MM-DD)" });
  try {
    const articles = await getArticles(date);
    if (!articles?.length) return res.status(404).json({ error: "수집 기사가 없습니다." });
    res.json({ text: await generateAIInsight(articles, date) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── 피드 관리 (admin 전용) ────────────────────────────────
app.get("/api/feeds", requireRole("admin"), async (_req, res) => {
  try { res.json({ sources: await getCustomSources() }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/api/feeds", requireRole("admin"), async (req, res) => {
  const { name, key, feeds } = req.body || {};
  if (!name || !key) return res.status(400).json({ error: "name, key 필드가 필요합니다" });
  const slug = key.toLowerCase().replace(/[^a-z0-9_-]/g, "-");
  try {
    res.json({ ok: true, source: await addCustomSource({ name, key: slug, feeds: feeds || [] }) });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.put("/api/feeds/:id", requireRole("admin"), async (req, res) => {
  try {
    res.json({ ok: true, source: await updateCustomSource(req.params.id, req.body) });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete("/api/feeds/:id", requireRole("admin"), async (req, res) => {
  try { await removeCustomSource(req.params.id); res.json({ ok: true }); }
  catch (err) { res.status(400).json({ error: err.message }); }
});

// RSS URL 테스트 — SSRF 방어: 내부 주소 차단
app.post("/api/feeds/test", requireRole("admin"), async (req, res) => {
  const { url } = req.body || {};
  if (!url) return res.status(400).json({ error: "url 필드가 필요합니다" });

  // SSRF 방어: 내부 IP·localhost 차단
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const blocked = /^(localhost|127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|::1|0\.0\.0\.0)/.test(host);
    if (blocked) return res.status(400).json({ ok: false, error: "내부 주소는 허용되지 않습니다" });
  } catch {
    return res.status(400).json({ ok: false, error: "올바른 URL 형식이 아닙니다" });
  }

  try {
    const rssParser = new Parser({ timeout: 10000 });
    const result = await rssParser.parseURL(url);
    res.json({
      ok: true, title: result.title || "",
      count: result.items.length,
      sample: result.items.slice(0, 3).map(i => ({ title: i.title || "", link: i.link || "", pubDate: i.pubDate || "" })),
    });
  } catch (err) { res.status(400).json({ ok: false, error: err.message }); }
});

// ─── 계정 관리 (admin 전용) ────────────────────────────────
app.get("/api/accounts", requireRole("admin"), async (_req, res) => {
  try { res.json({ accounts: await getAccounts() }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/api/accounts", requireRole("admin"), async (req, res) => {
  const { name, password, role } = req.body || {};
  if (!name || !password || !role) return res.status(400).json({ error: "name, password, role 필드가 필요합니다" });
  try { res.json({ ok: true, account: await addAccount({ name, password, role }) }); }
  catch (err) { res.status(400).json({ error: err.message }); }
});

app.put("/api/accounts/:id", requireRole("admin"), async (req, res) => {
  try {
    res.json({ ok: true, account: await updateAccount(req.params.id, req.body) });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete("/api/accounts/:id", requireRole("admin"), async (req, res) => {
  // 자기 자신 삭제 방지
  if (req.session.id === req.params.id)
    return res.status(400).json({ error: "현재 로그인된 계정은 삭제할 수 없습니다" });
  try { await removeAccount(req.params.id); res.json({ ok: true }); }
  catch (err) { res.status(400).json({ error: err.message }); }
});

// ─── 상태 확인 (인증 불필요) ───────────────────────────────
app.get("/api/status", (_req, res) => {
  res.json({ ok: true, apiKey: !!process.env.ANTHROPIC_API_KEY, time: new Date().toISOString() });
});

// ─── SPA 폴백 ──────────────────────────────────────────────
if (IS_PROD) {
  app.get("*", (_req, res) => {
    res.sendFile(path.join(__dirname, "..", "dist", "index.html"));
  });
}

// ─── 서버 시작 ─────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`[server] http://localhost:${PORT} (${IS_PROD ? "production" : "development"})`);
  if (!process.env.ANTHROPIC_API_KEY) console.warn("[server] ⚠️  ANTHROPIC_API_KEY 미설정");
  await initAccounts();
  startScheduler();
});
