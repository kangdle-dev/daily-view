import { useState, useEffect } from "react";
import { Printer } from "lucide-react";
import Nav from "./Nav.jsx";

const C = {
  bg: "#F0FDF8", surface: "#FFFFFF", border: "#E2E8F0",
  txt1: "#0F172A", txt2: "#475569", txt3: "#94A3B8",
  accent: "#0D9488", breaking: "#DC2626", nav: "#1E293B",
  gold: "#D97706", teal: "#14B8A6", navy: "#134E4A",
  good: "#16A34A", bad: "#DC2626", neutral: "#2563EB",
};





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

// ── AI 기사 제안 탭 ──────────────────────────────────────────
// ── 기사 초안 모달 ───────────────────────────────────────────
function DraftModal({ title, category, onClose }) {
  const [draft, setDraft]     = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied]   = useState(false);
  const [error, setError]     = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/newspim/draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, category }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setDraft(data.draft);
      } catch (e) { setError(e.message); }
      setLoading(false);
    })();
  }, []);

  const copy = () => {
    navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.55)",
      zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: "#fff", borderRadius: 12, width: "100%", maxWidth: 640,
        maxHeight: "85vh", display: "flex", flexDirection: "column",
        boxShadow: "0 20px 60px rgba(0,0,0,.3)",
      }}>
        {/* 헤더 */}
        <div style={{
          padding: "14px 18px", borderBottom: `1px solid ${C.border}`,
          display: "flex", alignItems: "flex-start", gap: 10,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, color: C.accent, fontWeight: 700, marginBottom: 4 }}>
              ✍️ AI 기사 초안 — {category}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.txt1, lineHeight: 1.5 }}>
              {title}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", fontSize: 20,
            color: C.txt3, cursor: "pointer", flexShrink: 0, lineHeight: 1,
          }}>✕</button>
        </div>

        {/* 본문 */}
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 18px" }}>
          {loading && (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{
                width: 32, height: 32, border: `3px solid ${C.border}`,
                borderTop: `3px solid ${C.accent}`, borderRadius: "50%",
                margin: "0 auto 12px", animation: "spin 1s linear infinite",
              }} />
              <div style={{ fontSize: 13, color: C.txt2 }}>초안 생성 중...</div>
            </div>
          )}
          {error && <div style={{ fontSize: 13, color: "#DC2626", padding: "20px 0" }}>❌ {error}</div>}
          {draft && (
            <div style={{
              fontSize: 13, color: C.txt1, lineHeight: 1.9,
              whiteSpace: "pre-wrap", wordBreak: "break-word",
            }}>{draft}</div>
          )}
        </div>

        {/* 푸터 */}
        {draft && (
          <div style={{
            padding: "12px 18px", borderTop: `1px solid ${C.border}`,
            display: "flex", gap: 8,
          }}>
            <button onClick={copy} style={{
              flex: 1, padding: "10px", background: copied ? "#22C55E" : C.accent,
              color: "#fff", border: "none", borderRadius: 8,
              fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "background .3s",
            }}>
              {copied ? "✅ 복사됨" : "📋 전체 복사"}
            </button>
            <button onClick={onClose} style={{
              padding: "10px 20px", background: "#F1F5F9", color: C.txt2,
              border: "none", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer",
            }}>닫기</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── 방법론 섹션 래퍼 ────────────────────────────────────────
function MSection({ step, title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        {step && (
          <span style={{
            background: C.navy, color: "#FFD600", fontWeight: 900,
            fontSize: 12, width: 26, height: 26, borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>{step}</span>
        )}
        <span style={{ fontSize: 14, fontWeight: 800, color: C.txt1 }}>{title}</span>
      </div>
      <div style={{ paddingLeft: step ? 36 : 0 }}>{children}</div>
    </div>
  );
}

function MBox({ children, color = C.border, bg = "#F8FAFC" }) {
  return (
    <div style={{
      background: bg, border: `1px solid ${color}`,
      borderRadius: 8, padding: "12px 14px", fontSize: 13,
      color: C.txt2, lineHeight: 1.8,
    }}>{children}</div>
  );
}

function MTag({ children, color = C.accent }) {
  return (
    <code style={{
      background: "#EFF6FF", color, fontFamily: "monospace",
      fontSize: 12, fontWeight: 700, padding: "1px 6px",
      borderRadius: 4, whiteSpace: "nowrap",
    }}>{children}</code>
  );
}

function MethodologyTab() {
  return (
    <div style={{ maxWidth: 720 }}>

      {/* 헤더 */}
      <div style={{
        background: C.navy, color: "#fff", borderRadius: 10,
        padding: "16px 20px", marginBottom: 20,
      }}>
        <div style={{ fontSize: 10, color: "#6EE7B7", fontWeight: 700, letterSpacing: 2, marginBottom: 6 }}>
          DOCUMENTATION
        </div>
        <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 6 }}>
          AI 기사 발제 생성 방법론
        </div>
        <div style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.7 }}>
          뉴스핌이 다루지 못한 기사를 자동으로 분석하고,<br />
          전문기자 역할 기반의 AI가 발제 제목을 생성하는 과정을 설명합니다.
        </div>
      </div>

      {/* 전체 흐름 */}
      <MSection step={null} title="⚡ 전체 처리 흐름">
        <div style={{
          display: "flex", alignItems: "center", gap: 4,
          flexWrap: "wrap", marginBottom: 4,
        }}>
          {[
            "기사 수집", "뉴스핌/타사 분리", "카테고리 정규화",
            "미보도 분류", "우선순위 선정", "AI 발제 생성",
          ].map((step, i, arr) => (
            <span key={step} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{
                background: "#EFF6FF", color: C.accent,
                padding: "5px 10px", borderRadius: 6,
                fontSize: 12, fontWeight: 700,
              }}>{step}</span>
              {i < arr.length - 1 && (
                <span style={{ color: C.txt3, fontSize: 14 }}>→</span>
              )}
            </span>
          ))}
        </div>
      </MSection>

      <div style={{ height: 1, background: C.border, marginBottom: 20 }} />

      {/* STEP 1 */}
      <MSection step="1" title="기사 수집 및 분리">
        <MBox>
          매일 수집된 전체 기사를 <MTag>source === "newspim"</MTag> 기준으로
          뉴스핌 기사와 타사 기사로 분리합니다.<br />
          <span style={{ fontSize: 12, color: C.txt3 }}>
            예) 오늘 전체 4,299건 → 뉴스핌 189건 / 타사 4,110건
          </span>
        </MBox>
      </MSection>

      {/* STEP 2 */}
      <MSection step="2" title="카테고리 정규화">
        <MBox>
          언론사마다 카테고리 표기가 달라 대분류로 통합합니다.
          <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
            {[
              ["금융 · 마켓", "→", "증권·금융"],
              ["세계 · 글로벌", "→", "국제"],
              ["연예", "→", "문화"],
            ].map(([from, arrow, to]) => (
              <span key={from} style={{
                background: "#fff", border: `1px solid ${C.border}`,
                borderRadius: 6, padding: "4px 10px", fontSize: 12,
                display: "flex", gap: 6, alignItems: "center",
              }}>
                <span style={{ color: C.txt3 }}>{from}</span>
                <span style={{ color: C.accent }}>{arrow}</span>
                <span style={{ fontWeight: 700, color: C.txt1 }}>{to}</span>
              </span>
            ))}
          </div>
        </MBox>
      </MSection>

      {/* STEP 3 */}
      <MSection step="3" title="미보도 기사 분류">
        <MBox>
          타사 기사 제목에서 <strong>3자 이상의 핵심 단어</strong>를 추출해,
          뉴스핌 기사 제목에 해당 단어가 없으면 <MTag color="#DC2626">미보도</MTag>로 분류합니다.
          <div style={{ marginTop: 10, background: "#FEF2F2", borderRadius: 6, padding: "8px 12px", fontSize: 12, color: "#991B1B" }}>
            예) 타사: "한동훈 의원직 사퇴설 부상"<br />
            → 핵심 단어 추출: ["한동훈", "의원직", "사퇴설"]<br />
            → 뉴스핌 기사에 위 단어 포함 없음 → 미보도 처리
          </div>
        </MBox>
      </MSection>

      {/* STEP 4 */}
      <MSection step="4" title="분석 대상 카테고리 우선순위 선정">
        <MBox>
          뉴스핌 보도 공백이 큰 카테고리를 우선 분석합니다.
          <div style={{ marginTop: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.txt1, fontWeight: 700, marginBottom: 6 }}>
              우선순위 점수
              <span style={{
                background: "#EFF6FF", color: C.accent,
                fontFamily: "monospace", padding: "2px 8px", borderRadius: 4, fontWeight: 700,
              }}>= (100 − 점유율%) + 미보도 기사 수</span>
            </div>
            <div style={{ fontSize: 12, color: C.txt3 }}>
              점유율이 낮고 미보도 기사가 많을수록 먼저 발제 생성 대상이 됩니다.<br />
              최대 7개 카테고리, 카테고리당 기사 3건 이상인 경우만 선정
            </div>
          </div>
        </MBox>
      </MSection>

      {/* STEP 5 */}
      <MSection step="5" title="전문기자 역할 기반 AI 생성">
        <MBox>
          카테고리별로 <strong>별도의 AI 호출</strong>을 병렬로 실행합니다.
          각 호출마다 해당 분야 전문기자 역할을 부여합니다.
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              ["정치", "정치전문기자", "정치권 동향, 정책, 선거, 여야 관계"],
              ["경제", "경제전문기자", "거시경제, 재정·금융정책, 기업경영"],
              ["사회", "사회부기자", "사건·사고, 민생, 법원, 복지"],
              ["국제", "국제부기자", "해외 정치·경제, 글로벌 이슈"],
              ["산업", "산업부기자", "제조업, 유통, IT, 에너지"],
              ["증권·금융", "증권·금융전문기자", "주식, 채권, 외환, 은행, 핀테크"],
              ["부동산", "부동산전문기자", "아파트, 분양, 상업용 부동산"],
            ].map(([cat, role, focus]) => (
              <div key={cat} style={{
                display: "flex", gap: 8, alignItems: "flex-start",
                padding: "6px 0", borderBottom: `1px solid ${C.border}`,
                fontSize: 12,
              }}>
                <span style={{
                  background: C.navy, color: "#FFD600",
                  padding: "2px 8px", borderRadius: 4, fontWeight: 700,
                  flexShrink: 0, minWidth: 60, textAlign: "center",
                }}>{cat}</span>
                <span style={{ color: C.accent, fontWeight: 700, flexShrink: 0, minWidth: 110 }}>{role}</span>
                <span style={{ color: C.txt3 }}>{focus}</span>
              </div>
            ))}
          </div>
        </MBox>
      </MSection>

      {/* STEP 6 */}
      <MSection step="6" title="Few-shot 프롬프팅 (스타일 학습)">
        <MBox>
          AI에게 <strong>당일 실제 뉴스핌 기사 제목 5개</strong>를 예시로 제공합니다.
          고정된 예시가 아닌 그날 실제 기사를 무작위 샘플링하므로,
          날짜가 달라져도 항상 최신 뉴스핌 문체를 반영합니다.
          <div style={{ marginTop: 10, background: "#F0FDF4", borderRadius: 6, padding: "8px 12px", fontSize: 12, color: "#15803D", lineHeight: 1.8 }}>
            <strong>효과:</strong> 구체적인 수치·기업명·인물명 자동 반영<br />
            <strong>예시 없을 때:</strong> "[분석] 금리 동결 배경 분석"<br />
            <strong>예시 있을 때:</strong> "[분석] SK하이닉스 153억 자사주 처분, 임원 보수 지급의 신호탄…'주가 방어' vs '주주 환원' 줄타기"
          </div>
        </MBox>
      </MSection>

      {/* 한계 및 유의사항 */}
      <MSection step={null} title="⚠️ 유의사항">
        <MBox color="#FECACA" bg="#FEF2F2">
          <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "#991B1B" }}>
            <div>• 키워드 매칭 기반 미보도 분류이므로 완벽하지 않습니다. 유사한 내용이지만 표현이 다른 기사는 미보도로 오분류될 수 있습니다.</div>
            <div>• AI가 생성한 발제는 취재 전 아이디어 수준입니다. 실제 사실 확인 및 취재 가능 여부는 기자가 판단해야 합니다.</div>
            <div>• 뉴스핌 내부 편집 방침, 광고주 관계, 독점 취재 여부 등은 반영되지 않습니다.</div>
          </div>
        </MBox>
      </MSection>

      <div style={{ textAlign: "center", fontSize: 10, color: C.txt3, paddingTop: 8 }}>
        Daily View · AI 기사 발제 생성 시스템 · Claude Haiku 기반
      </div>
    </div>
  );
}

