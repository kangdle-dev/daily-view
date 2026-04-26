import { useState, useEffect, useRef, useCallback } from "react";
import { Activity, RefreshCw, Clock } from "lucide-react";
import Nav from "./Nav.jsx";

const POLL_SEC = 300; // 5분 (서버 캐시 TTL과 동일)
const NEW_TTL  = 10 * 60 * 1000; // NEW 표시 10분 유지
const LS_KEY   = "rt-hidden-sources";

const C = {
  bg:      "#F1F5F9",
  surface: "#FFFFFF",
  border:  "#E2E8F0",
  txt1:    "#0F172A",
  txt2:    "#475569",
  txt3:    "#94A3B8",
  accent:  "#2563EB",
};

const CAT_DOT = {
  정치: "#3B82F6", 경제: "#22C55E", 사회: "#F97316", 문화: "#A855F7",
  스포츠: "#0EA5E9", 국제: "#64748B", 연예: "#FB7185", 산업: "#FB923C",
  북한: "#EF4444", 금융: "#8B5CF6", 증권: "#60A5FA", 부동산: "#D946EF",
  테크: "#818CF8", 바이오: "#F43F5E", 세계: "#38BDF8", 글로벌: "#0EA5E9",
};

const SOURCE_HDR = {
  khan: "#FFF7ED", chosun: "#EFF6FF", newstomato: "#F0FDF4",
  yonhap: "#F5F3FF", newspim: "#ECFDF5", donga: "#FEF9EE",
  hani: "#F0FDF4", hank: "#F0F9FF", newsis: "#FFF1F2",
};
const SOURCE_TXT = {
  khan: "#C2410C", chosun: "#1D4ED8", newstomato: "#15803D",
  yonhap: "#6D28D9", newspim: "#065F46", donga: "#92400E",
  hani: "#166534", hank: "#0369A1", newsis: "#9F1239",
};

function fmtTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("ko-KR", {
    hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Seoul",
  });
}

function stripBadge(title = "") {
  const m = title.match(/^\[([^\]]{1,6})\]/);
  return { badge: m?.[1] ?? null, clean: m ? title.slice(m[0].length).trim() : title };
}

// ── 기사 한 줄 ─────────────────────────────────────────────
function ArticleRow({ article, idx, isNew }) {
  const { badge, clean } = stripBadge(article.title);
  const dot = CAT_DOT[article.category];

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        padding: "4px 10px",
        borderBottom: `1px solid ${C.border}`,
        textDecoration: "none",
        // NEW 배경: 아주 옅은 회색
        background: isNew ? "#F4F6F8" : "transparent",
        transition: "background 1.5s",
        minHeight: 28,
      }}
    >
      {/* 순번 */}
      <span style={{ color: C.txt3, fontSize: 10, fontWeight: 700, minWidth: 14, flexShrink: 0, textAlign: "right" }}>
        {idx + 1}
      </span>

      {/* 카테고리 점 */}
      {dot && (
        <span style={{ width: 5, height: 5, borderRadius: "50%", background: dot, flexShrink: 0 }} />
      )}

      {/* NEW 뱃지 — 옅은 슬레이트 */}
      {isNew && (
        <span style={{
          background: "#CBD5E1", color: "#334155",
          fontSize: 9, fontWeight: 800, letterSpacing: 0.3,
          padding: "1px 4px", borderRadius: 3, flexShrink: 0, lineHeight: 1.4,
        }}>N</span>
      )}

      {/* 단독/속보 */}
      {badge === "단독" && (
        <span style={{ color: "#DC2626", fontSize: 10, fontWeight: 800, flexShrink: 0 }}>단독</span>
      )}
      {badge === "속보" && (
        <span style={{ color: "#EA580C", fontSize: 10, fontWeight: 800, flexShrink: 0 }}>속보</span>
      )}

      {/* 제목 — NEW여도 일반 텍스트 색 유지, 약간 볼드만 */}
      <span style={{
        flex: 1,
        fontSize: 12,
        color: C.txt1,
        fontWeight: isNew ? 600 : 400,
        overflow: "hidden",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
        lineHeight: 1.4,
      }}>{clean}</span>

      {/* 시각 */}
      <span style={{ color: C.txt3, fontSize: 10, flexShrink: 0, letterSpacing: -0.2 }}>
        {fmtTime(article.publishedAt)}
      </span>
    </a>
  );
}

