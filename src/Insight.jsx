import { useState, useEffect } from "react";
import { Newspaper, Building2, FolderOpen, AlertCircle } from "lucide-react";
import Nav from "./Nav.jsx";

function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth < 640);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 640);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return mobile;
}

const C = {
  bg: "#F1F5F9", surface: "#FFFFFF", border: "#E2E8F0",
  txt1: "#0F172A", txt2: "#475569", txt3: "#94A3B8",
  accent: "#2563EB", nav: "#1E293B",
};

const SOURCE_COLORS = {
  khan:       "#F97316", chosun:  "#3B82F6", newstomato: "#22C55E",
  yonhap:     "#A855F7", newspim: "#14B8A6",
};
const SOURCE_NAMES = {
  khan: "경향", chosun: "조선", newstomato: "뉴토", yonhap: "연합", newspim: "뉴핌",
};

function todayStr() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
}

// ── 섹션 컨테이너 ─────────────────────────────────────────
function Section({ title, sub, children }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px 20px 22px", marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: C.txt1 }}>{title}</h2>
        {sub && <p style={{ margin: "3px 0 0", fontSize: 12, color: C.txt3 }}>{sub}</p>}
      </div>
      {children}
    </div>
  );
}

// ── 요약 통계 카드 ────────────────────────────────────────
function StatCard({ icon, label, value, color }) {
  return (
    <div style={{ flex: 1, minWidth: 0, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 14px", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,.04)" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 6, color: color || C.txt3 }}>{icon}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: color || C.txt1, letterSpacing: -1 }}>{value}</div>
      <div style={{ fontSize: 11, color: C.txt2, marginTop: 4, fontWeight: 600 }}>{label}</div>
    </div>
  );
}

