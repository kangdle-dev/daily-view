import { useState, useEffect } from "react";

const C = {
  bg: "#F0FDF8", surface: "#FFFFFF", border: "#E2E8F0",
  txt1: "#0F172A", txt2: "#475569", txt3: "#94A3B8",
  accent: "#0D9488", breaking: "#DC2626", nav: "#1E293B",
  gold: "#D97706", teal: "#14B8A6", navy: "#134E4A",
  good: "#16A34A", bad: "#DC2626", neutral: "#2563EB",
};

const SOURCE_COLORS = {
  khan: "#F97316", chosun: "#3B82F6", newstomato: "#22C55E",
  yonhap: "#A855F7", newspim: "#14B8A6",
};

const NAV = [
  { href: "/dashboard",  label: "대시보드",    mLabel: "📰" },
  { href: "/report",     label: "리포트",      mLabel: "📊" },
  { href: "/insight",    label: "인사이트",    mLabel: "💡" },
  { href: "/simple",     label: "심플대시보드", mLabel: "🖨️" },
  { href: "/newspim",    label: "뉴스핌분석",  mLabel: "📈" },
  { href: "/feeds",      label: "피드관리",    mLabel: "⚙️" },
];

const SPECIALTY_CATS = ["증권·금융", "산업", "부동산", "경제"];
const NEWSPIM_NAME = "뉴스핌";