// ── 언론사 카드 ────────────────────────────────────────────
function SourceCard({ src, newUrls, activeCat }) {
  const filtered = activeCat
    ? src.articles.filter(a => a.category === activeCat)
    : src.articles;
  const articles = filtered.slice(0, 15);
  const newCnt   = articles.filter(a => newUrls.has(a.url)).length;
  const hdrBg    = SOURCE_HDR[src.key] ?? "#F8FAFC";
  const hdrTxt   = SOURCE_TXT[src.key] ?? "#334155";

  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 10,
      overflow: "hidden",
    }}>
      <div style={{
        background: hdrBg,
        padding: "6px 10px",
        borderBottom: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ color: hdrTxt, fontWeight: 800, fontSize: 13 }}>{src.name}</span>
          {newCnt > 0 && (
            <span style={{
              background: "#94A3B8", color: "#fff",
              fontSize: 10, fontWeight: 700,
              padding: "1px 6px", borderRadius: 10,
            }}>+{newCnt}</span>
          )}
        </div>
        <span style={{ color: C.txt3, fontSize: 10 }}>
          {filtered.length}건 · {fmtTime(filtered[0]?.publishedAt)}
        </span>
      </div>

      {articles.map((a, i) => (
        <ArticleRow key={a.url || i} article={a} idx={i} isNew={newUrls.has(a.url)} />
      ))}
    </div>
  );
}

// ── 카테고리 탭 ────────────────────────────────────────────
function CategoryTabBar({ categories, activeCat, onSelect }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 4,
      overflowX: "auto",
      padding: "6px 10px",
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 9,
      marginBottom: 6,
      scrollbarWidth: "none",
    }}>
      {/* 전체 탭 */}
      <button
        onClick={() => onSelect(null)}
        style={{
          padding: "3px 12px",
          borderRadius: 20,
          border: `1px solid ${!activeCat ? C.accent : C.border}`,
          background: !activeCat ? "#EFF6FF" : C.bg,
          color: !activeCat ? C.accent : C.txt3,
          fontSize: 11, fontWeight: 700,
          cursor: "pointer", flexShrink: 0,
          transition: "all 0.15s",
        }}
      >전체</button>

      <div style={{ width: 1, height: 16, background: C.border, flexShrink: 0 }} />

      {categories.map(({ name, count }) => {
        const active = activeCat === name;
        const dot    = CAT_DOT[name] ?? "#94A3B8";
        return (
          <button
            key={name}
            onClick={() => onSelect(active ? null : name)}
            style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "3px 10px",
              borderRadius: 20,
              border: `1px solid ${active ? dot + "88" : C.border}`,
              background: active ? dot + "18" : C.bg,
              color: active ? dot : C.txt2,
              fontSize: 11, fontWeight: active ? 700 : 500,
              cursor: "pointer", flexShrink: 0,
              transition: "all 0.15s",
            }}
          >
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: dot, flexShrink: 0 }} />
            {name}
            <span style={{ color: active ? dot : C.txt3, fontSize: 10 }}>{count}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── 매체 필터 토글 칩 ──────────────────────────────────────
function SourceFilterBar({ sources, hidden, onToggle, onToggleAll }) {
  const allVisible = hidden.size === 0;
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 5,
      flexWrap: "wrap",
      padding: "8px 10px",
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 9,
      marginBottom: 12,
    }}>
      {/* 전체 버튼 */}
      <button
        onClick={onToggleAll}
        style={{
          padding: "3px 10px",
          borderRadius: 20,
          border: `1px solid ${allVisible ? C.accent : C.border}`,
          background: allVisible ? "#EFF6FF" : C.bg,
          color: allVisible ? C.accent : C.txt3,
          fontSize: 11, fontWeight: 700,
          cursor: "pointer", flexShrink: 0,
        }}
      >전체</button>

      <div style={{ width: 1, height: 16, background: C.border, flexShrink: 0 }} />

      {/* 매체별 칩 */}
      {sources.map(src => {
        const visible = !hidden.has(src.key);
        const txt = SOURCE_TXT[src.key] ?? "#334155";
        const hdr = SOURCE_HDR[src.key] ?? "#F8FAFC";
        return (
          <button
            key={src.key}
            onClick={() => onToggle(src.key)}
            style={{
              padding: "3px 10px",
              borderRadius: 20,
              border: `1px solid ${visible ? txt + "55" : C.border}`,
              background: visible ? hdr : C.bg,
              color: visible ? txt : C.txt3,
              fontSize: 11, fontWeight: visible ? 700 : 500,
              cursor: "pointer", flexShrink: 0,
              opacity: visible ? 1 : 0.55,
              transition: "all 0.15s",
            }}
          >{src.name}</button>
        );
      })}
    </div>
  );
}