function SuggestionsTab({ date }) {
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [generated, setGenerated] = useState(false);
  const [draftTarget, setDraftTarget] = useState(null); // { title, category }

  const generate = async () => {
    setLoading(true); setError(""); setData(null);
    try {
      const res = await fetch(`/api/newspim/suggestions?date=${date}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData(json);
      setGenerated(true);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  // 날짜 변경 시 초기화
  useEffect(() => { setData(null); setGenerated(false); setError(""); }, [date]);

  if (!generated && !loading) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>✍️</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.txt1, marginBottom: 8 }}>
          AI 기사 제목 생성
        </div>
        <div style={{ fontSize: 13, color: C.txt2, marginBottom: 24, lineHeight: 1.7 }}>
          뉴스핌이 다루지 못했거나 부족하게 다룬 분야를 분석하여<br />
          카테고리별로 기사 제목 10개씩 제안합니다.
        </div>
        <button onClick={generate} style={{
          background: C.accent, color: "#fff", border: "none",
          padding: "12px 28px", borderRadius: 8, fontWeight: 700,
          fontSize: 14, cursor: "pointer",
        }}>
          AI 기사 제목 생성하기
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "80px 0" }}>
        <div style={{ width: 36, height: 36, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.accent}`, borderRadius: "50%", margin: "0 auto 14px", animation: "spin 1s linear infinite" }} />
        <div style={{ fontSize: 14, color: C.txt2 }}>AI가 기사 제목을 생성 중입니다...</div>
        <div style={{ fontSize: 12, color: C.txt3, marginTop: 6 }}>카테고리별 분석 후 제목을 생성합니다 (10~20초 소요)</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: 13, color: C.bad, marginBottom: 16 }}>❌ {error}</div>
        <button onClick={generate} style={{
          background: C.accent, color: "#fff", border: "none",
          padding: "10px 22px", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer",
        }}>다시 시도</button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div>
      {/* 요약 헤더 */}
      <div style={{
        background: "#F0FDF4", border: "1px solid #BBF7D0",
        borderRadius: 10, padding: "12px 16px", marginBottom: 16,
        display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap",
      }}>
        <div style={{ fontSize: 12, color: "#15803D", fontWeight: 600 }}>
          📅 {date} 기준 &nbsp;·&nbsp; 뉴스핌 수집 {data.newspimTotal}건 &nbsp;·&nbsp; {data.categories.length}개 카테고리 분석
        </div>
        <button onClick={generate} style={{
          marginLeft: "auto", background: "transparent", border: `1px solid #16A34A`,
          color: "#16A34A", padding: "5px 12px", borderRadius: 6,
          fontWeight: 700, fontSize: 12, cursor: "pointer",
        }}>↺ 재생성</button>
      </div>

      {/* 분석 컨텍스트 */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.txt2, marginBottom: 8 }}>📊 분석 대상 카테고리</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {data.categories.map(c => (
            <span key={c.category} style={{
              background: c.context?.share < 20 ? "#FEF2F2" : "#F0F9FF",
              border: `1px solid ${c.context?.share < 20 ? "#FECACA" : "#BAE6FD"}`,
              color: c.context?.share < 20 ? "#DC2626" : "#0369A1",
              padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
            }}>
              {c.category}
              {c.role && <span style={{ opacity: 0.6, fontSize: 10 }}> · {c.role}</span>}
              <span style={{ opacity: 0.7 }}> {c.context?.share}%</span>
            </span>
          ))}
        </div>
      </div>

      {/* 카테고리별 기사 제목 */}
      {data.categories.map(cat => (
        <div key={cat.category} style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 10, marginBottom: 12, overflow: "hidden",
        }}>
          <div style={{
            background: C.navy, padding: "8px 14px",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <div style={{ width: 3, height: 13, background: "#FFD600", borderRadius: 2, flexShrink: 0 }} />
            <span style={{ color: "#fff", fontWeight: 800, fontSize: 13 }}>{cat.category}</span>
            {cat.role && (
              <span style={{
                background: "rgba(255,255,255,.12)", color: "#6EE7B7",
                fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4,
              }}>{cat.role}</span>
            )}
            {cat.context && (
              <span style={{ color: "rgba(255,255,255,.35)", fontSize: 10, marginLeft: 2 }}>
                점유 {cat.context.share}%
              </span>
            )}
            <span style={{ color: "rgba(255,255,255,.4)", fontSize: 11, marginLeft: "auto" }}>
              {cat.articles.length}건
            </span>
          </div>
          <div style={{ padding: "10px 14px" }}>
            {cat.articles.map((title, i) => (
              <div key={i} style={{
                display: "flex", gap: 10, alignItems: "center",
                padding: "7px 0",
                borderBottom: i < cat.articles.length - 1 ? `1px solid ${C.border}` : "none",
              }}>
                <span style={{
                  flexShrink: 0, fontSize: 11, fontWeight: 800,
                  color: C.accent, minWidth: 18, textAlign: "center",
                }}>{i + 1}</span>
                <span style={{ flex: 1, fontSize: 13, color: C.txt1, lineHeight: 1.6, fontWeight: 500 }}>{title}</span>
                <button
                  onClick={() => setDraftTarget({ title, category: cat.category })}
                  style={{
                    flexShrink: 0, padding: "3px 10px",
                    background: "#F1F5F9", border: `1px solid ${C.border}`,
                    borderRadius: 5, fontSize: 11, fontWeight: 700,
                    color: C.txt2, cursor: "pointer", whiteSpace: "nowrap",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = C.accent; e.currentTarget.style.color = "#fff"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#F1F5F9"; e.currentTarget.style.color = C.txt2; }}
                >초안 작성</button>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div style={{ textAlign: "center", fontSize: 10, color: C.txt3, paddingTop: 4 }}>
        AI 생성 기사 제목 &nbsp;·&nbsp; {new Date(data.generatedAt).toLocaleTimeString("ko-KR")} 생성
      </div>

      {draftTarget && (
        <DraftModal
          title={draftTarget.title}
          category={draftTarget.category}
          onClose={() => setDraftTarget(null)}
        />
      )}
    </div>
  );
}

export default function NewspimAnalysis() {
  const [date, setDate]       = useState(todayStr());
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [activeTab, setActiveTab] = useState("analysis");
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
      <div className="no-print"><Nav current="/newspim" /></div>
      <div className="no-print" style={{ background: C.nav, display: "flex", alignItems: "center", padding: "8px 14px", gap: 8, justifyContent: "flex-end" }}>
        <input type="date" value={date} max={todayStr()} onChange={e => setDate(e.target.value)}
          style={{ border: "1px solid #334155", borderRadius: 7, padding: "6px 10px", fontSize: 12, fontWeight: 600, fontFamily: "inherit", outline: "none", background: "#293548", color: "#F1F5F9", minHeight: 36 }} />
        <button onClick={() => window.print()}
          style={{ background: "#FFD600", color: "#111", border: "none", padding: "7px 14px", borderRadius: 7, fontWeight: 800, fontSize: 12, cursor: "pointer" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Printer size={13} strokeWidth={2} /> 인쇄</span>
        </button>
      </div>

      {/* ── 탭 메뉴 ── */}
      <div className="no-print" style={{ background: "#1E293B", borderBottom: "1px solid #334155" }}>
        <div style={{ maxWidth: 820, margin: "0 auto", padding: "0 20px", display: "flex" }}>
          {[
            { id: "analysis", label: "📊 분석" },
            { id: "suggestions", label: "✍️ AI 기사 생성" },
            { id: "methodology", label: "📖 기사생성방법론" },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              padding: "10px 18px", background: "transparent", border: "none",
              borderBottom: activeTab === tab.id ? "2px solid #14B8A6" : "2px solid transparent",
              color: activeTab === tab.id ? "#14B8A6" : "#94A3B8",
              fontWeight: activeTab === tab.id ? 800 : 600,
              fontSize: 13, cursor: "pointer", transition: "all .2s",
            }}>{tab.label}</button>
          ))}
        </div>
      </div>

      {/* ── 콘텐츠 ── */}
      <div id="print-area" style={{ maxWidth: 820, margin: "0 auto", padding: isMobile ? "14px 12px 60px" : "20px 20px 60px" }}>

        {/* AI 기사 생성 탭 */}
        {activeTab === "suggestions" && <SuggestionsTab date={date} />}

        {/* 기사생성방법론 탭 */}
        {activeTab === "methodology" && <MethodologyTab />}

        {/* 분석 탭 */}
        {activeTab === "analysis" && loading && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ width: 36, height: 36, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.accent}`, borderRadius: "50%", margin: "0 auto 14px", animation: "spin 1s linear infinite" }} />
            <div style={{ fontSize: 14, color: C.txt2 }}>분석 데이터 불러오는 중...</div>
          </div>
        )}

        {activeTab === "analysis" && !loading && error && (
          <div style={{ textAlign: "center", padding: "60px 20px", background: C.surface, borderRadius: 14, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
            <div style={{ fontWeight: 700, fontSize: 15, color: C.txt1, marginBottom: 8 }}>{error}</div>
            <a href="/dashboard" style={{ background: C.accent, color: "#fff", padding: "10px 22px", borderRadius: 8, fontWeight: 700, fontSize: 14, textDecoration: "none" }}>대시보드로 이동 →</a>
          </div>
        )}

        {activeTab === "analysis" && !loading && !error && insight && !analysis && (
          <div style={{ textAlign: "center", padding: "60px 20px", background: C.surface, borderRadius: 14, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontWeight: 700, fontSize: 15, color: C.txt1, marginBottom: 8 }}>뉴스핌 수집 데이터가 없습니다</div>
            <div style={{ fontSize: 13, color: C.txt2 }}>대시보드에서 뉴스핌 기사를 먼저 수집해주세요</div>
          </div>
        )}

        {activeTab === "analysis" && !loading && !error && analysis && (
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
