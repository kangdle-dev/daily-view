import { useState, useEffect } from "react";
import Nav from "./Nav.jsx";

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

const TABS = [
  { id: "comprehensive", label: "종합뉴스리포트" },
  { id: "telegram", label: "텔레그램리포트" },
  { id: "tracking", label: "이슈트래킹" },
  { id: "jaeming", label: "이재명" },
  { id: "gwangjae", label: "이광재" },
  { id: "trump", label: "트럼프" },
];

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

function TopArticleCard({ article, rank, isMobile }) {
  const rankColors = ["#D97706", "#64748B", "#B45309"];
  const isTop3 = rank <= 3;
  const leftColor = article.isBreaking ? C.breaking : isTop3 ? rankColors[rank - 1] : C.border;

  return (
    <a href={article.url} target="_blank" rel="noreferrer" style={{ textDecoration: "none", display: "block" }}>
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
            <div style={{
              fontSize: isMobile ? 14 : 15,
              fontWeight: 800, color: C.txt1, lineHeight: 1.55, marginBottom: 6,
            }}>
              {article.title}
            </div>
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

function CatArticleRow({ article, rank, isMobile }) {
  return (
    <a href={article.url} target="_blank" rel="noreferrer" style={{ textDecoration: "none", display: "block" }}>
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
          <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 700, color: C.txt1, lineHeight: 1.5, marginBottom: 4 }}>
            {article.title}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
            <SourceList sources={article.sources} />
            <span style={{ fontSize: 11, color: C.txt3, flexShrink: 0 }}>{relTime(article.publishedAt)}</span>
          </div>
        </div>
      </div>
    </a>
  );
}

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
          minHeight: 48,
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

// HTML 태그 제거 후 링크는 텍스트만 남기는 파서
function parseHtmlPreview(html) {
  return html
    .replace(/<b>(.*?)<\/b>/g, (_, t) => `**${t}**`)
    .replace(/<a href="([^"]+)">([^<]+)<\/a>/g, (_, href, text) => ({ text, href }))
    .split("\n");
}

function TelegramPreviewBubble({ rawMessage }) {
  const lines = rawMessage.split("\n");
  return (
    <div style={{
      background: "#EFFDDE", border: "1px solid #C8E6C9",
      borderRadius: "12px 12px 4px 12px",
      padding: "12px 14px", fontSize: 13, lineHeight: 1.7,
      fontFamily: "'Apple SD Gothic Neo','Pretendard',system-ui,sans-serif",
      maxHeight: 420, overflowY: "auto",
    }}>
      {lines.map((line, i) => {
        if (!line) return <div key={i} style={{ height: 6 }} />;
        // <b>텍스트</b>
        const boldMatch = line.match(/^<b>(.*)<\/b>$/);
        if (boldMatch) return <div key={i} style={{ fontWeight: 800, color: "#0F172A", marginTop: 4 }}>{boldMatch[1]}</div>;
        // 링크 포함 줄
        const linkRe = /<a href="([^"]+)">([^<]+)<\/a>/g;
        if (linkRe.test(line)) {
          const parts = [];
          let last = 0; linkRe.lastIndex = 0;
          let m;
          while ((m = linkRe.exec(line)) !== null) {
            if (m.index > last) parts.push(<span key={last}>{line.slice(last, m.index)}</span>);
            parts.push(<a key={m.index} href={m[1]} target="_blank" rel="noopener noreferrer"
              style={{ color: "#1D4ED8", fontWeight: 600, textDecoration: "none" }}>{m[2]}</a>);
            last = m.index + m[0].length;
          }
          if (last < line.length) parts.push(<span key={last}>{line.slice(last)}</span>);
          return <div key={i}>{parts}</div>;
        }
        return <div key={i} style={{ color: "#334155" }}>{line}</div>;
      })}
    </div>
  );
}

