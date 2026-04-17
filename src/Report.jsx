import { useState, useEffect } from "react";

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
  gold:     "#D97706",
};

const CAT_COLORS = {
  정치:       { bg: "#EFF6FF", text: "#1D4ED8", dot: "#3B82F6" },
  경제:       { bg: "#F0FDF4", text: "#15803D", dot: "#22C55E" },
  사회:       { bg: "#FFF7ED", text: "#C2410C", dot: "#F97316" },
  문화:       { bg: "#FDF4FF", text: "#7E22CE", dot: "#A855F7" },
  스포츠:     { bg: "#F0F9FF", text: "#0369A1", dot: "#0EA5E9" },
  국제:       { bg: "#F8FAFC", text: "#334155", dot: "#64748B" },
  연예:       { bg: "#FFF1F2", text: "#BE123C", dot: "#FB7185" },
  북한:       { bg: "#FEF2F2", text: "#991B1B", dot: "#EF4444" },
  마켓:       { bg: "#FFFBEB", text: "#92400E", dot: "#F59E0B" },
  전국:       { bg: "#F0FDF4", text: "#14532D", dot: "#86EFAC" },
  세계:       { bg: "#F0F9FF", text: "#0C4A6E", dot: "#38BDF8" },
  산업:       { bg: "#FFF7ED", text: "#9A3412", dot: "#FB923C" },
  글로벌:     { bg: "#F0F9FF", text: "#075985", dot: "#0EA5E9" },
  중국:       { bg: "#FEF2F2", text: "#991B1B", dot: "#F87171" },
  "증권·금융":{ bg: "#EFF6FF", text: "#1E40AF", dot: "#60A5FA" },
};

const CAT_ORDER = [
  "정치","경제","사회","국제","세계","산업","마켓",
  "문화","스포츠","연예","전국","북한","글로벌","중국","증권·금융",
];

function todayStr() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
}
function fmtDateFull(iso) {
  return new Date(iso).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}
function relTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

// ── 반응형 훅 ─────────────────────────────────────────────
function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth < 640);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 640);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return mobile;
}

function CatBadge({ category }) {
  const c = CAT_COLORS[category] || { bg: "#F8FAFC", text: "#334155", dot: "#64748B" };
  return (
    <span style={{
      background: c.bg, color: c.text, fontSize: 11, fontWeight: 700,
      padding: "2px 8px", borderRadius: 6,
      display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: c.dot, flexShrink: 0 }} />
      {category}
    </span>
  );
}

function SourceList({ sources }) {
  if (!sources?.length) return null;
  return (
    <span style={{ fontSize: 11, color: C.txt2, fontWeight: 500, lineHeight: 1.4 }}>
      {sources.join(" · ")}
    </span>
  );
}