// ── 메인 ───────────────────────────────────────────────────
export default function Realtime() {
  const [sources,   setSources]   = useState([]);
  const [date,      setDate]      = useState("");
  const [loading,   setLoading]   = useState(true);
  const [countdown, setCountdown] = useState(POLL_SEC);
  const [newUrls,   setNewUrls]   = useState(() => new Set());
  const [hidden,    setHidden]    = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(LS_KEY) || "[]")); }
    catch { return new Set(); }
  });
  const [activeCat, setActiveCat] = useState(null);

  const seenRef   = useRef(new Set());
  const timersRef = useRef({});

  const fetchData = useCallback(async (force = false) => {
    try {
      const res  = await fetch(
        force ? "/api/articles/realtime-rss/refresh" : "/api/articles/realtime-rss",
        force ? { method: "POST" } : undefined
      );
      const data = await res.json();
      const fresh = new Set();

      for (const src of data.sources || []) {
        for (const a of src.articles) {
          if (!a.url) continue;
          if (!seenRef.current.has(a.url)) {
            fresh.add(a.url);
            clearTimeout(timersRef.current[a.url]);
            timersRef.current[a.url] = setTimeout(() => {
              setNewUrls(prev => { const s = new Set(prev); s.delete(a.url); return s; });
            }, NEW_TTL);
          }
          seenRef.current.add(a.url);
        }
      }

      if (fresh.size > 0) setNewUrls(prev => new Set([...prev, ...fresh]));
      setSources(data.sources || []);
      setDate(data.date || "");
    } catch (e) {
      console.error("[realtime]", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const id = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { fetchData(); return POLL_SEC; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [fetchData]);

  const totalNew = newUrls.size;
  useEffect(() => {
    document.title = totalNew > 0 ? `(${totalNew}) 실시간` : "실시간";
    return () => { document.title = "DailyView"; };
  }, [totalNew]);

  function toggleSource(key) {
    setHidden(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      localStorage.setItem(LS_KEY, JSON.stringify([...next]));
      return next;
    });
  }

  function toggleAll() {
    const next = hidden.size === 0
      ? new Set(sources.map(s => s.key))  // 모두 숨기기
      : new Set();                          // 모두 보이기
    setHidden(next);
    localStorage.setItem(LS_KEY, JSON.stringify([...next]));
  }

  // 매체 필터 적용
  const visibleSources = sources.filter(s => !hidden.has(s.key));

  // 카테고리 집계 (매체 필터 적용 후)
  const catCountMap = {};
  for (const src of visibleSources) {
    for (const a of src.articles) {
      if (a.category) catCountMap[a.category] = (catCountMap[a.category] || 0) + 1;
    }
  }
  const categories = Object.entries(catCountMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));

  // 카테고리 필터 적용 → 해당 카테고리 기사 없는 매체는 제외
  const visible = activeCat
    ? visibleSources.filter(s => s.articles.some(a => a.category === activeCat))
    : visibleSources;

  const totalArticles = visible.reduce((n, s) => {
    const filtered = activeCat ? s.articles.filter(a => a.category === activeCat) : s.articles;
    return n + filtered.length;
  }, 0);

  return (
    <div style={{ fontFamily: "'Apple SD Gothic Neo','Pretendard',system-ui,sans-serif", background: C.bg, minHeight: "100vh" }}>
      <Nav current="/realtime" />

      <div style={{ maxWidth: 1600, margin: "0 auto", padding: "16px 16px 40px" }}>

        {/* 헤더 */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 10, flexWrap: "wrap", gap: 8,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Activity size={16} color={C.accent} strokeWidth={2.2} />
            <span style={{ color: C.txt1, fontSize: 15, fontWeight: 800 }}>실시간 기사 수집 현황</span>
            {date && <span style={{ color: C.txt3, fontSize: 12 }}>{date}</span>}
            {!loading && (
              <span style={{ color: C.txt2, fontSize: 12 }}>
                {visible.length}개 매체 · {totalArticles}건
              </span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {totalNew > 0 && (
              <span style={{
                background: "#F1F5F9", color: "#475569",
                border: `1px solid ${C.border}`,
                fontSize: 12, fontWeight: 700,
                padding: "3px 10px", borderRadius: 20,
              }}>NEW {totalNew}건</span>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 4, color: C.txt3, fontSize: 12 }}>
              <Clock size={12} strokeWidth={1.8} />
              <span>{Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, "0")}</span>
            </div>
            <button
              onClick={() => { fetchData(true); setCountdown(POLL_SEC); }}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: 7, padding: "5px 10px",
                color: C.txt2, fontSize: 12, cursor: "pointer", fontWeight: 500,
              }}
            >
              <RefreshCw size={12} strokeWidth={2} />
              새로고침
            </button>
          </div>
        </div>

        {/* 카테고리 탭 */}
        {!loading && categories.length > 0 && (
          <CategoryTabBar
            categories={categories}
            activeCat={activeCat}
            onSelect={setActiveCat}
          />
        )}

        {/* 매체 필터 */}
        {!loading && sources.length > 0 && (
          <SourceFilterBar
            sources={sources}
            hidden={hidden}
            onToggle={toggleSource}
            onToggleAll={toggleAll}
          />
        )}

        {/* 그리드 */}
        {loading ? (
          <div style={{ color: C.txt3, textAlign: "center", padding: 80, fontSize: 13 }}>불러오는 중...</div>
        ) : visible.length === 0 ? (
          <div style={{ color: C.txt3, textAlign: "center", padding: 80, fontSize: 13 }}>표시할 매체를 선택하세요.</div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
            gap: 10,
            alignItems: "start",
          }}>
            {visible.map(src => (
              <SourceCard key={src.key} src={src} newUrls={newUrls} activeCat={activeCat} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