function TelegramReport({ report, date }) {
  const [preview,  setPreview]  = useState(null);   // null | string
  const [loading,  setLoading]  = useState(false);
  const [sending,  setSending]  = useState(false);
  const [sent,     setSent]     = useState(false);
  const [error,    setError]    = useState("");

  if (!report) return null;

  // 미리보기 로드
  const loadPreview = async () => {
    setLoading(true); setError(""); setPreview(null); setSent(false);
    try {
      const res = await fetch("/api/telegram/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, report }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "미리보기 실패");
      setPreview(data.message);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  // 실제 발송
  const handleSend = async () => {
    if (!preview) return;
    setSending(true); setError("");
    try {
      const res = await fetch("/api/telegram/send-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, report }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "발송 실패");
      setSent(true);
      setPreview(null);
    } catch (err) { setError(err.message); }
    finally { setSending(false); }
  };

  return (
    <div>
      {/* 안내 */}
      <div style={{ background: "#F0F9FF", border: "1px solid #BAE6FD", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#0369A1" }}>
        미리보기를 확인한 후 발송하세요. 실제 텔레그램 채널에 전송되는 메시지입니다.
      </div>

      {/* 미리보기 버튼 */}
      {!preview && !sent && (
        <button onClick={loadPreview} disabled={loading}
          style={{
            width: "100%", padding: "11px", background: "#F1F5F9",
            border: `1px solid ${C.border}`, borderRadius: 8,
            fontWeight: 700, fontSize: 14, cursor: loading ? "not-allowed" : "pointer",
            color: C.txt1, marginBottom: 14, opacity: loading ? 0.7 : 1,
          }}>
          {loading ? "미리보기 생성 중..." : "👁 메시지 미리보기"}
        </button>
      )}

      {/* 미리보기 패널 */}
      {preview && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.txt2 }}>📱 텔레그램 메시지 미리보기</span>
            <button onClick={() => setPreview(null)}
              style={{ background: "none", border: "none", color: C.txt3, fontSize: 12, cursor: "pointer" }}>
              닫기
            </button>
          </div>
          <TelegramPreviewBubble rawMessage={preview} />
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button onClick={() => setPreview(null)}
              style={{ flex: 1, padding: "10px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer", color: C.txt2 }}>
              취소
            </button>
            <button onClick={handleSend} disabled={sending}
              style={{
                flex: 2, padding: "10px", background: C.accent,
                border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13,
                cursor: sending ? "not-allowed" : "pointer", color: "#fff",
                opacity: sending ? 0.7 : 1,
              }}>
              {sending ? "발송 중..." : "📱 이대로 발송"}
            </button>
          </div>
        </div>
      )}

      {/* 발송 완료 */}
      {sent && (
        <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 8, padding: "14px", textAlign: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 20, marginBottom: 4 }}>✅</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#15803D" }}>텔레그램 채널에 발송되었습니다</div>
          <button onClick={() => setSent(false)} style={{ marginTop: 8, background: "none", border: `1px solid ${C.border}`, padding: "5px 14px", borderRadius: 6, fontSize: 12, cursor: "pointer", color: C.txt3 }}>
            다시 발송
          </button>
        </div>
      )}

      {/* 오류 */}
      {error && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#DC2626", marginBottom: 14 }}>
          ❌ {error}
        </div>
      )}

      {/* 기사 목록 (참고용) */}
      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.txt3, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>포함 기사 목록</div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.txt1, marginBottom: 8 }}>📰 종합 주요기사</div>
          {report.top10.slice(0, 5).map((a, i) => (
            <a key={i} href={a.url} target="_blank" rel="noopener noreferrer" style={{ display: "block", textDecoration: "none", padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 12, color: C.accent, fontWeight: 600 }}>{i + 1}. {a.title}</span>
            </a>
          ))}
        </div>
        {["정치", "경제", "사회", "국제", "증권·금융"].filter(c => report.categories[c]).map(cat => (
          <div key={cat} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.txt1, marginBottom: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: CAT_COLORS[cat]?.dot || "#64748B", display: "inline-block", marginRight: 6 }} />
              {cat}
            </div>
            {(report.categories[cat] || []).slice(0, 3).map((a, i) => (
              <a key={i} href={a.url} target="_blank" rel="noopener noreferrer" style={{ display: "block", textDecoration: "none", padding: "4px 0 4px 12px", fontSize: 12, color: C.txt2 }}>
                {i + 1}. {a.title}
              </a>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function GwangjaeReport({ report, date, insight }) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    console.log("이광재 리포트 텔레그램 발송 시도", { date, report });
    setSending(true);
    try {
      const res = await fetch("/api/telegram/send-gwangjae-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, report })
      });
      if (!res.ok) throw new Error("발송 실패");
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    } catch (err) {
      alert("❌ " + err.message);
    } finally {
      setSending(false);
    }
  };

  if (!report) return null;

  return (
    <div>
      <div style={{ marginBottom: 20, display: "flex", gap: 8 }}>
        <button onClick={handleSend} disabled={sending}
          style={{
            flex: 1, padding: "12px 16px", background: sent ? "#22C55E" : C.accent,
            color: "#fff", border: "none", borderRadius: 8, fontWeight: 700,
            fontSize: 14, cursor: sending ? "not-allowed" : "pointer",
            opacity: sending ? 0.7 : 1, transition: "all .3s",
          }}>
          {sending ? "발송 중..." : sent ? "✅ 발송완료" : "📱 텔레그램으로 발송"}
        </button>
      </div>

      <div style={{ marginBottom: 28 }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: C.txt1, marginBottom: 12 }}>
          📰 이광재 관련 기사 ({report.totalArticles}건)
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {report.top15.map((a, i) => (
            <a key={i} href={a.url} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "none" }}>
              <div style={{
                padding: "12px", background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: 8, cursor: "pointer",
                transition: "box-shadow .2s",
              }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,.08)"}
                onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
              >
                <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <span style={{
                    flexShrink: 0, fontSize: 13, fontWeight: 700, color: C.accent, minWidth: 20, textAlign: "center"
                  }}>
                    {i + 1}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.txt1, lineHeight: 1.5, marginBottom: 4 }}>
                      {a.title}
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 11, color: C.txt3 }}>
                      <span>{a.sourceName}</span>
                      <span>·</span>
                      <span>{relTime(a.publishedAt)}</span>
                      {a.isBreaking && (
                        <>
                          <span>·</span>
                          <span style={{ background: C.breaking, color: "#fff", padding: "1px 5px", borderRadius: 3, fontWeight: 700 }}>속보</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 28 }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: C.txt1, marginBottom: 12 }}>🔑 관련 키워드</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {report.relatedKeywords.map((k, i) => (
            <span key={i} style={{
              background: C.surface, border: `1px solid ${C.border}`,
              padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600,
              color: C.txt2, display: "inline-flex", alignItems: "center", gap: 4
            }}>
              {k.word}
              <span style={{ color: C.accent, fontWeight: 700 }}>{k.count}</span>
            </span>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 28 }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: C.txt1, marginBottom: 12 }}>📊 언론사별 보도</h3>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {report.sourceStats.map(s => (
            <span key={s.name} style={{
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 8, padding: "8px 12px", fontSize: 12, fontWeight: 600, color: C.txt2,
            }}>
              {s.name} <span style={{ color: C.accent, fontWeight: 700 }}>{s.count}</span>
            </span>
          ))}
        </div>
      </div>

      {insight && (
        <>
          <div style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: C.txt1, marginBottom: 12 }}>💡 여론 분석</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <div style={{
                background: "#F0FDF4", border: "1px solid #86EFAC",
                borderRadius: 10, padding: "14px", textAlign: "center"
              }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#15803D" }}>
                  {insight.sentimentSummary.positive}%
                </div>
                <div style={{ fontSize: 11, color: "#15803D", fontWeight: 600, marginTop: 4 }}>긍정</div>
              </div>
              <div style={{
                background: "#F8FAFC", border: "1px solid #CBD5E1",
                borderRadius: 10, padding: "14px", textAlign: "center"
              }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#334155" }}>
                  {insight.sentimentSummary.neutral}%
                </div>
                <div style={{ fontSize: 11, color: "#334155", fontWeight: 600, marginTop: 4 }}>중립</div>
              </div>
              <div style={{
                background: "#FEF2F2", border: "1px solid #FECACA",
                borderRadius: 10, padding: "14px", textAlign: "center"
              }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#DC2626" }}>
                  {insight.sentimentSummary.negative}%
                </div>
                <div style={{ fontSize: 11, color: "#DC2626", fontWeight: 600, marginTop: 4 }}>부정</div>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: C.txt1, marginBottom: 12 }}>🎯 핵심 이슈</h3>
            <div style={{
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 10, padding: "14px", fontSize: 13, lineHeight: 1.7,
              color: C.txt2, whiteSpace: "pre-wrap"
            }}>
              {insight.aiInsight}
            </div>
          </div>

          {insight.sourceAnalysis?.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: C.txt1, marginBottom: 12 }}>📰 언론사별 논조</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {insight.sourceAnalysis.map(s => (
                  <div key={s.source} style={{
                    background: C.surface, border: `1px solid ${C.border}`,
                    borderRadius: 8, padding: "12px", fontSize: 12
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontWeight: 600, color: C.txt1 }}>
                      <span>{s.source}</span>
                      <span style={{ color: C.txt3 }}>({s.total}건)</span>
                    </div>
                    <div style={{ display: "flex", gap: 4, height: 6, borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ flex: s.positive, background: "#22C55E" }} title={`긍정 ${s.positive}%`} />
                      <div style={{ flex: s.neutral, background: "#E2E8F0" }} title={`중립 ${s.neutral}%`} />
                      <div style={{ flex: s.negative, background: "#EF4444" }} title={`부정 ${s.negative}%`} />
                    </div>
                    <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: 11, color: C.txt3 }}>
                      <span>😊 {s.positive}%</span>
                      <span>😐 {s.neutral}%</span>
                      <span>😞 {s.negative}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function EmptyReport({ label }) {
  return (
    <div style={{ textAlign: "center", padding: "80px 20px", color: C.txt3 }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: C.txt2, marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 13, color: C.txt3 }}>
        준비 중입니다
      </div>
    </div>
  );
}