// ── 키워드 막대 그래프 ────────────────────────────────────
function KeywordChart({ keywords }) {
  if (!keywords?.length) return null;
  const max = keywords[0].count;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      {keywords.map((kw, i) => (
        <div key={kw.word} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 20, fontSize: 11, fontWeight: 700, color: i < 3 ? C.accent : C.txt3, textAlign: "right", flexShrink: 0 }}>{i + 1}</span>
          <span style={{ width: 68, fontSize: 13, fontWeight: 700, color: C.txt1, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{kw.word}</span>
          <div style={{ flex: 1, background: "#F1F5F9", borderRadius: 4, height: 18, overflow: "hidden" }}>
            <div style={{
              width: `${(kw.count / max) * 100}%`,
              height: "100%",
              background: i === 0 ? C.accent : i < 3 ? "#60A5FA" : "#BFDBFE",
              borderRadius: 4,
              transition: "width .6s ease",
            }} />
          </div>
          <span style={{ width: 24, fontSize: 12, fontWeight: 700, color: C.txt2, textAlign: "right", flexShrink: 0 }}>{kw.count}</span>
          <div style={{ display: "flex", gap: 3, flexShrink: 0, flexWrap: "wrap", maxWidth: 100 }}>
            {kw.sources.slice(0, 3).map(s => {
              const key = Object.entries({경향신문:"khan",조선일보:"chosun",뉴스토마토:"newstomato",연합뉴스:"yonhap",뉴스핌:"newspim"}).find(([n]) => s.includes(n.slice(0,2)))?.[1];
              return (
                <span key={s} style={{ fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 4, background: key ? SOURCE_COLORS[key] + "22" : "#F1F5F9", color: key ? SOURCE_COLORS[key] : C.txt3 }}>
                  {key ? SOURCE_NAMES[key] : s.slice(0, 2)}
                </span>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── 크로스소스 이슈 ───────────────────────────────────────
function CrossSourceCard({ issue }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", background: "#FAFAFA" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ background: C.accent, color: "#fff", fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 20 }}>
          {issue.srcCount || issue.sources.length}개 언론사
        </span>
        <span style={{ fontSize: 14, fontWeight: 800, color: C.txt1 }}>{issue.keyword}</span>
        <span style={{ marginLeft: "auto", fontSize: 11, color: C.txt3 }}>{issue.count}건</span>
      </div>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: open ? 10 : 0 }}>
        {issue.sources.map(s => (
          <span key={s} style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: "#EFF6FF", color: C.accent }}>{s}</span>
        ))}
      </div>
      {open && (
        <div style={{ marginTop: 8, borderTop: `1px solid ${C.border}`, paddingTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
          {issue.articles.map((t, i) => (
            <div key={i} style={{ fontSize: 12, color: C.txt2, lineHeight: 1.5 }}>· {t}</div>
          ))}
        </div>
      )}
      <button onClick={() => setOpen(v => !v)} style={{ background: "none", border: "none", color: C.txt3, fontSize: 11, cursor: "pointer", padding: "4px 0 0", fontFamily: "inherit" }}>
        {open ? "▲ 접기" : "▼ 관련 기사 보기"}
      </button>
    </div>
  );
}

// ── 히트맵 ────────────────────────────────────────────────
function Heatmap({ data }) {
  if (!data) return null;
  const { sources, categories, matrix } = data;
  const maxVal = Math.max(...matrix.flat(), 1);

  return (
    <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
      <table style={{ borderCollapse: "collapse", fontSize: 11, minWidth: categories.length * 52 + 80 }}>
        <thead>
          <tr>
            <th style={{ padding: "4px 8px", textAlign: "left", color: C.txt3, fontWeight: 600, minWidth: 72 }}></th>
            {categories.map(cat => (
              <th key={cat} style={{ padding: "4px 6px", color: C.txt2, fontWeight: 700, textAlign: "center", whiteSpace: "nowrap", minWidth: 48 }}>{cat}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sources.map((src, si) => (
            <tr key={src}>
              <td style={{ padding: "5px 8px", fontWeight: 700, color: C.txt1, fontSize: 12, whiteSpace: "nowrap" }}>{src}</td>
              {categories.map((cat, ci) => {
                const val = matrix[si][ci];
                const intensity = val / maxVal;
                return (
                  <td key={cat} style={{
                    padding: "5px 6px", textAlign: "center",
                    background: val === 0 ? "#F8FAFC" : `rgba(37,99,235,${0.1 + intensity * 0.8})`,
                    color: intensity > 0.5 ? "#fff" : val === 0 ? C.txt3 : C.accent,
                    fontWeight: val > 0 ? 700 : 400,
                    borderRadius: 5,
                    fontSize: 12,
                    transition: "background .3s",
                  }}>
                    {val || "·"}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── 시간대 막대 ───────────────────────────────────────────
function HourlyChart({ data }) {
  if (!data) return null;
  const max = Math.max(...data.map(d => d.count), 1);
  const peak = data.reduce((p, c) => c.count > p.count ? c : p, data[0]);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 80 }}>
        {data.map(({ hour, count }) => {
          const isPeak = hour === peak.hour && count > 0;
          return (
            <div key={hour} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <div style={{
                width: "100%", borderRadius: "3px 3px 0 0",
                height: `${(count / max) * 72}px`,
                background: isPeak ? C.accent : count > 0 ? "#BFDBFE" : "#F1F5F9",
                minHeight: count > 0 ? 3 : 0,
                transition: "height .5s ease",
              }} title={`${hour}시: ${count}건`} />
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 3, marginTop: 4 }}>
        {data.map(({ hour, count }) => (
          <div key={hour} style={{ flex: 1, textAlign: "center", fontSize: 9, color: count > 0 ? C.txt3 : "#E2E8F0" }}>
            {hour % 6 === 0 ? `${hour}시` : ""}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 8, fontSize: 12, color: C.txt2 }}>
        📌 피크: <strong style={{ color: C.accent }}>{peak.hour}시</strong> ({peak.count}건)
      </div>
    </div>
  );
}

// ── AI 인사이트 ───────────────────────────────────────────
function AIInsight({ date }) {
  const [state, setState] = useState("idle"); // idle | loading | done | error
  const [text, setText] = useState("");

  const generate = async () => {
    setState("loading");
    try {
      const res = await fetch(`/api/insight/ai?date=${date}`);
      const data = await res.json();
      if (data.text) { setText(data.text); setState("done"); }
      else { setState("error"); }
    } catch { setState("error"); }
  };

  if (state === "idle") return (
    <div style={{ textAlign: "center", padding: "20px 0" }}>
      <div style={{ fontSize: 32, marginBottom: 10 }}>🤖</div>
      <p style={{ fontSize: 13, color: C.txt2, marginBottom: 16 }}>Claude AI가 오늘의 뉴스 흐름을 종합 분석합니다</p>
      <button onClick={generate} style={{ background: C.accent, color: "#fff", border: "none", padding: "11px 28px", borderRadius: 9, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
        AI 분석 생성
      </button>
    </div>
  );

  if (state === "loading") return (
    <div style={{ textAlign: "center", padding: "28px 0" }}>
      <div style={{ width: 32, height: 32, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.accent}`, borderRadius: "50%", margin: "0 auto 12px", animation: "spin 1s linear infinite" }} />
      <div style={{ fontSize: 13, color: C.txt2 }}>분석 중...</div>
    </div>
  );

  if (state === "error") return (
    <div style={{ textAlign: "center", padding: "20px 0", color: "#EF4444" }}>
      <div style={{ fontSize: 13 }}>분석 생성에 실패했습니다</div>
      <button onClick={generate} style={{ marginTop: 10, background: "none", border: `1px solid ${C.border}`, padding: "8px 18px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>다시 시도</button>
    </div>
  );

  return (
    <div>
      <div style={{ fontSize: 14, color: C.txt1, lineHeight: 1.9, whiteSpace: "pre-wrap" }}>{text}</div>
      <button onClick={() => { setState("idle"); setText(""); }} style={{ marginTop: 14, background: "none", border: `1px solid ${C.border}`, padding: "6px 14px", borderRadius: 7, cursor: "pointer", fontSize: 12, color: C.txt3, fontFamily: "inherit" }}>
        다시 생성
      </button>
    </div>
  );
}

// ── 메인 ─────────────────────────────────────────────────
export default function Insight() {
  const [date, setDate] = useState(todayStr());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isMobile = useIsMobile();

  const fetchInsight = async (d = date) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/insight?date=${d}`);
      if (res.status === 404) { setData(null); setError("해당 날짜의 수집 기사가 없습니다."); }
      else if (!res.ok) throw new Error((await res.json()).error);
      else setData(await res.json());
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  useEffect(() => { fetchInsight(); }, [date]);

  return (
    <div style={{ fontFamily: "'Apple SD Gothic Neo','Pretendard',system-ui,sans-serif", background: C.bg, minHeight: "100vh" }}>

      <Nav current="/insight" />

      <div style={{ maxWidth: 860, margin: "0 auto", padding: isMobile ? "14px 12px 60px" : "24px 16px 80px" }}>

        {/* 헤더 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: isMobile ? 18 : 22, fontWeight: 800, color: C.txt1 }}>인사이트 분석</h1>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: C.txt2 }}>수집 기사 기반 자동 분석 리포트</p>
          </div>
          <input type="date" value={date} max={todayStr()}
            onChange={e => setDate(e.target.value)}
            style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 11px", fontSize: 13, fontWeight: 600, fontFamily: "inherit", outline: "none", background: C.surface, color: C.txt1, minHeight: 40 }} />
        </div>

        {/* 로딩 */}
        {loading && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ width: 36, height: 36, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.accent}`, borderRadius: "50%", margin: "0 auto 14px", animation: "spin 1s linear infinite" }} />
            <div style={{ fontSize: 14, color: C.txt2 }}>분석 중...</div>
          </div>
        )}

        {/* 에러 */}
        {!loading && error && (
          <div style={{ textAlign: "center", padding: "60px 20px", background: C.surface, borderRadius: 14, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.txt1, marginBottom: 6 }}>{error}</div>
            <div style={{ fontSize: 13, color: C.txt2 }}>대시보드에서 기사를 먼저 수집해주세요</div>
            <a href="/dashboard" style={{ display: "inline-block", marginTop: 16, background: C.accent, color: "#fff", padding: "10px 22px", borderRadius: 8, fontWeight: 700, fontSize: 14, textDecoration: "none" }}>대시보드로 이동</a>
          </div>
        )}

        {/* 데이터 */}
        {!loading && data && (
          <>
            {/* 요약 카드 */}
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              <StatCard icon={<Newspaper size={22} strokeWidth={1.4} />} label="수집 기사" value={data.totalArticles} />
              <StatCard icon={<Building2 size={22} strokeWidth={1.4} />} label="언론사" value={data.totalSources} />
              <StatCard icon={<FolderOpen size={22} strokeWidth={1.4} />} label="카테고리" value={data.totalCategories} />
              <StatCard icon={<AlertCircle size={22} strokeWidth={1.4} />} label="단독·속보" value={data.breakingCount} color={data.breakingCount > 0 ? "#DC2626" : C.txt3} />
            </div>

            {/* AI 종합 분석 */}
            <Section title="🤖 AI 종합 분석" sub="Claude가 오늘의 뉴스 흐름을 종합 분석합니다">
              <AIInsight date={date} key={date} />
            </Section>

            {/* 키워드 빈도 */}
            <Section title="🔑 오늘의 키워드 TOP 20" sub="기사 제목에서 추출한 핵심 단어 빈도">
              <KeywordChart keywords={data.topKeywords} />
            </Section>

            {/* 크로스소스 이슈 */}
            {data.crossSourceIssues?.length > 0 && (
              <Section title="🔗 이슈 집중도" sub="3개 이상 언론사가 동시에 보도한 핵심 이슈">
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {data.crossSourceIssues.map((issue, i) => (
                    <CrossSourceCard key={i} issue={issue} />
                  ))}
                </div>
              </Section>
            )}

            {/* 언론사 × 카테고리 히트맵 */}
            <Section title="🗺️ 언론사별 보도 분포" sub="언론사가 어떤 분야에 집중하는지 한눈에">
              <Heatmap data={data.sourceCatMatrix} />
            </Section>

            {/* 시간대별 발행 패턴 */}
            <Section title="⏰ 시간대별 발행 패턴 (KST)" sub="기사가 가장 많이 쏟아지는 시간대">
              <HourlyChart data={data.hourlyDist} />
            </Section>

            {/* 언론사별 통계 */}
            <Section title="📊 언론사별 통계" sub="수집 기사 수 및 속보 비율">
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {data.sourceStats.map(s => {
                  const breakRatio = s.total > 0 ? Math.round((s.breaking / s.total) * 100) : 0;
                  const color = SOURCE_COLORS[s.key] || C.accent;
                  return (
                    <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "#FAFAFA", borderRadius: 9, border: `1px solid ${C.border}` }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: C.txt1, minWidth: 72 }}>{s.name}</span>
                      <div style={{ flex: 1, background: "#F1F5F9", borderRadius: 4, height: 16, overflow: "hidden" }}>
                        <div style={{ width: `${(s.total / data.sourceStats[0].total) * 100}%`, height: "100%", background: color, borderRadius: 4 }} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.txt1, minWidth: 32, textAlign: "right" }}>{s.total}건</span>
                      {s.breaking > 0 && (
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#DC2626", background: "#FEF2F2", padding: "2px 7px", borderRadius: 6, flexShrink: 0 }}>
                          속보 {breakRatio}%
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </Section>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 4px; }
        input[type="date"]::-webkit-calendar-picker-indicator { opacity: .5; }
      `}</style>
    </div>
  );
}