function todayStr() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
}
function fmtDate(d) {
  const dt = new Date(d + "T12:00:00");
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${dt.getFullYear()}년 ${dt.getMonth() + 1}월 ${dt.getDate()}일 (${days[dt.getDay()]})`;
}
function useIsMobile() {
  const [m, setM] = useState(window.innerWidth < 640);
  useEffect(() => {
    const fn = () => setM(window.innerWidth < 640);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return m;
}

// ── 섹션 래퍼 ────────────────────────────────────────────────
function Block({ title, accent = C.navy, badge, children }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, marginBottom: 12, overflow: "hidden" }}>
      <div style={{ background: accent, padding: "8px 14px", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 3, height: 13, background: "#FFD600", borderRadius: 2, flexShrink: 0 }} />
        <span style={{ color: "#fff", fontWeight: 800, fontSize: 13 }}>{title}</span>
        {badge && <span style={{ color: "rgba(255,255,255,.5)", fontSize: 11, marginLeft: "auto" }}>{badge}</span>}
      </div>
      {children}
    </div>
  );
}

// ── KPI 카드 ─────────────────────────────────────────────────
function KpiCard({ label, value, sub, color, icon }) {
  return (
    <div style={{ flex: 1, minWidth: 0, background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: "14px 12px", textAlign: "center" }}>
      <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 22, fontWeight: 900, color: color || C.txt1, letterSpacing: -0.5, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: C.txt3, marginTop: 3 }}>{sub}</div>}
      <div style={{ fontSize: 11, color: C.txt2, fontWeight: 600, marginTop: 4 }}>{label}</div>
    </div>
  );
}

// ── 메인 분석 계산 ────────────────────────────────────────────
function computeAnalysis(insight) {
  if (!insight) return null;

  const { sourceStats = [], crossSourceIssues = [], totalArticles = 0 } = insight;

  // 뉴스핌 stats
  const npStat = sourceStats.find(s => s.key === "newspim");
  if (!npStat) return null;

  const npCats = npStat.categories || {};
  const npTotal = npStat.total || 0;
  const npBreaking = npStat.breaking || 0;
  const marketShare = totalArticles > 0 ? (npTotal / totalArticles * 100).toFixed(1) : "0";

  // 전체 카테고리 집계 (모든 언론사 합산)
  const allCats = {};
  sourceStats.forEach(s => {
    Object.entries(s.categories || {}).forEach(([cat, cnt]) => {
      if (!allCats[cat]) allCats[cat] = { total: 0, bySrc: {} };
      allCats[cat].total += cnt;
      allCats[cat].bySrc[s.key] = (allCats[cat].bySrc[s.key] || 0) + cnt;
    });
  });

  // 카테고리별 뉴스핌 점유율
  const catRows = Object.entries(allCats)
    .map(([cat, d]) => {
      const npCnt = npCats[cat] || 0;
      const share = d.total > 0 ? Math.round(npCnt / d.total * 100) : 0;
      const sortedSrcs = sourceStats
        .map(s => ({ key: s.key, name: s.name, cnt: (d.bySrc[s.key] || 0) }))
        .sort((a, b) => b.cnt - a.cnt);
      const rank = sortedSrcs.findIndex(s => s.key === "newspim") + 1;
      return { cat, total: d.total, npCnt, share, rank, bySrc: d.bySrc, sortedSrcs };
    })
    .sort((a, b) => b.total - a.total);

  // 전문 분야 KPI (증권·금융, 산업, 부동산, 경제)
  const specialtyRows = catRows.filter(r => SPECIALTY_CATS.includes(r.cat));
  const specialtyNp = specialtyRows.reduce((s, r) => s + r.npCnt, 0);
  const specialtyTotal = specialtyRows.reduce((s, r) => s + r.total, 0);
  const specialtyShare = specialtyTotal > 0 ? Math.round(specialtyNp / specialtyTotal * 100) : 0;

  // 교차 이슈 분석
  const participated = crossSourceIssues.filter(i =>
    i.sources.some(s => s.includes(NEWSPIM_NAME))
  );
  const missed = crossSourceIssues.filter(i =>
    !i.sources.some(s => s.includes(NEWSPIM_NAME))
  ).slice(0, 6);
  const participationRate = crossSourceIssues.length > 0
    ? Math.round(participated.length / crossSourceIssues.length * 100) : 0;

  // 강점: 뉴스핌 점유 1위 또는 30% 이상인 카테고리
  const strengths = catRows
    .filter(r => r.rank === 1 && r.npCnt > 0)
    .sort((a, b) => b.share - a.share)
    .slice(0, 4);

  // 공백: 기사가 5건 이상인데 뉴스핌 0건이거나 점유 10% 미만
  const gaps = catRows
    .filter(r => r.total >= 5 && r.share < 15 && !SPECIALTY_CATS.includes(r.cat))
    .sort((a, b) => b.total - a.total)
    .slice(0, 4);

  // 관찰 포인트 (rule-based)
  const observations = [];
  if (specialtyShare >= 40)
    observations.push(`전문 분야(금융·산업·부동산·경제) 통합 점유율 ${specialtyShare}%로 타사 대비 압도적 우위를 유지하고 있습니다.`);
  else if (specialtyShare > 0)
    observations.push(`전문 분야(금융·산업·부동산·경제) 점유율이 ${specialtyShare}%로, 전문 경제지로서의 포지션 강화가 필요합니다.`);

  if (participationRate < 50 && crossSourceIssues.length > 0)
    observations.push(`주요 교차 이슈 참여율 ${participationRate}% — 타사가 집중 보도한 이슈 ${missed.length}건에 미참여했습니다.`);
  else if (participationRate >= 70 && crossSourceIssues.length > 0)
    observations.push(`주요 교차 이슈 참여율 ${participationRate}%로 양호한 수준입니다.`);

  const missingCats = catRows.filter(r => r.npCnt === 0 && r.total >= 5);
  if (missingCats.length > 0)
    observations.push(`${missingCats.map(r => r.cat).slice(0, 3).join(", ")} 분야 기사 미수집 — 해당 분야 모니터링 공백이 있습니다.`);

  if (npBreaking === 0 && insight.breakingCount > 0)
    observations.push(`오늘 타사 단독·속보 ${insight.breakingCount}건 중 뉴스핌 건수 없음 — 단독 기사 태그 관행 점검이 필요합니다.`);

  return {
    npStat, npTotal, npBreaking, marketShare,
    specialtyShare, participationRate,
    participated, missed,
    catRows, strengths, gaps, observations,
    sourceStats, totalArticles, crossSourceIssues,
  };
}

export default function NewspimAnalysis() {
  const [date, setDate]       = useState(todayStr());
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const isMobile = useIsMobile();

  const fetchData = async (d) => {
    setLoading(true); setError(""); setInsight(null);
    try {
      const res = await fetch(`/api/insight?date=${d}`);
      if (res.status === 404) { setError("해당 날짜의 수집 기사가 없습니다."); setLoading(false); return; }
      if (!res.ok) throw new Error((await res.json()).error);
      setInsight(await res.json());
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  useEffect(() => { fetchData(date); }, [date]);

  const analysis = computeAnalysis(insight);
  const nowStr = new Date().toLocaleTimeString("ko-KR", {
    timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit",
  });

  const otherSources = analysis?.sourceStats.filter(s => s.key !== "newspim") || [];

  return (
    <div style={{ fontFamily: "'Apple SD Gothic Neo','Pretendard',system-ui,sans-serif", background: C.bg, minHeight: "100vh" }}>

      {/* ── 내비 ── */}
      <nav className="no-print" style={{ background: C.nav, height: 52, display: "flex", alignItems: "center", padding: "0 12px", position: "sticky", top: 0, zIndex: 30, gap: 3 }}>
        <a href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 7, textDecoration: "none", flexShrink: 0, marginRight: 4 }}>
          <div style={{ width: 26, height: 26, background: "#FFD600", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontWeight: 900, fontSize: 13, color: "#111" }}>D</span>
          </div>
          {!isMobile && <span style={{ color: "#F8FAFC", fontWeight: 800, fontSize: 14 }}>Daily View</span>}
        </a>
        {NAV.map(m => (
          <a key={m.href} href={m.href} style={{
            color: m.href === "/newspim" ? "#fff" : "#94A3B8",
            fontSize: isMobile ? 15 : 12, fontWeight: 700,
            textDecoration: "none", padding: isMobile ? "6px 7px" : "6px 10px",
            borderRadius: 7, background: m.href === "/newspim" ? C.accent : "transparent",
            flexShrink: 0, transition: "background .15s",
          }}>{isMobile ? m.mLabel : m.label}</a>
        ))}
        <div style={{ flex: 1 }} />
        <input type="date" value={date} max={todayStr()} onChange={e => setDate(e.target.value)}
          style={{ border: "1px solid #334155", borderRadius: 7, padding: "6px 10px", fontSize: 12, fontWeight: 600, fontFamily: "inherit", outline: "none", background: "#293548", color: "#F1F5F9", minHeight: 36 }} />
        <button onClick={() => window.print()}
          style={{ background: "#FFD600", color: "#111", border: "none", padding: "7px 14px", borderRadius: 7, fontWeight: 800, fontSize: 12, cursor: "pointer", flexShrink: 0, marginLeft: 8 }}>
          🖨️ 인쇄
        </button>
      </nav>

      {/* ── 콘텐츠 ── */}
      <div id="print-area" style={{ maxWidth: 820, margin: "0 auto", padding: isMobile ? "14px 12px 60px" : "20px 20px 60px" }}>

        {loading && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ width: 36, height: 36, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.accent}`, borderRadius: "50%", margin: "0 auto 14px", animation: "spin 1s linear infinite" }} />
            <div style={{ fontSize: 14, color: C.txt2 }}>분석 데이터 불러오는 중...</div>
          </div>
        )}

        {!loading && error && (
          <div style={{ textAlign: "center", padding: "60px 20px", background: C.surface, borderRadius: 14, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
            <div style={{ fontWeight: 700, fontSize: 15, color: C.txt1, marginBottom: 8 }}>{error}</div>
            <a href="/dashboard" style={{ background: C.accent, color: "#fff", padding: "10px 22px", borderRadius: 8, fontWeight: 700, fontSize: 14, textDecoration: "none" }}>대시보드로 이동 →</a>
          </div>
        )}

        {!loading && !error && insight && !analysis && (
          <div style={{ textAlign: "center", padding: "60px 20px", background: C.surface, borderRadius: 14, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontWeight: 700, fontSize: 15, color: C.txt1, marginBottom: 8 }}>뉴스핌 수집 데이터가 없습니다</div>
            <div style={{ fontSize: 13, color: C.txt2 }}>대시보드에서 뉴스핌 기사를 먼저 수집해주세요</div>
          </div>
        )}

        {!loading && !error && analysis && (
          <>
            {/* ─ 헤더 ─ */}
            <div style={{ background: C.navy, color: "#fff", borderRadius: 10, padding: "14px 20px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <div>
                <div style={{ fontSize: 9, color: "#6EE7B7", fontWeight: 700, letterSpacing: 2, marginBottom: 4 }}>뉴스핌 — 언론사 비교 분석 리포트</div>
                <div style={{ fontSize: isMobile ? 16 : 20, fontWeight: 900, letterSpacing: -0.5 }}>{fmtDate(date)}</div>
                <div style={{ fontSize: 11, color: "#6EE7B7", marginTop: 3 }}>
                  비교 대상: {otherSources.map(s => s.name).join(" · ")}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <div style={{ background: "rgba(255,255,255,.1)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: "#FFD600" }}>{analysis.npTotal}건</div>
                  <div style={{ fontSize: 10, color: "#6EE7B7" }}>뉴스핌 기사</div>
                </div>
                <div style={{ background: "rgba(255,255,255,.1)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: "#FFD600" }}>{analysis.analysis?.totalArticles || insight.totalArticles}건</div>
                  <div style={{ fontSize: 10, color: "#6EE7B7" }}>전체 기사</div>
                </div>
              </div>
            </div>

            {/* ─ 4칸 KPI ─ */}
            <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
              <KpiCard icon="📰" label="뉴스핌 기사" value={`${analysis.npTotal}건`} sub={`전체 ${insight.totalArticles}건 중`} color={C.accent} />
              <KpiCard icon="🚨" label="단독·속보" value={`${analysis.npBreaking}건`}
                sub={insight.breakingCount > 0 ? `전체 ${insight.breakingCount}건 중 ${Math.round(analysis.npBreaking / insight.breakingCount * 100)}%` : "오늘 속보 없음"}
                color={analysis.npBreaking > 0 ? C.breaking : C.txt3} />
              <KpiCard icon="📊" label="시장 점유율" value={`${analysis.marketShare}%`} sub={`${insight.totalSources}개사 기준`} color={C.neutral} />
              <KpiCard icon="💰" label="전문분야 점유" value={`${analysis.specialtyShare}%`} sub="금융·산업·부동산·경제" color={analysis.specialtyShare >= 30 ? C.good : C.gold} />
            </div>

            {/* ─ 2컬럼: 강점 | 공백 ─ */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 12 }}>

              {/* 강점 */}
              <div style={{ background: C.surface, border: `1.5px solid #BBF7D0`, borderRadius: 10, overflow: "hidden" }}>
                <div style={{ background: "#14532D", padding: "8px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 3, height: 13, background: "#FFD600", borderRadius: 2 }} />
                  <span style={{ color: "#fff", fontWeight: 800, fontSize: 13 }}>✅ 강점 — 분야 집중도</span>
                </div>
                <div style={{ padding: "10px 14px" }}>
                  {analysis.strengths.length === 0 ? (
                    <div style={{ fontSize: 12, color: C.txt3 }}>1위 분야 없음</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {analysis.strengths.map(r => (
                        <div key={r.cat} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, background: "#DCFCE7", color: "#15803D", padding: "2px 8px", borderRadius: 5, flexShrink: 0 }}>1위</span>
                          <span style={{ fontSize: 13, fontWeight: 800, color: C.txt1, minWidth: 68 }}>{r.cat}</span>
                          <div style={{ flex: 1, background: "#F0FDF4", borderRadius: 3, height: 12, overflow: "hidden" }}>
                            <div style={{ width: `${r.share}%`, height: "100%", background: "#22C55E", borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 800, color: C.good, minWidth: 36, textAlign: "right" }}>{r.share}%</span>
                          <span style={{ fontSize: 11, color: C.txt3, minWidth: 28, textAlign: "right" }}>{r.npCnt}건</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* 교차 이슈 참여 */}
                  <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.txt2, marginBottom: 6 }}>교차 이슈 참여</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ flex: 1, background: "#F0FDF4", borderRadius: 4, height: 14, overflow: "hidden" }}>
                        <div style={{ width: `${analysis.participationRate}%`, height: "100%", background: analysis.participationRate >= 60 ? "#22C55E" : "#FCD34D", borderRadius: 4 }} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 800, color: analysis.participationRate >= 60 ? C.good : C.gold }}>
                        {analysis.participationRate}%
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: C.txt3, marginTop: 3 }}>
                      전체 {analysis.crossSourceIssues.length}개 이슈 중 {analysis.participated.length}개 참여
                    </div>
                  </div>
                </div>
              </div>

              {/* 공백 */}
              <div style={{ background: C.surface, border: `1.5px solid #FECACA`, borderRadius: 10, overflow: "hidden" }}>
                <div style={{ background: "#7F1D1D", padding: "8px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 3, height: 13, background: "#FFD600", borderRadius: 2 }} />
                  <span style={{ color: "#fff", fontWeight: 800, fontSize: 13 }}>⚠️ 공백 — 미참여 이슈</span>
                </div>
                <div style={{ padding: "10px 14px" }}>
                  {analysis.missed.length === 0 ? (
                    <div style={{ fontSize: 12, color: C.good, fontWeight: 600 }}>모든 교차 이슈에 참여했습니다 ✓</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {analysis.missed.map((issue, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "6px 0", borderBottom: i < analysis.missed.length - 1 ? `1px solid #FEE2E2` : "none" }}>
                          <span style={{ fontSize: 11, fontWeight: 700, background: "#FEE2E2", color: C.breaking, padding: "2px 6px", borderRadius: 4, flexShrink: 0 }}>
                            {issue.srcCount || issue.sources.length}개사
                          </span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: C.txt1 }}>{issue.keyword}</div>
                            <div style={{ fontSize: 10, color: C.txt3, marginTop: 1, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                              {issue.sources.join(" · ")}
                            </div>
                          </div>
                          <span style={{ fontSize: 11, color: C.txt3, flexShrink: 0 }}>{issue.count}건</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 분야 공백 */}
                  {analysis.gaps.length > 0 && (
                    <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: C.txt2, marginBottom: 6 }}>분야별 공백</div>
                      {analysis.gaps.map(r => (
                        <div key={r.cat} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, background: "#FEF2F2", color: C.breaking, padding: "1px 6px", borderRadius: 4, flexShrink: 0, minWidth: 28, textAlign: "center" }}>
                            {r.npCnt === 0 ? "미보도" : `${r.share}%`}
                          </span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: C.txt1 }}>{r.cat}</span>
                          <span style={{ fontSize: 11, color: C.txt3, marginLeft: "auto" }}>전체 {r.total}건</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ─ 분야별 비교 매트릭스 ─ */}
            <Block title="📊 분야별 언론사 비교 매트릭스" accent={C.navy} badge="뉴스핌 점유율 기준 정렬">
              <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <colgroup>
                    <col style={{ width: 80 }} />
                    <col style={{ width: 50 }} />
                    {analysis.sourceStats.map(s => <col key={s.key} style={{ width: 52 }} />)}
                    <col style={{ width: 64 }} />
                    <col style={{ width: 36 }} />
                  </colgroup>
                  <thead>
                    <tr style={{ background: "#F8FAFC", borderBottom: `1px solid ${C.border}` }}>
                      <th style={{ padding: "7px 10px", textAlign: "left", color: C.txt3, fontSize: 11, fontWeight: 700 }}>분야</th>
                      <th style={{ padding: "7px 6px", textAlign: "center", color: C.txt3, fontSize: 11, fontWeight: 700 }}>전체</th>
                      {analysis.sourceStats.map(s => (
                        <th key={s.key} style={{ padding: "7px 4px", textAlign: "center", fontSize: 10, fontWeight: 700,
                          color: s.key === "newspim" ? C.accent : C.txt3 }}>
                          {s.name.slice(0, 3)}
                        </th>
                      ))}
                      <th style={{ padding: "7px 6px", textAlign: "center", color: C.accent, fontSize: 11, fontWeight: 800 }}>뉴핌 점유</th>
                      <th style={{ padding: "7px 6px", textAlign: "center", color: C.txt3, fontSize: 11, fontWeight: 700 }}>순위</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.catRows.slice(0, 12).map((r, i) => {
                      const isStrength = r.rank === 1 && r.npCnt > 0;
                      const isGap = r.npCnt === 0 && r.total >= 5;
                      return (
                        <tr key={r.cat} style={{
                          borderTop: `1px solid ${C.border}`,
                          background: isStrength ? "#F0FDF4" : isGap ? "#FFF8F8" : i % 2 === 0 ? "#fff" : "#FAFAFA",
                        }}>
                          <td style={{ padding: "8px 10px", fontWeight: 700, color: C.txt1, fontSize: 12 }}>{r.cat}</td>
                          <td style={{ padding: "8px 6px", textAlign: "center", fontWeight: 600, color: C.txt2 }}>{r.total}</td>
                          {analysis.sourceStats.map(s => {
                            const cnt = r.bySrc[s.key] || 0;
                            return (
                              <td key={s.key} style={{ padding: "8px 4px", textAlign: "center", fontWeight: s.key === "newspim" ? 800 : 500,
                                color: s.key === "newspim" ? (cnt > 0 ? C.accent : C.txt3) : C.txt2,
                                fontSize: s.key === "newspim" ? 13 : 12 }}>
                                {cnt || "·"}
                              </td>
                            );
                          })}
                          <td style={{ padding: "8px 6px", textAlign: "center" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <div style={{ flex: 1, background: "#F1F5F9", borderRadius: 2, height: 10, overflow: "hidden" }}>
                                <div style={{ width: `${r.share}%`, height: "100%", background: isStrength ? "#22C55E" : isGap ? "#FCA5A5" : C.accent, borderRadius: 2 }} />
                              </div>
                              <span style={{ fontSize: 11, fontWeight: 800, color: isStrength ? C.good : isGap ? C.breaking : C.txt1, minWidth: 28, textAlign: "right" }}>
                                {r.share}%
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: "8px 6px", textAlign: "center" }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: r.rank === 1 ? C.good : r.rank === 2 ? C.gold : C.txt3 }}>
                              {r.npCnt === 0 ? "—" : `${r.rank}위`}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {analysis.catRows.length > 12 && (
                  <div style={{ padding: "7px 12px", fontSize: 11, color: C.txt3, textAlign: "center", background: "#FAFAFA" }}>
                    외 {analysis.catRows.length - 12}개 분야
                  </div>
                )}
              </div>
            </Block>

            {/* ─ 관찰 포인트 ─ */}
            {analysis.observations.length > 0 && (
              <Block title="📌 관찰 포인트" accent="#1E3A5F">
                <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
                  {analysis.observations.map((obs, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <span style={{ fontSize: 12, color: C.accent, fontWeight: 800, flexShrink: 0, paddingTop: 1 }}>{i + 1}.</span>
                      <span style={{ fontSize: 13, color: C.txt1, lineHeight: 1.7 }}>{obs}</span>
                    </div>
                  ))}
                </div>
              </Block>
            )}

            {/* 푸터 */}
            <div style={{ textAlign: "center", fontSize: 10, color: C.txt3, paddingTop: 2, lineHeight: 1.7 }}>
              분석 기준: {date} 수집 기사 &nbsp;·&nbsp; Daily View 자동 분석 &nbsp;·&nbsp; 생성 {nowStr} KST
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 4px; }
        input[type="date"]::-webkit-calendar-picker-indicator { opacity: .5; }
        @media print {
          @page { size: A4 portrait; margin: 12mm 14mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white !important; }
          .no-print { display: none !important; }
          nav { display: none !important; }
          #print-area { max-width: 100% !important; padding: 0 !important; margin: 0 !important; }
          * { box-shadow: none !important; animation: none !important; }
        }
      `}</style>
    </div>
  );
}