// ── 종합 TOP 카드 ─────────────────────────────────────────
function TopArticleCard({ article, rank, isMobile }) {
  const rankColors = ["#D97706", "#64748B", "#B45309"];
  const isTop3 = rank <= 3;
  const leftColor = article.isBreaking
    ? C.breaking
    : isTop3 ? rankColors[rank - 1]
    : C.border;

  return (
    <a href={article.url} target="_blank" rel="noreferrer"
      style={{ textDecoration: "none", display: "block" }}>
      <div style={{
        background: C.surface,
        border: `1px solid ${article.isBreaking ? C.breaking : C.border}`,
        borderLeft: `4px solid ${leftColor}`,
        borderRadius: 10,
        padding: isMobile ? "13px 14px" : "16px 18px",
        transition: "box-shadow .2s",
      }}
        onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,.09)"}
        onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
      >
        <div style={{ display: "flex", gap: isMobile ? 10 : 14, alignItems: "flex-start" }}>

          {/* 순위 번호 */}
          <div style={{
            flexShrink: 0,
            width: isMobile ? 28 : 32, height: isMobile ? 28 : 32,
            borderRadius: 7, background: isTop3 ? rankColors[rank - 1] : C.bg,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 900, fontSize: isMobile ? 13 : 15,
            color: isTop3 ? "#fff" : C.txt3,
          }}>
            {rank}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            {/* 배지 행 */}
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center", marginBottom: 6 }}>
              {article.isBreaking && (
                <span style={{ background: C.breaking, color: "#fff", fontSize: 10, fontWeight: 800, padding: "2px 6px", borderRadius: 4 }}>단독·속보</span>
              )}
              <CatBadge category={article.category} />
              {article.groupSize > 1 && (
                <span style={{ background: "#F0FDF4", color: "#15803D", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>
                  {article.groupSize}개사 보도
                </span>
              )}
              <span style={{ marginLeft: "auto", fontSize: 11, color: C.txt3, flexShrink: 0 }}>{relTime(article.publishedAt)}</span>
            </div>

            {/* 제목 */}
            <div style={{
              fontSize: isMobile ? 14 : 15,
              fontWeight: 800, color: C.txt1, lineHeight: 1.55, marginBottom: 6,
            }}>
              {article.title}
            </div>

            {/* 요약 — 모바일은 1줄, 데스크탑은 2줄 */}
            {article.summary && (
              <div style={{
                fontSize: 12, color: C.txt2, lineHeight: 1.65, marginBottom: 8,
                overflow: "hidden", display: "-webkit-box",
                WebkitLineClamp: isMobile ? 1 : 2, WebkitBoxOrient: "vertical",
              }}>
                {article.summary}
              </div>
            )}

            {/* 출처 + 링크 */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <SourceList sources={article.sources} />
              <span style={{ fontSize: 11, color: C.accent, fontWeight: 700, flexShrink: 0 }}>원문 →</span>
            </div>
          </div>
        </div>
      </div>
    </a>
  );
}

// ── 카테고리 기사 행 ──────────────────────────────────────
function CatArticleRow({ article, rank, isMobile }) {
  return (
    <a href={article.url} target="_blank" rel="noreferrer"
      style={{ textDecoration: "none", display: "block" }}>
      <div style={{
        padding: isMobile ? "11px 14px" : "12px 18px",
        borderBottom: `1px solid ${C.border}`,
        display: "flex", gap: 10, alignItems: "flex-start",
        transition: "background .15s",
      }}
        onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
      >
        <span style={{
          flexShrink: 0, width: 20, fontSize: 12, fontWeight: 700,
          color: rank <= 3 ? C.gold : C.txt3, paddingTop: 2, textAlign: "right",
        }}>
          {rank}
        </span>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* 뱃지 */}
          <div style={{ display: "flex", gap: 4, marginBottom: 4, flexWrap: "wrap", alignItems: "center" }}>
            {article.isBreaking && (
              <span style={{ background: C.breaking, color: "#fff", fontSize: 9, fontWeight: 800, padding: "1px 5px", borderRadius: 3 }}>속보</span>
            )}
            {article.groupSize > 1 && (
              <span style={{ background: "#DBEAFE", color: "#1E40AF", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 4 }}>
                {article.groupSize}개사
              </span>
            )}
          </div>

          {/* 제목 */}
          <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 700, color: C.txt1, lineHeight: 1.5, marginBottom: 4 }}>
            {article.title}
          </div>

          {/* 출처 + 시간 */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
            <SourceList sources={article.sources} />
            <span style={{ fontSize: 11, color: C.txt3, flexShrink: 0 }}>{relTime(article.publishedAt)}</span>
          </div>
        </div>
      </div>
    </a>
  );
}

