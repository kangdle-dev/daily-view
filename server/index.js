import "dotenv/config";
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getBriefing, saveBriefing, listDates } from "./store.js";
import { saveCollectLog } from "./collectLogger.js";
import { getArticles, listArticleDates } from "./articleStore.js";
import { generateBriefing } from "./generate.js";
import { startScheduler } from "./scheduler.js";
import { collectAll } from "./collectors/index.js";
import { generateReport } from "./report.js";
import { generateInsight, generateAIInsight } from "./insight.js";
import { getCustomSources, addCustomSource, updateCustomSource, removeCustomSource } from "./feedStore.js";
import { initAccounts, authenticate, getAccounts, addAccount, updateAccount, removeAccount } from "./accountStore.js";
import { createSession, destroySession, authGuard, requireRole, checkRateLimit, resetRateLimit } from "./authMiddleware.js";
import { getSettings, saveSettings } from "./settingsStore.js";
import { restartScheduler } from "./scheduler.js";
import { initRedis, seedData } from "./redisStore.js";
import { sendTelegramMessage } from "./telegramService.js";
import { getReport, saveReport, deleteAllReports } from "./reportStore.js";
import { generatePersonReport } from "./personReport.js";
import { generatePersonInsight } from "./personInsight.js";
import Parser from "rss-parser";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const IS_PROD = process.env.NODE_ENV === "production";

// ─── feeds.json 초기화 (Railway 배포 시 자동 생성) ────────
const dataDir = path.join(__dirname, "..", "data");
const feedsPath = path.join(dataDir, "feeds.json");
const DEFAULT_FEEDS = {
  sources: [
    {
      id: "1",
      key: "khan",
      name: "경향신문",
      feeds: [
        { url: "https://www.khan.co.kr/rss/rssdata/politic_news.xml", category: "정치", mainCategory: "정치" },
        { url: "https://www.khan.co.kr/rss/rssdata/economy_news.xml", mainCategory: "경제" },
        { url: "https://www.khan.co.kr/rss/rssdata/society_news.xml", mainCategory: "사회" },
        { url: "https://www.khan.co.kr/rss/rssdata/kh_world.xml", mainCategory: "국제" },
        { url: "https://www.khan.co.kr/rss/rssdata/kh_sports.xml", mainCategory: "스포츠" },
        { url: "https://www.khan.co.kr/rss/rssdata/culture_news.xml", mainCategory: "문화" }
      ],
      createdAt: new Date().toISOString()
    },
    {
      id: "2",
      key: "chosun",
      name: "조선일보",
      feeds: [
        { url: "https://www.chosun.com/arc/outboundfeeds/rss/category/politics/?outputType=xml", category: "정치", mainCategory: "정치" },
        { url: "https://www.chosun.com/arc/outboundfeeds/rss/category/economy/?outputType=xml", mainCategory: "경제" },
        { url: "https://www.chosun.com/arc/outboundfeeds/rss/category/national/?outputType=xml", mainCategory: "사회" },
        { url: "https://www.chosun.com/arc/outboundfeeds/rss/category/international/?outputType=xml", mainCategory: "국제" },
        { url: "https://www.chosun.com/arc/outboundfeeds/rss/category/culture-life/?outputType=xml", mainCategory: "문화" },
        { url: "https://www.chosun.com/arc/outboundfeeds/rss/category/sports/?outputType=xml", mainCategory: "스포츠" }
      ],
      createdAt: new Date().toISOString()
    },
    {
      id: "3",
      key: "newstomato",
      name: "뉴스토마토",
      feeds: [
        { url: "https://www.newstomato.com/rss/?cate=11", category: "정치", mainCategory: "정치" },
        { url: "https://www.newstomato.com/rss/?cate=12", mainCategory: "증권.금융" },
        { url: "https://www.newstomato.com/rss/?cate=14", mainCategory: "산업" },
        { url: "https://www.newstomato.com/rss/?cate=16", mainCategory: "부동산" },
        { url: "https://www.newstomato.com/rss/?cate=17", mainCategory: "문화" }
      ],
      createdAt: new Date().toISOString()
    },
    {
      id: "4",
      key: "yonhap",
      name: "연합뉴스",
      feeds: [
        { url: "https://www.yna.co.kr/rss/politics.xml", category: "정치", mainCategory: "정치" },
        { url: "https://www.yna.co.kr/rss/northkorea.xml", mainCategory: "북한" },
        { url: "https://www.yna.co.kr/rss/economy.xml", mainCategory: "경제" },
        { url: "https://www.yna.co.kr/rss/market.xml", mainCategory: "증권.금융" },
        { url: "https://www.yna.co.kr/rss/industry.xml", mainCategory: "산업" },
        { url: "https://www.yna.co.kr/rss/society.xml", mainCategory: "사회" },
        { url: "https://www.yna.co.kr/rss/international.xml", mainCategory: "국제" },
        { url: "https://www.yna.co.kr/rss/entertainment.xml", mainCategory: "문화" },
        { url: "https://www.yna.co.kr/rss/sports.xml", mainCategory: "스포츠" }
      ],
      createdAt: new Date().toISOString()
    },
    {
      id: "5",
      key: "newspim",
      name: "뉴스핌",
      feeds: [
        { url: "http://rss.newspim.com/news/category/101", category: "정치", mainCategory: "정치" },
        { url: "http://rss.newspim.com/news/category/103", mainCategory: "경제" },
        { url: "http://rss.newspim.com/news/category/102", mainCategory: "사회" },
        { url: "http://rss.newspim.com/news/category/107", mainCategory: "국제" },
        { url: "http://rss.newspim.com/news/category/106", mainCategory: "산업" },
        { url: "http://rss.newspim.com/news/category/105", mainCategory: "증권.금융" },
        { url: "http://rss.newspim.com/news/category/104", mainCategory: "부동산" },
        { url: "http://rss.newspim.com/news/category/108", mainCategory: "전국" },
        { url: "http://rss.newspim.com/news/category/110", mainCategory: "문화" },
        { url: "http://rss.newspim.com/news/category/111", mainCategory: "스포츠" }
      ],
      createdAt: new Date().toISOString()
    }
  ]
};

