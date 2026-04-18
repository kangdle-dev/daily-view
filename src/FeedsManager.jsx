import { useState, useEffect } from "react";

const C = {
  bg: "#F1F5F9", surface: "#FFFFFF", border: "#E2E8F0",
  txt1: "#0F172A", txt2: "#475569", txt3: "#94A3B8",
  accent: "#2563EB", danger: "#DC2626", success: "#16A34A",
  nav: "#1E293B",
};

const NAV = [
  { href: "/dashboard",  label: "대시보드",    mLabel: "📰" },
  { href: "/report",     label: "리포트",      mLabel: "📊" },
  { href: "/insight",    label: "인사이트",    mLabel: "💡" },
  { href: "/simple",     label: "심플대시보드", mLabel: "🖨️" },
  { href: "/newspim",    label: "뉴스핌분석",  mLabel: "📈" },
  { href: "/feeds",      label: "피드관리",    mLabel: "⚙️" },
];

const BUILTIN_SOURCES = [
  { key: "khan",       name: "경향신문",   feeds: [{ url: "https://www.khan.co.kr/rss/rssdata/politic_news.xml", category: "정치" }] },
  { key: "chosun",     name: "조선일보",   feeds: [{ url: "https://www.chosun.com/arc/outboundfeeds/rss/category/politics/?outputType=xml", category: "정치" }] },
  { key: "newstomato", name: "뉴스토마토", feeds: [{ url: "https://www.newstomato.com/rss/?cate=11", category: "정치" }] },
  { key: "yonhap",     name: "연합뉴스",   feeds: [{ url: "https://www.yna.co.kr/rss/politics.xml", category: "정치" }] },
  { key: "newspim",    name: "뉴스핌",     feeds: [{ url: "http://rss.newspim.com/news/category/101", category: "정치" }] },
];

function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth < 640);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 640);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return mobile;
}

// ── 피드 행 컴포넌트 ──────────────────────────────────────
function FeedRow({ feed, index, onChange, onRemove, onTest }) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  async function handleTest() {
    if (!feed.url) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/feeds/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: feed.url }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch {
      setTestResult({ ok: false, error: "네트워크 오류" });
    } finally {
      setTesting(false);
    }
  }

  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 6, padding: "10px 12px", marginBottom: 8, background: "#FAFAFA" }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
        <input
          placeholder="RSS URL"
          value={feed.url}
          onChange={e => onChange(index, "url", e.target.value)}
          style={{ flex: 1, padding: "6px 8px", border: `1px solid ${C.border}`, borderRadius: 4, fontSize: 13 }}
        />
        <input
          placeholder="카테고리"
          value={feed.category}
          onChange={e => onChange(index, "category", e.target.value)}
          style={{ width: 90, padding: "6px 8px", border: `1px solid ${C.border}`, borderRadius: 4, fontSize: 13 }}
        />
        <button
          onClick={handleTest}
          disabled={testing || !feed.url}
          style={{ padding: "6px 10px", background: testing ? C.txt3 : "#0EA5E9", color: "#fff", border: "none", borderRadius: 4, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}
        >
          {testing ? "테스트중..." : "테스트"}
        </button>
        <button
          onClick={() => onRemove(index)}
          style={{ padding: "6px 8px", background: "#FEE2E2", color: C.danger, border: "none", borderRadius: 4, fontSize: 12, cursor: "pointer" }}
        >
          삭제
        </button>
      </div>
      {testResult && (
        <div style={{ fontSize: 12, color: testResult.ok ? C.success : C.danger, background: testResult.ok ? "#F0FDF4" : "#FEF2F2", padding: "6px 8px", borderRadius: 4 }}>
          {testResult.ok
            ? `✓ "${testResult.title}" — 기사 ${testResult.count}개 확인 / 샘플: ${testResult.sample?.[0]?.title?.slice(0, 40) || ""}...`
            : `✗ ${testResult.error}`}
        </div>
      )}
    </div>
  );
}