// ── 카테고리 섹션 ─────────────────────────────────────────
function CategorySection({ category, articles, defaultOpen, isMobile }) {
  const [open, setOpen] = useState(defaultOpen);
  const c = CAT_COLORS[category] || { bg: "#F8FAFC", text: "#334155", dot: "#64748B" };

  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 12, overflow: "hidden",
      boxShadow: "0 1px 3px rgba(0,0,0,.04)",
    }}>
      <button onClick={() => setOpen(v => !v)}
        style={{
          width: "100%", border: "none", background: "transparent",
          padding: isMobile ? "13px 14px" : "14px 18px",
          display: "flex", alignItems: "center", gap: 10,
          cursor: "pointer", textAlign: "left",
          minHeight: 48, // 터치 영역 확보
        }}>
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: c.dot, flexShrink: 0 }} />
        <span style={{ fontWeight: 800, fontSize: isMobile ? 14 : 15, color: C.txt1, flex: 1 }}>{category}</span>
        <span style={{ fontSize: 12, color: C.txt3, fontWeight: 500 }}>{articles.length}건</span>
        <span style={{ fontSize: 11, color: C.txt3, marginLeft: 6 }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div style={{ borderTop: `1px solid ${C.border}` }}>
          {articles.map((a, i) => (
            <CatArticleRow key={i} article={a} rank={i + 1} isMobile={isMobile} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── 메인 ─────────────────────────────────────────────────
export default function Report() {
  const [date, setDate] = useState(todayStr());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const isMobile = useIsMobile();

  const fetchReport = async (d = date) => {
    setLoading(true); setErr(""); setReport(null);
    try {
      const res = await fetch(`/api/report?date=${d}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setReport(data);
    } catch (e) { setErr(e.message); }
    setLoading(false);
  };

  useEffect(() => { fetchReport(); }, [date]);

  const sortedCats = report
    ? [
        ...CAT_ORDER.filter(c => report.categories[c]),
        ...Object.keys(report.categories).filter(c => !CAT_ORDER.includes(c)),
      ]
    : [];

  return (
    <div style={{
      fontFamily: "'Apple SD Gothic Neo','Pretendard',system-ui,sans-serif",
      background: C.bg, minHeight: "100vh",
    }}>

      {/* 내비 */}
      <nav style={{
        background: C.nav, height: 52,
        display: "flex", alignItems: "center",
        padding: "0 14px", position: "sticky", top: 0, zIndex: 30, gap: 6,
      }}>
        {/* 로고 */}
        <a href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 7, textDecoration: "none", flexShrink: 0, marginRight: 4 }}>
          <div style={{ width: 26, height: 26, background: "#FFD600", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontWeight: 900, fontSize: 13, color: "#111" }}>D</span>
          </div>
          {!isMobile && <span style={{ color: "#F8FAFC", fontWeight: 800, fontSize: 14 }}>Daily View</span>}
        </a>
        {/* 페이지 메뉴 */}
        {[
          { href: "/dashboard", label: isMobile ? "📰" : "대시보드", active: false },
          { href: "/report",    label: isMobile ? "📊" : "리포트",   active: true },
          { href: "/insight",   label: isMobile ? "💡" : "인사이트", active: false },
        ].map(m => (
          <a key={m.href} href={m.href} style={{
            color: m.active ? "#fff" : "#94A3B8",
            fontSize: isMobile ? 16 : 12, fontWeight: 700,
            textDecoration: "none", padding: isMobile ? "6px 10px" : "6px 12px",
            borderRadius: 7,
            background: m.active ? "#2563EB" : "transparent",
            transition: "background .15s",
          }}>{m.label}</a>
        ))}
        <div style={{ flex: 1 }} />
      </nav>

      <div style={{ maxWidth: 820, margin: "0 auto", padding: isMobile ? "16px 12px 64px" : "24px 20px 80px" }}>

        {/* 페이지 헤더 */}
        <div style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between", alignItems: isMobile ? "stretch" : "flex-start",
          gap: 12, marginBottom: 20,
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: isMobile ? 19 : 22, fontWeight: 900, color: C.txt1, letterSpacing: -.5 }}>
              종합 뉴스 리포트
            </h1>
            {report && (
              <p style={{ margin: "5px 0 0", fontSize: 12, color: C.txt2 }}>
                {report.totalArticles.toLocaleString()}개 분석 · {report.totalGroups.toLocaleString()}개 주제 · 단독·속보 {report.breakingCount}건
              </p>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input type="date" value={date} max={todayStr()}
              onChange={e => setDate(e.target.value)}
              style={{
                flex: 1, border: `1px solid ${C.border}`, borderRadius: 8,
                padding: "9px 12px", fontSize: 13, fontWeight: 600,
                fontFamily: "inherit", outline: "none",
                background: C.surface, color: C.txt1,
                minHeight: 40,
              }} />
            <button onClick={() => fetchReport()}
              style={{
                background: C.accent, color: "#fff", border: "none",
                padding: "9px 14px", borderRadius: 8, fontWeight: 700,
                fontSize: 13, cursor: "pointer", flexShrink: 0, minHeight: 40,
              }}>
              새로고침
            </button>
          </div>
        </div>

        {/* 언론사별 수집 현황 */}
        {report && (
          <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
            {report.sourceStats.map(s => (
              <div key={s.name} style={{
                background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600, color: C.txt2,
              }}>
                {s.name} <span style={{ color: C.accent, fontWeight: 700 }}>{s.count}</span>
              </div>
            ))}
          </div>
        )}

        {/* 로딩 */}
        {loading && (
          <div style={{ textAlign: "center", padding: "72px 0" }}>
            <div style={{ width: 38, height: 38, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.accent}`, borderRadius: "50%", margin: "0 auto 14px", animation: "spin 1s linear infinite" }} />
            <div style={{ fontSize: 14, color: C.txt2, fontWeight: 600 }}>기사 분석 중...</div>
            <div style={{ fontSize: 12, color: C.txt3, marginTop: 4 }}>중복 제거 · 가중치 계산</div>
          </div>
        )}

        {/* 오류 */}
        {err && !loading && (
          <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "14px 16px", color: C.breaking, fontSize: 13, fontWeight: 600 }}>
            ⚠️ {err}
          </div>
        )}

        {report && !loading && (<>

          {/* 종합 TOP 10 */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <div style={{ width: 4, height: 20, background: C.gold, borderRadius: 2 }} />
              <h2 style={{ margin: 0, fontSize: isMobile ? 15 : 17, fontWeight: 900, color: C.txt1 }}>
                종합 주요기사 TOP 10
              </h2>
              <span style={{ fontSize: 11, color: C.txt3 }}>중복제거 · 가중치 적용</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 7 : 8 }}>
              {report.top10.map((a, i) => (
                <TopArticleCard key={i} article={a} rank={i + 1} isMobile={isMobile} />
              ))}
            </div>
          </div>

          {/* 구분선 */}
          <div style={{ height: 1, background: C.border, margin: "0 0 28px" }} />

          {/* 카테고리별 */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <div style={{ width: 4, height: 20, background: C.accent, borderRadius: 2 }} />
              <h2 style={{ margin: 0, fontSize: isMobile ? 15 : 17, fontWeight: 900, color: C.txt1 }}>
                카테고리별 주요기사
              </h2>
              <span style={{ fontSize: 11, color: C.txt3 }}>최대 10건</span>
            </div>

            {/* 모바일: 카테고리 빠른 점프 */}
            {isMobile && (
              <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8, marginBottom: 14 }}>
                {sortedCats.map(cat => {
                  const c = CAT_COLORS[cat] || { dot: "#64748B" };
                  return (
                    <button key={cat}
                      onClick={() => document.getElementById(`cat-${cat}`)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                      style={{
                        flexShrink: 0, border: `1px solid ${C.border}`,
                        background: C.surface, padding: "6px 11px",
                        borderRadius: 20, fontSize: 12, fontWeight: 600,
                        color: C.txt2, cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 5,
                      }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot }} />
                      {cat}
                    </button>
                  );
                })}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {sortedCats.map((cat, i) => (
                <div key={cat} id={`cat-${cat}`}>
                  <CategorySection
                    category={cat}
                    articles={report.categories[cat]}
                    defaultOpen={!isMobile && i < 3}
                    isMobile={isMobile}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 하단 메타 */}
          <div style={{ marginTop: 32, textAlign: "center", fontSize: 11, color: C.txt3, lineHeight: 1.8 }}>
            리포트 생성: {fmtDateFull(report.generatedAt)}<br />
            {report.totalArticles.toLocaleString()}개 기사 · {report.totalGroups.toLocaleString()}개 주제 그룹
          </div>
        </>)}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 4px; }
        a { -webkit-touch-callout: none; }
      `}</style>
    </div>
  );
}
