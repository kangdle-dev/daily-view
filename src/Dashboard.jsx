import { useState, useEffect, useCallback } from "react";

function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth < 640);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 640);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return mobile;
}

// ── 컬러 팔레트 ───────────────────────────────────────────
const C = {
  bg:       "#F1F5F9",
  surface:  "#FFFFFF",
  border:   "#E2E8F0",
  txt1:     "#0F172A",
  txt2:     "#475569",
  txt3:     "#94A3B8",
  accent:   "#2563EB",
  breaking: "#DC2626",
  nav:      "#1E293B",
};

const CAT_COLORS = {
  정치:   { bg: "#EFF6FF", text: "#1D4ED8", dot: "#3B82F6" },
  경제:   { bg: "#F0FDF4", text: "#15803D", dot: "#22C55E" },
  사회:   { bg: "#FFF7ED", text: "#C2410C", dot: "#F97316" },
  문화:   { bg: "#FDF4FF", text: "#7E22CE", dot: "#A855F7" },
  스포츠: { bg: "#F0F9FF", text: "#0369A1", dot: "#0EA5E9" },
  국제:   { bg: "#F8FAFC", text: "#334155", dot: "#64748B" },
  연예:   { bg: "#FFF1F2", text: "#BE123C", dot: "#FB7185" },
  정책:   { bg: "#FFFBEB", text: "#B45309", dot: "#F59E0B" },
  공동체: { bg: "#F0FDF4", text: "#166534", dot: "#4ADE80" },
  증권:   { bg: "#EFF6FF", text: "#1E40AF", dot: "#60A5FA" },
  금융:   { bg: "#F5F3FF", text: "#6D28D9", dot: "#8B5CF6" },
  산업:   { bg: "#FFF7ED", text: "#9A3412", dot: "#FB923C" },
  부동산: { bg: "#FDF4FF", text: "#86198F", dot: "#D946EF" },
  유통:   { bg: "#F0FDFA", text: "#0F766E", dot: "#2DD4BF" },
  테크:   { bg: "#EFF6FF", text: "#1D4ED8", dot: "#818CF8" },
  바이오: { bg: "#FFF1F2", text: "#9F1239", dot: "#F43F5E" },
  엔터:   { bg: "#FFF1F2", text: "#BE123C", dot: "#FB7185" },
  정책금융: { bg: "#F5F3FF", text: "#5B21B6", dot: "#7C3AED" },
  북한:   { bg: "#FEF2F2", text: "#991B1B", dot: "#EF4444" },
  마켓:   { bg: "#FFFBEB", text: "#92400E", dot: "#F59E0B" },
  전국:   { bg: "#F0FDF4", text: "#14532D", dot: "#86EFAC" },
  세계:       { bg: "#F0F9FF", text: "#0C4A6E", dot: "#38BDF8" },
  글로벌:     { bg: "#F0F9FF", text: "#075985", dot: "#0EA5E9" },
  중국:       { bg: "#FEF2F2", text: "#991B1B", dot: "#F87171" },
  "증권·금융": { bg: "#EFF6FF", text: "#1E40AF", dot: "#60A5FA" },
  "라이프·여행": { bg: "#F0FDF4", text: "#166534", dot: "#4ADE80" },
  "문화·연예":  { bg: "#FDF4FF", text: "#7E22CE", dot: "#C084FC" },
};