// ── 이슈 트래킹 ───────────────────────────────────────────
function IssueCard({ issue }) {
  const [open, setOpen] = useState(false);
  const c = issue.consecutiveDays >= 5 ? "#DC2626"
    : issue.consecutiveDays >= 3 ? "#D97706"
    : issue.consecutiveDays >= 2 ? C.accent
    : C.txt3;
  const catColor = CAT_COLORS[issue.category] || { bg: "#F8FAFC", text: "#334155", dot: "#64748B" };

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px", boxShadow: "0 1px 3px rgba(0,0,0,.04)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
        {/* 연속 일수 배지 */}
        <div style={{ flexShrink: 0, textAlign: "center", background: c + "15", border: `1px solid ${c}30`, borderRadius: 8, padding: "6px 10px", minWidth: 44 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: c, lineHeight: 1 }}>{issue.consecutiveDays}</div>
          <div style={{ fontSize: 9, fontWeight: 700, color: c, marginTop: 2 }}>연속</div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center", marginBottom: 5 }}>
            <span style={{ background: catColor.bg, color: catColor.text, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5, display: "inline-flex", alignItems: "center", gap: 3 }}>
              <span style={{ width: 4, height: 4, borderRadius: "50%", background: catColor.dot }} />
              {issue.category || "기타"}
            </span>
            <span style={{ fontSize: 11, color: C.txt3 }}>총 {issue.totalDays}일</span>
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.txt1, lineHeight: 1.5, marginBottom: 6 }}>{issue.title}</div>
          {/* 키워드 */}
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
            {issue.keywords.map(kw => (
              <span key={kw} style={{ background: "#EFF6FF", color: C.accent, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 10 }}>{kw}</span>
            ))}
          </div>
          {/* 날짜 타임라인 */}
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {issue.dates.map(d => (
              <span key={d} style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: c + "15", color: c, border: `1px solid ${c}30` }}>
                {d.slice(5).replace("-", "/")}
              </span>
            ))}
          </div>
        </div>
      </div>

      <button onClick={() => setOpen(v => !v)} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 7, padding: "5px 12px", fontSize: 11, color: C.txt3, cursor: "pointer", fontFamily: "inherit", width: "100%" }}>
        {open ? "▲ 접기" : `▼ 관련 기사 ${issue.articles.length}건 보기`}
      </button>

      {open && (
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
          {issue.articles.map((a, i) => (
            <a key={i} href={a.url} target="_blank" rel="noreferrer" style={{ textDecoration: "none", display: "block" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "8px 10px", background: "#FAFAFA", borderRadius: 8, border: `1px solid ${C.border}` }}
                onMouseEnter={e => e.currentTarget.style.background = "#F0F4FF"}
                onMouseLeave={e => e.currentTarget.style.background = "#FAFAFA"}
              >
                <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, color: C.txt3, background: C.bg, border: `1px solid ${C.border}`, padding: "1px 6px", borderRadius: 4 }}>{a.date.slice(5).replace("-", "/")}</span>
                <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, color: C.txt3 }}>#{a.rank}</span>
                <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: C.txt1, lineHeight: 1.5 }}>{a.title}</span>
                <span style={{ flexShrink: 0, fontSize: 10, color: C.accent }}>→</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function IssueTracking({ date }) {
  const [days, setDays] = useState(7);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const fetchTracking = async (d = date, n = days) => {
    setLoading(true); setErr(""); setData(null);
    try {
      const res = await fetch(`/api/issues/tracking?date=${d}&days=${n}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData(json);
    } catch (e) { setErr(e.message); }
    setLoading(false);
  };

  useEffect(() => { fetchTracking(); }, [date, days]);

  return (
    <div>
      {/* 헤더 컨트롤 */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: C.txt2 }}>분석 기간</span>
        {[7, 14, 30].map(n => (
          <button key={n} onClick={() => setDays(n)}
            style={{ padding: "6px 14px", borderRadius: 7, border: `1px solid ${days === n ? C.accent : C.border}`, background: days === n ? C.accent : "transparent", color: days === n ? "#fff" : C.txt2, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            {n}일
          </button>
        ))}
        {data && (
          <span style={{ marginLeft: "auto", fontSize: 12, color: C.txt3 }}>
            {data.dateRange.from.slice(5).replace("-", "/")} ~ {data.dateRange.to.slice(5).replace("-", "/")}
          </span>
        )}
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "72px 0" }}>
          <div style={{ width: 36, height: 36, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.accent}`, borderRadius: "50%", margin: "0 auto 14px", animation: "spin 1s linear infinite" }} />
          <div style={{ fontSize: 14, color: C.txt2, fontWeight: 600 }}>이슈 분석 중...</div>
        </div>
      )}

      {err && !loading && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "14px 16px", color: C.breaking, fontSize: 13, fontWeight: 600 }}>⚠️ {err}</div>
      )}

      {data && !loading && (
        <>
          {data.issues.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", background: C.surface, borderRadius: 14, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🔍</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.txt2 }}>반복 이슈가 없습니다</div>
              <div style={{ fontSize: 12, color: C.txt3, marginTop: 6 }}>분석 기간을 늘려보세요</div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 12, color: C.txt3, marginBottom: 12 }}>
                {data.issues.length}개 반복 이슈 발견 — 연속 등장일 기준 내림차순
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {data.issues.map((issue, i) => (
                  <IssueCard key={i} issue={issue} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default function Report() {
  const [date, setDate] = useState(todayStr());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [gwangjaeReport, setGwangjaeReport] = useState(null);
  const [gwangjaeLoading, setGwangjaeLoading] = useState(false);
  const [gwangjaeErr, setGwangjaeErr] = useState("");
  const [gwangjaeInsight, setGwangjaeInsight] = useState(null);
  const [activeTab, setActiveTab] = useState("comprehensive");
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

  const fetchGwangjaeReport = async (d = date) => {
    setGwangjaeLoading(true); setGwangjaeErr(""); setGwangjaeReport(null); setGwangjaeInsight(null);
    try {
      const res = await fetch(`/api/report/gwangjae?date=${d}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setGwangjaeReport(data);
      // 인사이트도 함께 로드
      fetchGwangjaeInsight(d);
    } catch (e) { setGwangjaeErr(e.message); }
    setGwangjaeLoading(false);
  };

  const fetchGwangjaeInsight = async (d = date) => {
    try {
      const res = await fetch(`/api/report/gwangjae/insight?date=${d}`);
      const data = await res.json();
      if (res.ok) setGwangjaeInsight(data);
    } catch (e) {
      console.warn("인사이트 로드 실패:", e.message);
    }
  };

  useEffect(() => {
    fetchReport();
    // date 변경 시 gwangjae 탭도 초기화
    setGwangjaeReport(null);
    setGwangjaeErr("");
  }, [date]);

  useEffect(() => {
    if (activeTab === "gwangjae" && !gwangjaeReport && !gwangjaeLoading && !gwangjaeErr) {
      fetchGwangjaeReport();
    }
  }, [activeTab, date]);

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
      <Nav current="/report" />

      <div style={{ maxWidth: 820, margin: "0 auto", padding: isMobile ? "16px 12px 64px" : "24px 20px 80px" }}>

        {/* 헤더 */}
        <div style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between", alignItems: isMobile ? "stretch" : "flex-start",
          gap: 12, marginBottom: 20,
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: isMobile ? 19 : 22, fontWeight: 900, color: C.txt1, letterSpacing: -.5 }}>
              뉴스 리포트
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

        {/* 탭 내비게이션 */}
        <div style={{
          display: "flex", gap: 4, marginBottom: 20, overflowX: "auto", paddingBottom: 4,
          borderBottom: `2px solid ${C.border}`,
        }}>
          {TABS.map(tab => (
            <button key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: isMobile ? "0 1 auto" : "auto",
                minWidth: isMobile ? 100 : 140,
                padding: "10px 16px",
                border: "none",
                background: activeTab === tab.id ? C.accent : "transparent",
                color: activeTab === tab.id ? "#fff" : C.txt2,
                fontWeight: activeTab === tab.id ? 700 : 600,
                fontSize: 13,
                borderRadius: "6px 6px 0 0",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all .2s",
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* 언론사별 현황 */}
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

        {/* 탭 콘텐츠 */}
        {!loading && report && (
          <>
            {activeTab === "comprehensive" && (
              <div>
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

                <div style={{ height: 1, background: C.border, margin: "0 0 28px" }} />

                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <div style={{ width: 4, height: 20, background: C.accent, borderRadius: 2 }} />
                    <h2 style={{ margin: 0, fontSize: isMobile ? 15 : 17, fontWeight: 900, color: C.txt1 }}>
                      카테고리별 주요기사
                    </h2>
                    <span style={{ fontSize: 11, color: C.txt3 }}>최대 10건</span>
                  </div>

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

                <div style={{ marginTop: 32, textAlign: "center", fontSize: 11, color: C.txt3, lineHeight: 1.8 }}>
                  리포트 생성: {fmtDateFull(report.generatedAt)}<br />
                  {report.totalArticles.toLocaleString()}개 기사 · {report.totalGroups.toLocaleString()}개 주제 그룹
                </div>
              </div>
            )}

            {activeTab === "telegram" && <TelegramReport report={report} date={date} />}

            {activeTab === "tracking" && <IssueTracking date={date} />}

            {activeTab === "jaeming" && <EmptyReport label="이재명" />}
            {activeTab === "gwangjae" && (
              gwangjaeLoading ? (
                <div style={{ textAlign: "center", padding: "72px 0" }}>
                  <div style={{ width: 38, height: 38, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.accent}`, borderRadius: "50%", margin: "0 auto 14px", animation: "spin 1s linear infinite" }} />
                  <div style={{ fontSize: 14, color: C.txt2, fontWeight: 600 }}>기사 분석 중...</div>
                </div>
              ) : gwangjaeErr ? (
                <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "14px 16px", color: C.breaking, fontSize: 13, fontWeight: 600 }}>
                  ⚠️ {gwangjaeErr}
                </div>
              ) : gwangjaeReport ? (
                <GwangjaeReport report={gwangjaeReport} date={date} insight={gwangjaeInsight} />
              ) : (
                <EmptyReport label="이광재 관련 기사가 없습니다" />
              )
            )}
            {activeTab === "trump" && <EmptyReport label="트럼프" />}
          </>
        )}
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