// ── 소스 편집 폼 ─────────────────────────────────────────
function SourceForm({ initial, onSave, onCancel }) {
  const [name, setName]   = useState(initial?.name || "");
  const [key, setKey]     = useState(initial?.key || "");
  const [feeds, setFeeds] = useState(initial?.feeds?.length ? initial.feeds : [{ url: "", category: "" }]);
  const [saving, setSaving] = useState(false);
  const [err, setErr]     = useState("");

  function addFeed() {
    setFeeds(f => [...f, { url: "", category: "" }]);
  }

  function removeFeed(i) {
    setFeeds(f => f.filter((_, idx) => idx !== i));
  }

  function changeFeed(i, field, val) {
    setFeeds(f => f.map((row, idx) => idx === i ? { ...row, [field]: val } : row));
  }

  async function handleSave() {
    if (!name.trim() || !key.trim()) { setErr("이름과 키를 입력하세요"); return; }
    const validFeeds = feeds.filter(f => f.url.trim());
    if (!validFeeds.length) { setErr("RSS 피드를 하나 이상 입력하세요"); return; }
    setSaving(true);
    setErr("");
    try {
      await onSave({ name: name.trim(), key: key.trim(), feeds: validFeeds });
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.accent}`, borderRadius: 8, padding: 20, marginBottom: 16 }}>
      <div style={{ display: "flex", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 140 }}>
          <label style={{ fontSize: 12, color: C.txt2, display: "block", marginBottom: 4 }}>언론사 이름</label>
          <input
            placeholder="예: 한겨레"
            value={name}
            onChange={e => setName(e.target.value)}
            style={{ width: "100%", padding: "7px 10px", border: `1px solid ${C.border}`, borderRadius: 4, fontSize: 14, boxSizing: "border-box" }}
          />
        </div>
        <div style={{ flex: 1, minWidth: 120 }}>
          <label style={{ fontSize: 12, color: C.txt2, display: "block", marginBottom: 4 }}>소스 키 (영문)</label>
          <input
            placeholder="예: hani"
            value={key}
            onChange={e => setKey(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "-"))}
            style={{ width: "100%", padding: "7px 10px", border: `1px solid ${C.border}`, borderRadius: 4, fontSize: 14, boxSizing: "border-box" }}
          />
        </div>
      </div>

      <div style={{ marginBottom: 10 }}>
        <label style={{ fontSize: 12, color: C.txt2, display: "block", marginBottom: 6 }}>RSS 피드 목록</label>
        {feeds.map((feed, i) => (
          <FeedRow key={i} feed={feed} index={i} onChange={changeFeed} onRemove={removeFeed} />
        ))}
        <button
          onClick={addFeed}
          style={{ padding: "6px 12px", background: "#EFF6FF", color: C.accent, border: `1px solid #BFDBFE`, borderRadius: 4, fontSize: 13, cursor: "pointer" }}
        >
          + 피드 추가
        </button>
      </div>

      {err && <div style={{ color: C.danger, fontSize: 13, marginBottom: 10 }}>{err}</div>}

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button onClick={onCancel} style={{ padding: "7px 16px", background: "#F8FAFC", border: `1px solid ${C.border}`, borderRadius: 4, fontSize: 13, cursor: "pointer" }}>
          취소
        </button>
        <button onClick={handleSave} disabled={saving} style={{ padding: "7px 16px", background: C.accent, color: "#fff", border: "none", borderRadius: 4, fontSize: 13, cursor: "pointer" }}>
          {saving ? "저장중..." : "저장"}
        </button>
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────
export default function FeedsManager() {
  const isMobile = useIsMobile();
  const [customSources, setCustomSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId]     = useState(null);
  const [deletingId, setDeletingId]   = useState(null);
  const [msg, setMsg] = useState("");

  async function loadSources() {
    try {
      const res = await fetch("/api/feeds");
      const data = await res.json();
      setCustomSources(data.sources || []);
    } catch {
      setCustomSources([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadSources(); }, []);

  function flash(text) {
    setMsg(text);
    setTimeout(() => setMsg(""), 3000);
  }

  async function handleAdd(payload) {
    const res = await fetch("/api/feeds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "추가 실패");
    setShowAddForm(false);
    await loadSources();
    flash(`'${payload.name}' 소스가 추가되었습니다.`);
  }

  async function handleEdit(id, payload) {
    const res = await fetch(`/api/feeds/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "수정 실패");
    setEditingId(null);
    await loadSources();
    flash(`'${payload.name}' 소스가 수정되었습니다.`);
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`'${name}' 소스를 삭제하시겠습니까?`)) return;
    setDeletingId(id);
    try {
      await fetch(`/api/feeds/${id}`, { method: "DELETE" });
      await loadSources();
      flash(`'${name}' 소스가 삭제되었습니다.`);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Pretendard', 'Apple SD Gothic Neo', sans-serif" }}>
      {/* NAV */}
      <nav style={{ background: C.nav, padding: isMobile ? "0 12px" : "0 24px", display: "flex", alignItems: "center", gap: 4, height: 52, position: "sticky", top: 0, zIndex: 100 }}>
        {NAV.map(n => (
          <a
            key={n.href}
            href={n.href}
            style={{
              color: n.href === "/feeds" ? "#FFFFFF" : "#94A3B8",
              textDecoration: "none",
              padding: isMobile ? "6px 8px" : "6px 14px",
              borderRadius: 6,
              fontSize: isMobile ? 18 : 13,
              background: n.href === "/feeds" ? "rgba(255,255,255,0.12)" : "transparent",
              fontWeight: n.href === "/feeds" ? 600 : 400,
            }}
          >
            {isMobile ? n.mLabel : n.label}
          </a>
        ))}
      </nav>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: isMobile ? "20px 16px" : "32px 24px" }}>
        {/* 헤더 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: isMobile ? 20 : 24, color: C.txt1, fontWeight: 700 }}>피드 관리</h1>
            <p style={{ margin: "4px 0 0", color: C.txt2, fontSize: 13 }}>RSS 피드 소스를 추가하고 관리합니다</p>
          </div>
          <button
            onClick={() => { setShowAddForm(v => !v); setEditingId(null); }}
            style={{ padding: "8px 18px", background: C.accent, color: "#fff", border: "none", borderRadius: 6, fontSize: 14, cursor: "pointer", fontWeight: 600 }}
          >
            {showAddForm ? "취소" : "+ 소스 추가"}
          </button>
        </div>

        {/* 플래시 메시지 */}
        {msg && (
          <div style={{ background: "#F0FDF4", border: `1px solid #BBF7D0`, color: C.success, padding: "10px 14px", borderRadius: 6, marginBottom: 16, fontSize: 13 }}>
            {msg}
          </div>
        )}

        {/* 추가 폼 */}
        {showAddForm && (
          <SourceForm
            onSave={handleAdd}
            onCancel={() => setShowAddForm(false)}
          />
        )}

        {/* 기본 소스 */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: C.txt2, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            기본 소스 ({BUILTIN_SOURCES.length})
          </h2>
          {BUILTIN_SOURCES.map(src => (
            <div key={src.key} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "14px 16px", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ background: "#EFF6FF", color: C.accent, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 12 }}>기본</span>
                <span style={{ fontWeight: 600, color: C.txt1, fontSize: 14 }}>{src.name}</span>
                <span style={{ color: C.txt3, fontSize: 12 }}>({src.key})</span>
              </div>
              <span style={{ color: C.txt3, fontSize: 12 }}>{src.feeds.length}개 피드</span>
            </div>
          ))}
        </section>

        {/* 커스텀 소스 */}
        <section>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: C.txt2, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            커스텀 소스 ({loading ? "..." : customSources.length})
          </h2>

          {loading ? (
            <div style={{ color: C.txt3, fontSize: 14, padding: 20, textAlign: "center" }}>불러오는 중...</div>
          ) : customSources.length === 0 ? (
            <div style={{ background: C.surface, border: `1px dashed ${C.border}`, borderRadius: 8, padding: "32px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📡</div>
              <div style={{ color: C.txt2, fontSize: 14, marginBottom: 4 }}>등록된 커스텀 소스가 없습니다</div>
              <div style={{ color: C.txt3, fontSize: 13 }}>위 "+ 소스 추가" 버튼으로 새 RSS 피드를 등록하세요</div>
            </div>
          ) : (
            customSources.map(src => (
              <div key={src.id}>
                {editingId === src.id ? (
                  <SourceForm
                    initial={src}
                    onSave={payload => handleEdit(src.id, payload)}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "14px 16px", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ background: "#F0FDF4", color: C.success, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 12 }}>커스텀</span>
                        <span style={{ fontWeight: 600, color: C.txt1, fontSize: 14 }}>{src.name}</span>
                        <span style={{ color: C.txt3, fontSize: 12 }}>({src.key})</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ color: C.txt3, fontSize: 12, marginRight: 4 }}>{src.feeds?.length || 0}개 피드</span>
                        <button
                          onClick={() => { setEditingId(src.id); setShowAddForm(false); }}
                          style={{ padding: "5px 12px", background: "#F8FAFC", border: `1px solid ${C.border}`, borderRadius: 4, fontSize: 12, cursor: "pointer", color: C.txt2 }}
                        >
                          편집
                        </button>
                        <button
                          onClick={() => handleDelete(src.id, src.name)}
                          disabled={deletingId === src.id}
                          style={{ padding: "5px 12px", background: "#FEF2F2", border: `1px solid #FECACA`, borderRadius: 4, fontSize: 12, cursor: "pointer", color: C.danger }}
                        >
                          {deletingId === src.id ? "삭제중..." : "삭제"}
                        </button>
                      </div>
                    </div>
                    {src.feeds?.length > 0 && (
                      <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
                        {src.feeds.map((f, i) => (
                          <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                            <span style={{ background: "#F1F5F9", color: C.txt2, fontSize: 11, padding: "1px 6px", borderRadius: 4, whiteSpace: "nowrap" }}>{f.category}</span>
                            <span style={{ color: C.txt3, fontSize: 12, wordBreak: "break-all" }}>{f.url}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