// 언론사별 색상
const SOURCE_COLORS = {
  khan:       { bg: "#FFF7ED", text: "#C2410C", border: "#FED7AA" },
  chosun:     { bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE" },
  newstomato: { bg: "#F0FDF4", text: "#15803D", border: "#BBF7D0" },
  yonhap:     { bg: "#F5F3FF", text: "#6D28D9", border: "#DDD6FE" },
  newspim:    { bg: "#ECFDF5", text: "#065F46", border: "#A7F3D0" },
};

const CATEGORIES = ["전체", "정치", "경제", "사회", "문화", "스포츠", "국제", "연예", "정책", "공동체", "증권", "금융", "산업", "부동산", "유통", "테크", "바이오", "엔터", "정책금융", "북한", "마켓", "전국", "세계", "글로벌", "중국", "증권·금융", "라이프·여행", "문화·연예"];

function todayStr() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
}
function relTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}
function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString("ko-KR", { timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit" });
}

// ── 카테고리 뱃지 ─────────────────────────────────────────
function CatBadge({ category }) {
  const c = CAT_COLORS[category] || { bg: "#F8FAFC", text: "#334155", dot: "#64748B" };
  return (
    <span style={{ background: c.bg, color: c.text, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6, display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: c.dot, flexShrink: 0 }} />
      {category}
    </span>
  );
}

// ── 언론사 뱃지 ───────────────────────────────────────────
function SourceBadge({ source, sourceName }) {
  const c = SOURCE_COLORS[source] || { bg: "#F8FAFC", text: "#475569", border: "#E2E8F0" };
  return (
    <span style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}`, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6, whiteSpace: "nowrap" }}>
      {sourceName}
    </span>
  );
}

// ── 통계 카드 ─────────────────────────────────────────────
function StatCard({ icon, label, value, sub, accent, onClick, active }) {
  return (
    <div onClick={onClick}
      style={{
        background: active ? "#EFF6FF" : C.surface,
        border: active ? `1.5px solid ${C.accent}` : `1px solid ${C.border}`,
        borderRadius: 12, padding: "16px 18px", flex: 1, minWidth: 0,
        boxShadow: "0 1px 3px rgba(0,0,0,.04)",
        cursor: onClick ? "pointer" : "default",
        transition: "all .15s",
      }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        {sub && <span style={{ fontSize: 10, fontWeight: 700, color: active ? C.accent : C.txt3, background: active ? "#DBEAFE" : C.bg, padding: "2px 7px", borderRadius: 20 }}>{sub}</span>}
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: accent || C.txt1, letterSpacing: -1, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: active ? C.accent : C.txt2, marginTop: 5, fontWeight: active ? 700 : 500 }}>{label}</div>
    </div>
  );
}

// ── 기사 카드 ─────────────────────────────────────────────
function ArticleCard({ article, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <div onClick={() => onClick(article)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: C.surface,
        border: article.isBreaking ? `1px solid ${C.breaking}` : `1px solid ${C.border}`,
        borderLeft: article.isBreaking ? `4px solid ${C.breaking}` : `4px solid transparent`,
        borderRadius: 10, padding: "14px 16px", cursor: "pointer",
        boxShadow: hover ? "0 4px 16px rgba(0,0,0,.08)" : "0 1px 3px rgba(0,0,0,.04)",
        transform: hover ? "translateY(-1px)" : "none",
        transition: "box-shadow .2s, transform .15s",
      }}>
      <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
        {article.isBreaking && (
          <span style={{ background: C.breaking, color: "#fff", fontSize: 10, fontWeight: 800, padding: "2px 7px", borderRadius: 4, whiteSpace: "nowrap" }}>단독·속보</span>
        )}
        <SourceBadge source={article.source} sourceName={article.sourceName} />
        <CatBadge category={article.category} />
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 11, color: C.txt2, fontWeight: 500 }}>{fmtTime(article.publishedAt)}</span>
          <span style={{ fontSize: 11, color: C.txt3 }}>·</span>
          <span style={{ fontSize: 11, color: C.txt3 }}>{relTime(article.publishedAt)}</span>
        </div>
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.55, color: C.txt1, marginBottom: article.summary ? 6 : 0 }}>
        {article.title}
      </div>
      {article.summary && (
        <div style={{ fontSize: 12, color: C.txt2, lineHeight: 1.65, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
          {article.summary}
        </div>
      )}
    </div>
  );
}

// ── 기사 상세 모달 ────────────────────────────────────────
function ArticleModal({ article, onClose }) {
  useEffect(() => {
    document.body.style.overflow = article ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [article]);

  if (!article) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.5)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center", backdropFilter: "blur(3px)" }}>
      <div onClick={e => e.stopPropagation()}
        style={{ background: C.surface, borderRadius: "18px 18px 0 0", width: "100%", maxWidth: 680, maxHeight: "88vh", display: "flex", flexDirection: "column", boxShadow: "0 -8px 40px rgba(0,0,0,.15)" }}>
        <div style={{ padding: "14px 0 4px", display: "flex", justifyContent: "center" }}>
          <div style={{ width: 40, height: 4, background: C.border, borderRadius: 2 }} />
        </div>
        <div style={{ padding: "10px 20px 16px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 10, alignItems: "center", flexWrap: "wrap" }}>
            {article.isBreaking && <span style={{ background: C.breaking, color: "#fff", fontSize: 11, fontWeight: 800, padding: "3px 8px", borderRadius: 5 }}>단독·속보</span>}
            <SourceBadge source={article.source} sourceName={article.sourceName} />
            <CatBadge category={article.category} />
            <span style={{ fontSize: 12, color: C.txt2, marginLeft: "auto", fontWeight: 500 }}>
              {new Date(article.publishedAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: C.txt1, lineHeight: 1.5 }}>{article.title}</h2>
          {article.summary && <p style={{ margin: "8px 0 0", fontSize: 13, color: C.txt2, lineHeight: 1.6 }}>{article.summary}</p>}
        </div>
        <div style={{ padding: "18px 20px", overflowY: "auto", flex: 1 }}>
          {article.content
            ? <p style={{ margin: 0, fontSize: 14, lineHeight: 1.9, color: C.txt1 }}>{article.content}</p>
            : <div style={{ textAlign: "center", padding: "32px 0", color: C.txt3 }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>📄</div>
                <div style={{ fontSize: 13 }}>본문이 수집되지 않았습니다</div>
              </div>
          }
        </div>
        <div style={{ padding: "12px 20px 28px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, background: C.bg, color: C.txt2, border: `1px solid ${C.border}`, padding: "13px", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>닫기</button>
          <a href={article.url} target="_blank" rel="noreferrer"
            style={{ flex: 2, display: "block", textAlign: "center", background: C.accent, color: "#fff", padding: "13px", borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
            원문 보기 →
          </a>
        </div>
      </div>
    </div>
  );
}

// ── 수집 진행 패널 ────────────────────────────────────────
function CollectProgress({ logs, rawLogs, onClose }) {
  const [showDetail, setShowDetail] = useState(false);
  const logEndRef = useCallback(el => { if (el) el.scrollIntoView({ behavior: "smooth" }); }, [rawLogs.length]);
  const isRunning = logs.some(l => l.status === "running");

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
      background: "#1E293B", borderTop: "2px solid #334155",
      boxShadow: "0 -8px 32px rgba(0,0,0,.3)",
      maxHeight: showDetail ? 420 : 220, display: "flex", flexDirection: "column",
      transition: "max-height .3s",
    }}>
      {/* 헤더 */}
      <div style={{ padding: "10px 16px 8px", borderBottom: "1px solid #334155", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        {isRunning
          ? <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#22C55E", animation: "pulse 1s infinite" }} />
          : <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#64748B" }} />
        }
        <span style={{ color: "#F1F5F9", fontWeight: 700, fontSize: 13 }}>
          {isRunning ? "수집 중..." : "수집 완료"}
        </span>
        <div style={{ flex: 1 }} />
        <button onClick={() => setShowDetail(v => !v)}
          style={{ background: "#334155", border: "none", color: "#94A3B8", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 6, cursor: "pointer" }}>
          {showDetail ? "간략히 ▲" : "상세 로그 ▼"}
        </button>
        {!isRunning && (
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#64748B", fontSize: 20, cursor: "pointer", lineHeight: 1, padding: "0 2px", marginLeft: 4 }}>×</button>
        )}
      </div>

      {/* 언론사별 상태 */}
      <div style={{ padding: "10px 16px 10px", display: "flex", gap: 12, flexWrap: "wrap", flexShrink: 0, borderBottom: showDetail ? "1px solid #334155" : "none" }}>
        {logs.map((log, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 13 }}>
              {log.status === "running" ? "⏳" : log.status === "done" ? "✅" : log.status === "error" ? "❌" : "⚪"}
            </span>
            <span style={{ color: log.status === "done" ? "#86EFAC" : log.status === "error" ? "#FCA5A5" : log.status === "running" ? "#FCD34D" : "#64748B", fontSize: 13, fontWeight: 600 }}>
              {log.name}
            </span>
            {log.status === "done" && <span style={{ color: "#4ADE80", fontSize: 11 }}>{log.count}건</span>}
            {log.status === "error" && <span style={{ color: "#F87171", fontSize: 11 }}>실패</span>}
          </div>
        ))}
      </div>

      {/* 상세 로그 터미널 */}
      {showDetail && (
        <div style={{ overflowY: "auto", flex: 1, padding: "8px 14px 12px", fontFamily: "monospace" }}>
          {rawLogs.map((l, i) => (
            <div key={i} ref={i === rawLogs.length - 1 ? logEndRef : null}
              style={{
                fontSize: 11, lineHeight: 1.7,
                color: l.level === "error" ? "#FCA5A5" : l.level === "warn" ? "#FCD34D" : "#94A3B8",
              }}>
              <span style={{ color: "#475569", marginRight: 8 }}>
                {new Date(l.time).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
              {l.level !== "info" && (
                <span style={{ color: l.level === "error" ? "#F87171" : "#FBBF24", fontWeight: 700, marginRight: 6 }}>
                  [{l.level.toUpperCase()}]
                </span>
              )}
              {l.message}
            </div>
          ))}
          {isRunning && <div style={{ color: "#475569", fontSize: 11, marginTop: 4 }}>▍</div>}
        </div>
      )}
    </div>
  );
}

// ── 메인 대시보드 ─────────────────────────────────────────
export default function Dashboard() {
  const [date, setDate] = useState(todayStr());
  const [articles, setArticles] = useState([]);
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [collecting, setCollecting] = useState(null);
  const [collectLogs, setCollectLogs] = useState([]);
  const [collectRawLogs, setCollectRawLogs] = useState([]);
  const [showProgress, setShowProgress] = useState(false);
  const [sourceFilter, setSourceFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("전체");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const isMobile = useIsMobile();

  // 등록된 소스 목록 조회
  useEffect(() => {
    fetch("/api/sources").then(r => r.json()).then(setSources).catch(() => {});
  }, []);

  const fetchArticles = async (d = date) => {
    setLoading(true);
    try {
      // 항상 전체 기사를 가져오고 프론트에서 필터링 (언론사 탭 카운트 유지)
      const res = await fetch(`/api/articles?date=${d}`);
      const data = await res.json();
      const sorted = (data.articles || []).sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
      setArticles(sorted);
    } catch { setArticles([]); }
    setLoading(false);
  };

  useEffect(() => { fetchArticles(); }, [date]);

  const triggerCollect = (source = "all") => {
    if (collecting) return;
    setCollecting(source);
    setCollectLogs([]);
    setCollectRawLogs([]);
    setShowProgress(true);

    const es = new EventSource(`/api/collect/stream?source=${source}`);

    es.onmessage = (e) => {
      const data = JSON.parse(e.data);

      if (data.type === "init") {
        setCollectLogs(data.sources.map(s => ({ key: s.key, name: s.name, status: "pending" })));
      } else if (data.type === "start") {
        setCollectLogs(prev => prev.map(l => l.key === data.source ? { ...l, status: "running" } : l));
      } else if (data.type === "done") {
        setCollectLogs(prev => prev.map(l => l.key === data.source ? { ...l, status: "done", count: data.count } : l));
      } else if (data.type === "error") {
        setCollectLogs(prev => prev.map(l => l.key === data.source ? { ...l, status: "error" } : l));
      } else if (data.type === "log") {
        setCollectRawLogs(prev => [...prev, { time: new Date().toISOString(), level: data.level, message: data.message }]);
      } else if (data.type === "complete") {
        es.close();
        setCollecting(null);
        fetchArticles();
      }
    };

    es.onerror = () => {
      es.close();
      setCollecting(null);
      setCollectLogs(prev => prev.map(l => l.status === "running" ? { ...l, status: "error" } : l));
    };
  };

  // 파생 데이터 — 전체 기사 기준 집계 (언론사 필터 영향 없음)
  const allArticles = articles; // 전체 (source 필터 전 데이터가 아니라 fetch 결과 그대로)
  const breaking = allArticles.filter(a => a.isBreaking);

  // 언론사별 카운트는 항상 전체 기사 기준
  const sourceCounts = {};
  for (const a of allArticles) sourceCounts[a.source] = (sourceCounts[a.source] || 0) + 1;

  // 카테고리 카운트는 현재 언론사 필터 적용된 기사 기준
  const sourceFiltered = sourceFilter === "all" ? allArticles : allArticles.filter(a => a.source === sourceFilter);
  const catCounts = {};
  for (const a of sourceFiltered) catCounts[a.category] = (catCounts[a.category] || 0) + 1;

  const usedCats = CATEGORIES.filter(c => c === "전체" || catCounts[c]);

  const filtered = sourceFiltered.filter(a => {
    if (catFilter !== "전체" && a.category !== catFilter) return false;
    if (search && !a.title.includes(search) && !(a.summary || "").includes(search)) return false;
    return true;
  });

  return (
    <div style={{ fontFamily: "'Apple SD Gothic Neo','Pretendard',system-ui,sans-serif", background: C.bg, minHeight: "100vh" }}>

      {/* 내비 */}
      <nav style={{ background: C.nav, height: 52, display: "flex", alignItems: "center", padding: "0 14px", position: "sticky", top: 0, zIndex: 30, gap: 8 }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 7, textDecoration: "none", flexShrink: 0 }}>
          <div style={{ width: 24, height: 24, background: "#FFD600", borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontWeight: 900, fontSize: 12, color: "#111" }}>D</span>
          </div>
          {!isMobile && <span style={{ color: "#F8FAFC", fontWeight: 800, fontSize: 14 }}>Daily View</span>}
        </a>
        <span style={{ color: "#475569", fontSize: 12 }}>/</span>
        <span style={{ color: "#94A3B8", fontSize: 12, fontWeight: 600 }}>수집 대시보드</span>
        <div style={{ flex: 1 }} />
        {/* 모바일: 전체수집만, 데스크탑: 개별+전체 */}
        {!isMobile && sources.map(s => (
          <button key={s.key} onClick={() => triggerCollect(s.key)} disabled={!!collecting}
            style={{ background: collecting === s.key ? "#334155" : "#293548", color: collecting === s.key ? "#94A3B8" : "#CBD5E1", border: "1px solid #334155", padding: "6px 10px", borderRadius: 6, fontWeight: 600, fontSize: 11, cursor: collecting ? "not-allowed" : "pointer" }}>
            {collecting === s.key ? "⏳" : "⚡"} {s.name}
          </button>
        ))}
        <button onClick={() => triggerCollect("all")} disabled={!!collecting}
          style={{ background: collecting === "all" ? "#334155" : C.accent, color: "#fff", border: "none", padding: "7px 12px", borderRadius: 7, fontWeight: 700, fontSize: 12, cursor: collecting ? "not-allowed" : "pointer", flexShrink: 0, minHeight: 36 }}>
          {collecting === "all" ? "⏳" : "⚡"} {isMobile ? "수집" : "전체 수집"}
        </button>
      </nav>

      <div style={{ maxWidth: 820, margin: "0 auto", padding: isMobile ? "14px 12px 72px" : "24px 16px 80px" }}>

        {/* 페이지 헤더 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: isMobile ? 17 : 20, fontWeight: 800, color: C.txt1, letterSpacing: -.5 }}>뉴스 수집 현황</h1>
            <p style={{ margin: "3px 0 0", fontSize: 12, color: C.txt2 }}>RSS 수집 · 24시간 이내 기사</p>
          </div>
          <input type="date" value={date} max={todayStr()}
            onChange={e => { setDate(e.target.value); setCatFilter("전체"); setSearch(""); }}
            style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 11px", fontSize: 13, fontWeight: 600, fontFamily: "inherit", outline: "none", background: C.surface, color: C.txt1, minHeight: 40 }} />
        </div>

        {/* 언론사 필터 탭 — 가로 스크롤 */}
        <div style={{ display: "flex", gap: isMobile ? 6 : 8, marginBottom: 14, overflowX: "auto", paddingBottom: 2 }}>
          {[{ key: "all", name: "전체" }, ...sources].map(s => {
            const active = sourceFilter === s.key;
            const cnt = s.key === "all" ? allArticles.length : (sourceCounts[s.key] || 0);
            return (
              <button key={s.key} onClick={() => { setSourceFilter(s.key); setCatFilter("전체"); }}
                style={{
                  flexShrink: 0,
                  border: active ? `1.5px solid ${C.accent}` : `1px solid ${C.border}`,
                  background: active ? "#EFF6FF" : C.surface,
                  color: active ? C.accent : C.txt2,
                  padding: isMobile ? "7px 11px" : "8px 14px",
                  borderRadius: 9, fontSize: isMobile ? 12 : 13, fontWeight: active ? 700 : 500,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                  minHeight: 36, transition: "all .15s",
                }}>
                {s.name}
                <span style={{ background: active ? C.accent : C.bg, color: active ? "#fff" : C.txt2, fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 10 }}>
                  {cnt}
                </span>
              </button>
            );
          })}
        </div>

        {/* 통계 카드 */}
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          <StatCard icon="📰" label="수집된 기사" value={sourceFiltered.length} sub={sourceFilter === "all" ? "전체" : sources.find(s => s.key === sourceFilter)?.name} accent={C.txt1} />
          <StatCard icon="🚨" label="단독·속보" value={breaking.length} accent={breaking.length > 0 ? C.breaking : C.txt3} />
          <StatCard icon="📂" label="카테고리" value={Object.keys(catCounts).length} sub="개 분야" accent={C.accent} />
        </div>

        {/* 단독·속보 목록 */}
        {breaking.length > 0 && (
          <div style={{ background: "#FEF2F2", border: `1px solid #FECACA`, borderRadius: 12, marginBottom: 20, overflow: "hidden" }}>
            <div style={{ padding: "11px 16px", borderBottom: "1px solid #FECACA", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.breaking, display: "inline-block" }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: C.breaking }}>단독 · 속보</span>
              <span style={{ fontSize: 12, color: "#F87171" }}>{breaking.length}건</span>
            </div>
            {breaking.map((a, i) => (
              <div key={i} onClick={() => setSelected(a)}
                style={{ padding: "9px 14px", borderBottom: i < breaking.length - 1 ? "1px solid #FEE2E2" : "none", cursor: "pointer", display: "flex", gap: 6, alignItems: "flex-start", flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: 5, alignItems: "center", flexWrap: "wrap", flex: 1, minWidth: 0 }}>
                  <SourceBadge source={a.source} sourceName={a.sourceName} />
                  <CatBadge category={a.category} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.txt1, lineHeight: 1.5, width: "100%" }}>{a.title}</span>
                </div>
                <span style={{ fontSize: 11, color: C.txt2, flexShrink: 0 }}>{fmtTime(a.publishedAt)}</span>
              </div>
            ))}
          </div>
        )}

        {/* 검색 */}
        <div style={{ position: "relative", marginBottom: 12 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: C.txt3, pointerEvents: "none" }}>🔍</span>
          <input placeholder="제목·요약으로 검색" value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px 10px 38px", fontSize: 14, fontFamily: "inherit", outline: "none", background: C.surface, color: C.txt1 }} />
        </div>

        {/* 카테고리 탭 */}
        <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto", paddingBottom: 2 }}>
          {usedCats.map(cat => {
            const cnt = cat === "전체" ? articles.length : (catCounts[cat] || 0);
            const active = catFilter === cat;
            return (
              <button key={cat} onClick={() => setCatFilter(cat)}
                style={{
                  flexShrink: 0,
                  border: active ? `1.5px solid ${C.accent}` : `1px solid ${C.border}`,
                  background: active ? "#EFF6FF" : C.surface,
                  color: active ? C.accent : C.txt2,
                  padding: "7px 13px", borderRadius: 8, fontSize: 13, fontWeight: active ? 700 : 500,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 5, transition: "all .15s",
                }}>
                {cat}
                <span style={{ background: active ? C.accent : C.bg, color: active ? "#fff" : C.txt2, fontSize: 11, fontWeight: 700, padding: "1px 6px", borderRadius: 10, minWidth: 18, textAlign: "center" }}>
                  {cnt}
                </span>
              </button>
            );
          })}
        </div>

        {/* 기사 목록 */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ width: 36, height: 36, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.accent}`, borderRadius: "50%", margin: "0 auto 14px", animation: "spin 1s linear infinite" }} />
            <div style={{ fontSize: 14, color: C.txt2, fontWeight: 500 }}>기사를 불러오는 중...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", background: C.surface, borderRadius: 12, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.txt1, marginBottom: 6 }}>수집된 기사가 없습니다</div>
            <div style={{ fontSize: 13, color: C.txt2, marginBottom: 20 }}>수집 버튼을 눌러 기사를 가져오세요</div>
            <button onClick={() => triggerCollect("all")} disabled={!!collecting}
              style={{ background: C.accent, color: "#fff", border: "none", padding: "11px 24px", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              전체 수집하기
            </button>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 12, color: C.txt2, marginBottom: 10, fontWeight: 500 }}>
              {filtered.length}개 기사
              {search && <span style={{ color: C.accent }}> · "{search}" 검색결과</span>}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {filtered.map((a, i) => <ArticleCard key={i} article={a} onClick={setSelected} />)}
            </div>
          </>
        )}
      </div>

      <ArticleModal article={selected} onClose={() => setSelected(null)} />

      {showProgress && collectLogs.length > 0 && (
        <CollectProgress
          logs={collectLogs}
          rawLogs={collectRawLogs}
          onClose={() => setShowProgress(false)}
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .4; } }
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 4px; }
        input[type="date"]::-webkit-calendar-picker-indicator { opacity: .5; }
      `}</style>
    </div>
  );
}
