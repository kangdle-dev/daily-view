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
import Parser from "rss-parser";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const IS_PROD = process.env.NODE_ENV === "production";

app.use(cors());
app.use(express.json());

// ─── 프로덕션: React 빌드 정적 서빙 ───────────────────────
if (IS_PROD) {
  const distPath = path.join(__dirname, "..", "dist");
  app.use(express.static(distPath));
}

// ─── 브리핑 조회 ───────────────────────────────────────────
// GET /api/briefing?date=YYYY-MM-DD
app.get("/api/briefing", async (req, res) => {
  const { date } = req.query;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: "date 파라미터가 필요합니다 (YYYY-MM-DD)" });
  }

  const briefing = await getBriefing(date);
  if (!briefing) {
    return res.status(404).json({ error: "해당 날짜의 브리핑이 없습니다." });
  }

  res.json(briefing);
});

// ─── 브리핑 생성 (온디맨드) ────────────────────────────────
// POST /api/briefing/generate  { date: "YYYY-MM-DD", force: false }
app.post("/api/briefing/generate", async (req, res) => {
  const { date, force = false } = req.body || {};
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: "date 필드가 필요합니다 (YYYY-MM-DD)" });
  }

  // 이미 캐시된 경우 바로 반환 (force: true 이면 재생성)
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
// GET /api/briefing/dates
app.get("/api/briefing/dates", async (req, res) => {
  const dates = await listDates();
  res.json({ dates });
});

