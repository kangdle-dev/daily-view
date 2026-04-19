import { useState, useEffect } from "react";
import { Printer } from "lucide-react";
import Nav from "./Nav.jsx";

const C = {
  bg: "#F1F5F9", surface: "#FFFFFF", border: "#E2E8F0",
  txt1: "#0F172A", txt2: "#475569", txt3: "#94A3B8",
  accent: "#2563EB", breaking: "#DC2626", nav: "#1E293B",
  gold: "#D97706", navy: "#1E3A5F",
};

const SOURCE_COLORS = {
  khan: "#F97316", chosun: "#3B82F6", newstomato: "#22C55E",
  yonhap: "#A855F7", newspim: "#14B8A6",
};



function todayStr() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
}
function fmtDate(d) {
  const dt = new Date(d + "T12:00:00");
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${dt.getFullYear()}년 ${dt.getMonth() + 1}월 ${dt.getDate()}일 (${days[dt.getDay()]})`;
}
function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString("ko-KR", {
    timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit",
  });
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
        {badge && <span style={{ color: "#94A3B8", fontSize: 11, marginLeft: "auto" }}>{badge}</span>}
      </div>
      {children}
    </div>
  );
}

export default function SimpleDashboard() {
  const [date, setDate]       = useState(todayStr());
  const [report, setReport]   = useState(null);
  const [insight, setInsight] = useState(null);
  const [articles, setArticles] = useState([]);
  const [aiText, setAiText]   = useState("");
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const isMobile = useIsMobile();

  const fetchData = async (d) => {
    setLoading(true); setAiText(""); setReport(null); setInsight(null); setArticles([]);
    try {
      const [rRes, iRes, aRes] = await Promise.all([
        fetch(`/api/report?date=${d}`),
        fetch(`/api/insight?date=${d}`),
        fetch(`/api/articles?date=${d}`),
      ]);
      if (rRes.ok) setReport(await rRes.json());
      if (iRes.ok) setInsight(await iRes.json());
      const aData = await aRes.json();
      setArticles(aData.articles || []);
    } catch {}
    setLoading(false);
  };

  const fetchAI = async () => {
    if (aiLoading || aiText) return;
    setAiLoading(true);
    try {
      const res = await fetch(`/api/insight/ai?date=${date}`);
      const data = await res.json();
      if (data.text) setAiText(data.text);
    } catch {}
    setAiLoading(false);
  };

  useEffect(() => { fetchData(date); }, [date]);

  // 파생 데이터
  const breaking = articles
    .filter(a => a.isBreaking)
    .sort((a, b) => new Date(a.publishedAt) - new Date(b.publishedAt));
  const top5 = report?.top10?.slice(0, 5) || [];
  const keywords = insight?.topKeywords?.slice(0, 10) || [];
  const sourceStats = insight?.sourceStats || [];
  const totalArticles = insight?.totalArticles || 0;
  const hasData = !!(report || insight);
  const nowStr = new Date().toLocaleTimeString("ko-KR", {
    timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit",
  });

  return (
    <div style={{ fontFamily: "'Apple SD Gothic Neo','Pretendard',system-ui,sans-serif", background: C.bg, minHeight: "100vh" }}>

      {/* ── 내비 (인쇄 숨김) ── */}
      <div className="no-print"><Nav current="/simple" /></div>
      {/* ── 날짜 + 인쇄 툴바 (인쇄 숨김) ── */}
      <div className="no-print" style={{ background: C.nav, display: "flex", alignItems: "center", padding: "8px 14px", gap: 8, justifyContent: "flex-end" }}>
        <input type="date" value={date} max={todayStr()} onChange={e => setDate(e.target.value)}
          style={{ border: "1px solid #334155", borderRadius: 7, padding: "6px 10px", fontSize: 12, fontWeight: 600, fontFamily: "inherit", outline: "none", background: "#293548", color: "#F1F5F9", minHeight: 36 }} />
        <button onClick={() => window.print()}
          style={{ background: "#FFD600", color: "#111", border: "none", padding: "7px 14px", borderRadius: 7, fontWeight: 800, fontSize: 12, cursor: "pointer" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Printer size={13} strokeWidth={2} /> 인쇄</span>
        </button>
      </div>

      {/* ── 콘텐츠 ── */}
      <div id="print-area" style={{ maxWidth: 820, margin: "0 auto", padding: isMobile ? "14px 12px 60px" : "20px 20px 60px" }}>

        {/* 로딩 */}
        {loading && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ width: 36, height: 36, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.accent}`, borderRadius: "50%", margin: "0 auto 14px", animation: "spin 1s linear infinite" }} />
            <div style={{ fontSize: 14, color: C.txt2 }}>데이터 불러오는 중...</div>
          </div>
        )}

        {/* 데이터 없음 */}
        {!loading && !hasData && (
          <div style={{ textAlign: "center", padding: "60px 20px", background: C.surface, borderRadius: 14, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
            <div style={{ fontWeight: 700, fontSize: 15, color: C.txt1, marginBottom: 8 }}>수집된 데이터가 없습니다</div>
            <div style={{ fontSize: 13, color: C.txt2, marginBottom: 16 }}>대시보드에서 기사를 먼저 수집해주세요</div>
            <a href="/dashboard" style={{ background: C.accent, color: "#fff", padding: "10px 22px", borderRadius: 8, fontWeight: 700, fontSize: 14, textDecoration: "none" }}>대시보드로 이동 →</a>
          </div>
        )}

        {/* 보고서 본문 */}
        {!loading && hasData && (
          <>
            {/* ─ 헤더 ─ */}
            <div style={{ background: C.nav, color: "#fff", borderRadius: 10, padding: "14px 20px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <div>
                <div style={{ fontSize: 9, color: "#64748B", fontWeight: 700, letterSpacing: 2, marginBottom: 4 }}>DAILY VIEW — 임원 브리핑</div>
                <div style={{ fontSize: isMobile ? 16 : 20, fontWeight: 900, letterSpacing: -0.5 }}>{fmtDate(date)}</div>
              </div>
              <div style={{ display: "flex", gap: isMobile ? 16 : 28, flexWrap: "wrap" }}>
                {[
                  { v: `${insight?.totalSources ?? 0}개사`, l: "수집 언론사" },
                  { v: `${totalArticles}건`,                 l: "총 기사" },
                  { v: `${insight?.breakingCount ?? 0}건`,  l: "단독·속보" },
                ].map(s => (
                  <div key={s.l} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 900, color: "#FFD600", letterSpacing: -0.5 }}>{s.v}</div>
                    <div style={{ fontSize: 10, color: "#64748B", fontWeight: 600, marginTop: 1 }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ─ TOP 5 ─ */}
            <Block title="오늘의 주요 기사 TOP 5" badge="유사기사 그룹핑 · 중요도 가중치 적용">
              {top5.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: C.txt3, fontSize: 13 }}>리포트 데이터 없음 — 리포트 페이지를 먼저 확인하세요</div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <colgroup>
                    <col style={{ width: 38 }} /><col /><col style={{ width: 58 }} /><col style={{ width: 72 }} />
                  </colgroup>
                  <thead>
                    <tr style={{ background: "#F8FAFC", borderBottom: `1px solid ${C.border}` }}>
                      {["순위", "기사 제목", "분야", "보도"].map((h, i) => (
                        <th key={h} style={{ padding: "7px 8px", color: C.txt3, fontSize: 11, fontWeight: 700, textAlign: i === 1 ? "left" : "center" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {top5.map((a, i) => (
                      <tr key={i} style={{ borderTop: `1px solid ${C.border}`, background: a.isBreaking ? "#FFF8F8" : "#fff" }}>
                        <td style={{ padding: "10px 8px", textAlign: "center" }}>
                          <span style={{
                            fontWeight: 900, fontSize: 16,
                            color: i === 0 ? C.gold : i === 1 ? "#64748B" : i === 2 ? "#B45309" : C.txt3,
                          }}>{i + 1}</span>
                        </td>
                        <td style={{ padding: "10px 8px 10px 0" }}>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 5 }}>
                            {a.isBreaking && (
                              <span style={{ background: C.breaking, color: "#fff", fontSize: 9, fontWeight: 800, padding: "2px 5px", borderRadius: 3, flexShrink: 0, marginTop: 2 }}>단독</span>
                            )}
                            <span style={{ fontSize: 13, fontWeight: 700, color: C.txt1, lineHeight: 1.55 }}>{a.title}</span>
                          </div>
                          {a.sources?.length > 0 && (
                            <div style={{ fontSize: 11, color: C.txt3, marginTop: 3 }}>
                              {a.sources.slice(0, 4).join(" · ")}{a.sources.length > 4 ? " 등" : ""}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: "10px 8px", textAlign: "center" }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: C.txt2, background: "#F1F5F9", padding: "2px 7px", borderRadius: 4 }}>{a.category}</span>
                        </td>
                        <td style={{ padding: "10px 8px", textAlign: "center" }}>
                          <span style={{
                            fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 4,
                            color: a.groupSize > 1 ? C.accent : C.txt2,
                            background: a.groupSize > 1 ? "#EFF6FF" : "#F8FAFC",
                          }}>
                            {a.groupSize > 1 ? `${a.groupSize}개사` : a.sourceName}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Block>

            {/* ─ AI 요약 ─ */}
            <Block title="🤖 AI 오늘 요약" accent="#0F172A">
              <div style={{ padding: "11px 16px", minHeight: 56, display: "flex", alignItems: "flex-start", gap: 10 }}>
                {aiLoading ? (
                  <div style={{ fontSize: 13, color: C.txt3 }}>Claude AI 분석 중...</div>
                ) : aiText ? (
                  <div style={{ fontSize: 13, lineHeight: 1.9, color: C.txt1, whiteSpace: "pre-wrap", flex: 1 }}>{aiText}</div>
                ) : (
                  <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 12 }}>
                    <div className="no-print" style={{ fontSize: 13, color: C.txt3, fontStyle: "italic" }}>AI 요약을 생성하면 인쇄본에도 포함됩니다</div>
                    <button onClick={fetchAI} className="no-print"
                      style={{ background: C.accent, color: "#fff", border: "none", padding: "6px 16px", borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>
                      AI 요약 생성
                    </button>
                  </div>
                )}
              </div>
            </Block>

            {/* ─ 2컬럼: 단독·속보 | 언론사 현황 ─ */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 12 }}>

              {/* 단독·속보 타임라인 */}
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
                <div style={{ background: "#7F1D1D", padding: "8px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 3, height: 13, background: "#FFD600", borderRadius: 2 }} />
                  <span style={{ color: "#fff", fontWeight: 800, fontSize: 13 }}>🚨 단독·속보</span>
                  <span style={{ color: "#FCA5A5", fontSize: 11, marginLeft: 4 }}>{breaking.length}건</span>
                </div>
                {breaking.length === 0 ? (
                  <div style={{ padding: "20px", textAlign: "center", color: C.txt3, fontSize: 12 }}>오늘 단독·속보 없음</div>
                ) : (
                  <>
                    {breaking.slice(0, 7).map((a, i) => (
                      <div key={i} style={{ padding: "8px 14px", borderBottom: `1px solid ${C.border}`, display: "flex", gap: 8, alignItems: "flex-start" }}>
                        <span style={{ fontSize: 11, color: C.txt3, flexShrink: 0, paddingTop: 2, minWidth: 38, fontVariantNumeric: "tabular-nums" }}>{fmtTime(a.publishedAt)}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: C.txt1, lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{a.title}</div>
                          <div style={{ fontSize: 10, color: C.txt3, marginTop: 2 }}>{a.sourceName}</div>
                        </div>
                      </div>
                    ))}
                    {breaking.length > 7 && (
                      <div style={{ padding: "7px 14px", fontSize: 11, color: C.txt3, background: "#FAFAFA", textAlign: "center" }}>
                        + {breaking.length - 7}건 더 있음
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* 언론사 현황 */}
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
                <div style={{ background: C.navy, padding: "8px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 3, height: 13, background: "#FFD600", borderRadius: 2 }} />
                  <span style={{ color: "#fff", fontWeight: 800, fontSize: 13 }}>📊 언론사별 현황</span>
                </div>
                {sourceStats.length === 0 ? (
                  <div style={{ padding: "20px", textAlign: "center", color: C.txt3, fontSize: 12 }}>데이터 없음</div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <colgroup><col /><col /><col style={{ width: 38 }} /><col style={{ width: 38 }} /><col style={{ width: 44 }} /></colgroup>
                    <thead>
                      <tr style={{ background: "#F8FAFC", borderBottom: `1px solid ${C.border}` }}>
                        {["언론사", "점유", "기사", "%", "속보"].map((h, i) => (
                          <th key={h} style={{ padding: "6px 8px", fontSize: 10, fontWeight: 700, color: C.txt3, textAlign: i < 2 ? "left" : "center" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sourceStats.map((s) => {
                        const pct = totalArticles > 0 ? (s.total / totalArticles * 100).toFixed(1) : "0";
                        const color = SOURCE_COLORS[s.key] || C.accent;
                        return (
                          <tr key={s.key} style={{ borderTop: `1px solid ${C.border}` }}>
                            <td style={{ padding: "8px 8px", fontWeight: 800, fontSize: 12, color: C.txt1 }}>{s.name}</td>
                            <td style={{ padding: "8px 8px 8px 0" }}>
                              <div style={{ background: "#F1F5F9", borderRadius: 3, height: 10, overflow: "hidden" }}>
                                <div style={{ width: `${Math.max(parseFloat(pct), 2)}%`, height: "100%", background: color, borderRadius: 3 }} />
                              </div>
                            </td>
                            <td style={{ padding: "8px 6px", textAlign: "center", fontSize: 12, fontWeight: 700, color: C.txt1 }}>{s.total}</td>
                            <td style={{ padding: "8px 4px", textAlign: "center", fontSize: 11, color: C.txt2 }}>{pct}%</td>
                            <td style={{ padding: "8px 8px 8px 4px", textAlign: "center" }}>
                              {s.breaking > 0
                                ? <span style={{ fontSize: 10, fontWeight: 700, color: C.breaking, background: "#FEF2F2", padding: "1px 5px", borderRadius: 4 }}>{s.breaking}</span>
                                : <span style={{ fontSize: 11, color: C.txt3 }}>—</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* ─ 키워드 TOP 10 ─ */}
            <Block title="🔑 오늘의 핵심 키워드 TOP 10" badge="기사 제목 기반 추출">
              <div style={{ padding: "10px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 24px" }}>
                {keywords.map((kw, i) => {
                  const maxCount = keywords[0]?.count || 1;
                  return (
                    <div key={kw.word} style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 0", borderBottom: `1px solid ${C.border}` }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: i < 3 ? C.accent : C.txt3, minWidth: 18, textAlign: "right", flexShrink: 0 }}>{i + 1}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.txt1, minWidth: 54, flexShrink: 0 }}>{kw.word}</span>
                      <div style={{ flex: 1, background: "#F1F5F9", borderRadius: 3, height: 10, overflow: "hidden" }}>
                        <div style={{ width: `${(kw.count / maxCount) * 100}%`, height: "100%", background: i < 3 ? C.accent : "#BFDBFE", borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: C.txt2, minWidth: 20, textAlign: "right", flexShrink: 0 }}>{kw.count}</span>
                    </div>
                  );
                })}
              </div>
            </Block>

            {/* 푸터 */}
            <div style={{ textAlign: "center", fontSize: 10, color: C.txt3, paddingTop: 2, lineHeight: 1.7 }}>
              생성: {date} {nowStr} KST &nbsp;·&nbsp; Daily View AI 브리핑 &nbsp;·&nbsp; 수집 기사 기반 자동 분석 리포트
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
          a { text-decoration: none !important; }
        }
      `}</style>
    </div>
  );
}