if (!fs.existsSync(feedsPath)) {
  try {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(feedsPath, JSON.stringify(DEFAULT_FEEDS, null, 2));
    console.log("[init] ✅ feeds.json 생성 완료");
  } catch (err) {
    console.error("[init] feeds.json 생성 실패:", err.message);
  }
}

// ─── Redis 초기화 ────────────────────────────────────────
await initRedis();

// Redis에 기본 feeds 로드 (없으면 생성)
await seedData("feeds:all", { sources: DEFAULT_FEEDS.sources });

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

// ─── 소스 목록 (커스텀만) ────────────────────────────────
app.get("/api/sources", async (_req, res) => {
  const customs = await getCustomSources();
  const sources = customs.map(({ key, name }) => ({ key, name, builtin: false }));
  res.json(sources);
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
    // 캐시 확인
    const cached = await getReport(date);
    if (cached) {
      console.log(`[report] 캐시 사용 — ${date}`);
      return res.json(cached);
    }

    // 캐시 없으면 생성
    console.log(`[report] 캐시 없음, 분석 시작 — ${date}`);
    const report = await generateReport(date);
    if (!report) return res.status(404).json({ error: "해당 날짜의 수집 기사가 없습니다." });

    // 생성된 리포트 캐싱
    await saveReport(date, report);
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── 이광재 리포트 ────────────────────────────────────────
app.get("/api/report/gwangjae", async (req, res) => {
  const { date } = req.query;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date))
    return res.status(400).json({ error: "date 파라미터 필요 (YYYY-MM-DD)" });
  try {
    const report = await generatePersonReport(date, ["이광재"]);
    if (!report) return res.status(404).json({ error: "이광재 관련 기사가 없습니다." });
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── 이광재 인사이트 (정서 분석 + AI 요약) ──────────────
app.get("/api/report/gwangjae/insight", async (req, res) => {
  const { date } = req.query;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date))
    return res.status(400).json({ error: "date 파라미터 필요 (YYYY-MM-DD)" });
  try {
    const articles = await getArticles(date);
    if (!articles?.length) return res.status(404).json({ error: "기사가 없습니다." });

    // 이광재 관련 기사만 필터
    const filtered = articles.filter(a => {
      const text = (a.title || "") + " " + (a.content || "") + " " + (a.summary || "");
      return text.includes("이광재");
    });

    if (!filtered.length) return res.status(404).json({ error: "이광재 관련 기사가 없습니다." });

    const insight = await generatePersonInsight(date, "이광재", filtered);
    res.json(insight);
  } catch (err) {
    console.error("[gwangjae/insight] 오류:", err.message);
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
    const rssParser = new Parser({
      timeout: 20000,
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
    });
    const result = await rssParser.parseURL(url);
    res.json({
      ok: true, title: result.title || "",
      count: result.items.length,
      sample: result.items.slice(0, 3).map(i => ({ title: i.title || "", link: i.link || "", pubDate: i.pubDate || "" })),
    });
  } catch (err) { res.status(400).json({ ok: false, error: err.message }); }
});

// ─── 설정 관리 (admin 전용) ────────────────────────────────
app.get("/api/settings", requireRole("admin"), async (_req, res) => {
  try {
    const settings = await getSettings();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/settings", requireRole("admin"), async (req, res) => {
  try {
    const updated = await saveSettings(req.body);
    // 설정 변경 후 스케줄러 재시작
    await restartScheduler();
    res.json({ ok: true, settings: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── Telegram 리포트 발송 ────────────────────────────────
app.post("/api/telegram/send-report", async (req, res) => {
  try {
    const { date, report } = req.body;
    const targetCats = ["정치", "경제", "사회", "국제", "증권·금융"].filter(c => report.categories[c]);

    // 메시지 포맷팅
    let msgLines = [
      `📊 <b>뉴스 텔레그램 리포트</b>`,
      `📅 ${date}`,
      ``,
      `<b>📰 종합 주요기사</b>`,
    ];

    report.top10.slice(0, 5).forEach((a, i) => {
      msgLines.push(`${i + 1}. <a href="${a.url}">${a.title}</a>`);
    });

    msgLines.push(``, `<b>📂 카테고리별 중요기사</b>`);

    targetCats.forEach(cat => {
      const articles = report.categories[cat] || [];
      msgLines.push(``, `<b>${cat}</b>`);
      articles.slice(0, 3).forEach((a, i) => {
        msgLines.push(`${i + 1}. <a href="${a.url}">${a.title}</a>`);
      });
    });

    const message = msgLines.join("\n");

    // 검증된 sendTelegramMessage 함수 사용
    const result = await sendTelegramMessage(message);

    if (!result) {
      throw new Error("Telegram 발송 실패");
    }

    res.json({ ok: true, message: "Telegram으로 발송되었습니다" });
  } catch (err) {
    console.error("[telegram/send-report] 오류:", err.message);
    res.status(500).json({ error: err.message || "Telegram 발송 실패. 환경 변수(TELEGRAM_BOT_TOKEN, TELEGRAM_CHANNEL_ID) 확인" });
  }
});

// ─── 이광재 리포트 Telegram 발송 ──────────────────────────
app.post("/api/telegram/send-gwangjae-report", async (req, res) => {
  try {
    const { date, report } = req.body;
    if (!report) throw new Error("리포트 데이터가 필요합니다");

    // 메시지 포맷팅
    let msgLines = [
      `📊 <b>이광재 뉴스 리포트</b>`,
      `📅 ${date}`,
      ``,
      `<b>📰 주요 기사 (${report.totalArticles}건)</b>`,
    ];

    report.top15.slice(0, 10).forEach((a, i) => {
      msgLines.push(`${i + 1}. <a href="${a.url}">${a.title}</a>`);
    });

    msgLines.push(``, `<b>🔑 관련 키워드</b>`);
    report.relatedKeywords.slice(0, 10).forEach(k => {
      msgLines.push(`• ${k.word} (${k.count})`);
    });

    const message = msgLines.join("\n");
    const result = await sendTelegramMessage(message);

    if (!result) {
      throw new Error("Telegram 발송 실패");
    }

    res.json({ ok: true, message: "Telegram으로 발송되었습니다" });
  } catch (err) {
    console.error("[telegram/send-gwangjae-report] 오류:", err.message);
    res.status(500).json({ error: err.message || "Telegram 발송 실패" });
  }
});

// ─── 데이터 관리 (admin 전용) ────────────────────────────────
app.get("/api/data/stats", requireRole("admin"), async (_req, res) => {
  try {
    const dataDir = path.join(__dirname, "..", "data");

    let stats = {
      articles: { count: 0, size: 0 },
      briefings: { count: 0, size: 0 },
      logs: { count: 0, size: 0 },
      total: { size: 0 },
    };

    // articles 폴더
    try {
      const articlesDir = path.join(dataDir, "articles");
      const files = fs.readdirSync(articlesDir);
      stats.articles.count = files.length;
      files.forEach(file => {
        const size = fs.statSync(path.join(articlesDir, file)).size;
        stats.articles.size += size;
        stats.total.size += size;
      });
    } catch (e) {}

    // briefing 파일들
    try {
      const files = fs.readdirSync(dataDir).filter(f => f.startsWith("briefing-") && f.endsWith(".json"));
      stats.briefings.count = files.length;
      files.forEach(file => {
        const size = fs.statSync(path.join(dataDir, file)).size;
        stats.briefings.size += size;
        stats.total.size += size;
      });
    } catch (e) {}

    // logs 폴더
    try {
      const logsDir = path.join(dataDir, "logs");
      const files = fs.readdirSync(logsDir);
      stats.logs.count = files.length;
      files.forEach(file => {
        const size = fs.statSync(path.join(logsDir, file)).size;
        stats.logs.size += size;
        stats.total.size += size;
      });
    } catch (e) {}

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/data/files", requireRole("admin"), async (_req, res) => {
  try {
    const dataDir = path.join(__dirname, "..", "data");

    let files = {
      articles: [],
      briefings: [],
      logs: [],
    };

    // articles 폴더
    try {
      const articlesDir = path.join(dataDir, "articles");
      const fileList = fs.readdirSync(articlesDir);
      files.articles = fileList.map(file => {
        const stat = fs.statSync(path.join(articlesDir, file));
        return { name: file, size: stat.size, modified: stat.mtime };
      }).sort((a, b) => b.modified - a.modified);
    } catch (e) {}

    // briefing 파일들
    try {
      const fileList = fs.readdirSync(dataDir).filter(f => f.startsWith("briefing-") && f.endsWith(".json"));
      files.briefings = fileList.map(file => {
        const stat = fs.statSync(path.join(dataDir, file));
        return { name: file, size: stat.size, modified: stat.mtime };
      }).sort((a, b) => b.modified - a.modified);
    } catch (e) {}

    // logs 폴더
    try {
      const logsDir = path.join(dataDir, "logs");
      const fileList = fs.readdirSync(logsDir);
      files.logs = fileList.map(file => {
        const stat = fs.statSync(path.join(logsDir, file));
        return { name: file, size: stat.size, modified: stat.mtime };
      }).sort((a, b) => b.modified - a.modified);
    } catch (e) {}

    res.json(files);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/data/delete-files", requireRole("admin"), async (req, res) => {
  try {
    const { files } = req.body; // { articles: [], briefings: [], logs: [] }
    const dataDir = path.join(__dirname, "..", "data");
    let deleted = { articles: 0, briefings: 0, logs: 0 };

    // articles 폴더
    if (files.articles && Array.isArray(files.articles)) {
      const articlesDir = path.join(dataDir, "articles");
      for (const file of files.articles) {
        try {
          fs.unlinkSync(path.join(articlesDir, file));
          deleted.articles++;
        } catch (e) {}
      }
    }

    // briefing 파일들
    if (files.briefings && Array.isArray(files.briefings)) {
      for (const file of files.briefings) {
        try {
          fs.unlinkSync(path.join(dataDir, file));
          deleted.briefings++;
        } catch (e) {}
      }
    }

    // logs 폴더
    if (files.logs && Array.isArray(files.logs)) {
      const logsDir = path.join(dataDir, "logs");
      for (const file of files.logs) {
        try {
          fs.unlinkSync(path.join(logsDir, file));
          deleted.logs++;
        } catch (e) {}
      }
    }

    console.log(`[admin] 파일 삭제: 기사 ${deleted.articles}개, 브리핑 ${deleted.briefings}개, 로그 ${deleted.logs}개`);
    res.json({ ok: true, deleted });
  } catch (err) {
    console.error("[delete-files error]", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/data/clear", requireRole("admin"), async (req, res) => {
  try {
    const { type } = req.body; // "articles", "briefings", "logs", "all"
    const dataDir = path.join(__dirname, "..", "data");

    if (type === "articles" || type === "all") {
      const articlesDir = path.join(dataDir, "articles");
      if (fs.existsSync(articlesDir)) {
        const files = fs.readdirSync(articlesDir);
        for (const file of files) {
          fs.unlinkSync(path.join(articlesDir, file));
        }
      }
      console.log("[admin] 기사 데이터 삭제 완료");
    }

    if (type === "briefings" || type === "all") {
      const files = fs.readdirSync(dataDir).filter(f => f.startsWith("briefing-") && f.endsWith(".json"));
      for (const file of files) {
        fs.unlinkSync(path.join(dataDir, file));
      }
      console.log("[admin] 브리핑 캐시 삭제 완료");
    }

    if (type === "logs" || type === "all") {
      const logsDir = path.join(dataDir, "logs");
      if (fs.existsSync(logsDir)) {
        const files = fs.readdirSync(logsDir);
        for (const file of files) {
          fs.unlinkSync(path.join(logsDir, file));
        }
      }
      console.log("[admin] 수집 로그 삭제 완료");
    }

    res.json({ ok: true, message: `${type === "all" ? "전체" : type} 데이터 삭제 완료` });
  } catch (err) {
    console.error("[admin data clear error]", err);
    res.status(500).json({ error: err.message });
  }
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