// ─── 기사 수집 (수동 트리거) ───────────────────────────────
// POST /api/collect  { source: "khan" }
app.post("/api/collect", async (req, res) => {
  const { source = "all" } = req.body || {};
  try {
    const results = await collectAll(source);
    res.json({ ok: true, results });
  } catch (err) {
    console.error("[collect] 오류:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── 등록된 소스 목록 (빌트인 + 커스텀) ───────────────────
app.get("/api/sources", async (_req, res) => {
  const customs = await getCustomSources();
  const builtin = Object.values(SOURCES).map(({ key, name }) => ({ key, name, builtin: true }));
  const custom  = customs.map(({ key, name }) => ({ key, name, builtin: false }));
  res.json([...builtin, ...custom]);
});

// ─── 피드 관리 ─────────────────────────────────────────────
// GET /api/feeds — 커스텀 소스 목록
app.get("/api/feeds", async (_req, res) => {
  try {
    const sources = await getCustomSources();
    res.json({ sources });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/feeds — 새 커스텀 소스 추가
app.post("/api/feeds", async (req, res) => {
  const { name, key, feeds } = req.body || {};
  if (!name || !key) return res.status(400).json({ error: "name, key 필드가 필요합니다" });
  const slug = key.toLowerCase().replace(/[^a-z0-9_-]/g, "-");
  try {
    const source = await addCustomSource({ name, key: slug, feeds: feeds || [] });
    res.json({ ok: true, source });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/feeds/:id — 커스텀 소스 수정
app.put("/api/feeds/:id", async (req, res) => {
  const { id } = req.params;
  const { name, key, feeds } = req.body || {};
  try {
    const source = await updateCustomSource(id, { name, key, feeds });
    res.json({ ok: true, source });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/feeds/:id — 커스텀 소스 삭제
app.delete("/api/feeds/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await removeCustomSource(id);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/feeds/test — RSS URL 테스트
app.post("/api/feeds/test", async (req, res) => {
  const { url } = req.body || {};
  if (!url) return res.status(400).json({ error: "url 필드가 필요합니다" });
  try {
    const rssParser = new Parser({ timeout: 10000 });
    const result = await rssParser.parseURL(url);
    const sample = result.items.slice(0, 3).map(item => ({
      title: item.title || "",
      link: item.link || "",
      pubDate: item.pubDate || item.isoDate || "",
    }));
    res.json({ ok: true, title: result.title || "", count: result.items.length, sample });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// ─── 수집된 기사 조회 ──────────────────────────────────────
// GET /api/articles?date=YYYY-MM-DD&source=khan
app.get("/api/articles", async (req, res) => {
  const { date, source } = req.query;
  if (!date) return res.status(400).json({ error: "date 파라미터 필요" });
  const articles = await getArticles(date, source || null);
  res.json({ date, source: source || "all", count: articles.length, articles });
});

// ─── 수집 날짜 목록 ────────────────────────────────────────
app.get("/api/articles/dates", async (req, res) => {
  const dates = await listArticleDates();
  res.json({ dates });
});

// ─── 리포트 생성 ───────────────────────────────────────────
// GET /api/report?date=YYYY-MM-DD
app.get("/api/report", async (req, res) => {
  const { date } = req.query;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: "date 파라미터 필요 (YYYY-MM-DD)" });
  }
  try {
    const report = await generateReport(date);
    if (!report) return res.status(404).json({ error: "해당 날짜의 수집 기사가 없습니다." });
    res.json(report);
  } catch (err) {
    console.error("[report] 오류:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── 인증 ──────────────────────────────────────────────────
// POST /api/auth/login  { password }
app.post("/api/auth/login", (req, res) => {
  const { password } = req.body || {};
  const correct = process.env.SITE_PASSWORD || "gamja!";
  if (password === correct) {
    res.json({ ok: true });
  } else {
    res.status(401).json({ ok: false, error: "비밀번호가 틀렸습니다" });
  }
});

// ─── 기사 수집 스트리밍 (SSE) ──────────────────────────────
// GET /api/collect/stream?source=all
app.get("/api/collect/stream", async (req, res) => {
  const { source = "all" } = req.query;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const send = (data) => {
    try { res.write(`data: ${JSON.stringify(data)}\n\n`); } catch {}
  };

  // ── console 인터셉터: 수집 중 모든 로그를 SSE + 파일로 ──
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

  const restore = () => {
    console.log   = origLog;
    console.warn  = origWarn;
    console.error = origError;
  };

  try {
    await collectAll(source, send);
    restore();
    // 로그 파일 저장
    await saveCollectLog(logLines);
    res.end();
  } catch (err) {
    restore();
    send({ type: "error", error: err.message });
    await saveCollectLog(logLines);
    res.end();
  }
});

// ─── 수집 로그 조회 ────────────────────────────────────────
// GET /api/collect/logs?date=YYYY-MM-DD  (없으면 오늘)
app.get("/api/collect/logs", async (req, res) => {
  const date = req.query.date || new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
  try {
    const { readCollectLog } = await import("./collectLogger.js");
    const lines = await readCollectLog(date);
    res.json({ date, lines });
  } catch {
    res.json({ date, lines: [] });
  }
});

// ─── 인사이트 분석 ─────────────────────────────────────────
// GET /api/insight?date=YYYY-MM-DD
app.get("/api/insight", async (req, res) => {
  const { date } = req.query;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date))
    return res.status(400).json({ error: "date 파라미터 필요 (YYYY-MM-DD)" });
  try {
    const data = await generateInsight(date);
    if (!data) return res.status(404).json({ error: "해당 날짜의 수집 기사가 없습니다." });
    res.json(data);
  } catch (err) {
    console.error("[insight] 오류:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/insight/ai?date=YYYY-MM-DD
app.get("/api/insight/ai", async (req, res) => {
  const { date } = req.query;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date))
    return res.status(400).json({ error: "date 파라미터 필요 (YYYY-MM-DD)" });
  try {
    const { getArticles } = await import("./articleStore.js");
    const articles = await getArticles(date);
    if (!articles || articles.length === 0)
      return res.status(404).json({ error: "해당 날짜의 수집 기사가 없습니다." });
    const text = await generateAIInsight(articles, date);
    res.json({ text });
  } catch (err) {
    console.error("[insight/ai] 오류:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── 상태 확인 ─────────────────────────────────────────────
app.get("/api/status", (req, res) => {
  res.json({
    ok: true,
    apiKey: !!process.env.ANTHROPIC_API_KEY,
    time: new Date().toISOString(),
  });
});

// ─── SPA 폴백 (React Router) ───────────────────────────────
// /api 이외의 모든 경로는 index.html 반환 (프로덕션만)
if (IS_PROD) {
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "dist", "index.html"));
  });
}

// ─── 서버 시작 ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[server] http://localhost:${PORT} (${IS_PROD ? "production" : "development"})`);

  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("[server] ⚠️  ANTHROPIC_API_KEY 미설정");
  }

  startScheduler();
});
