import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { getBriefing, saveBriefing, listDates } from "./store.js";
import { getArticles, listArticleDates } from "./articleStore.js";
import { generateBriefing } from "./generate.js";
import { startScheduler } from "./scheduler.js";
import { collectAll, SOURCES } from "./collectors/index.js";
import { generateReport } from "./report.js";

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

// ─── 등록된 소스 목록 ──────────────────────────────────────
app.get("/api/sources", (req, res) => {
  res.json(Object.values(SOURCES).map(({ key, name }) => ({ key, name })));
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
app.get("/api/collect/stream", (req, res) => {
  const { source = "all" } = req.query;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const send = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  collectAll(source, send)
    .then(() => res.end())
    .catch(err => {
      send({ type: "error", error: err.message });
      res.end();
    });
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
