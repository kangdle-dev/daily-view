import { useState, useEffect } from "react";
import Nav from "./Nav.jsx";

const C = {
  bg: "#F1F5F9",
  surface: "#FFFFFF",
  border: "#E2E8F0",
  txt1: "#0F172A",
  txt2: "#475569",
  txt3: "#94A3B8",
  accent: "#2563EB",
  danger: "#DC2626",
};

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("categories");

  // 카테고리 추가 폼
  const [newCategory, setNewCategory] = useState("");

  // 데이터 관리
  const [dataStats, setDataStats] = useState(null);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    loadSettings();
    loadDataStats();
  }, []);

  async function loadDataStats() {
    try {
      const res = await fetch("/api/data/stats");
      const data = await res.json();
      setDataStats(data);
    } catch (err) {
      console.error("데이터 통계 로드 실패:", err);
    }
  }

  async function loadSettings() {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      setSettings(data);
    } catch (err) {
      setMessage("설정 로드 실패: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings(updated) {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "저장 실패");
      setSettings(data.settings);
      setMessage("✅ 설정이 저장되었습니다");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("❌ " + err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleAddCategory() {
    if (!newCategory.trim()) return;
    if (settings.mainCategories.includes(newCategory)) {
      setMessage("⚠️ 이미 존재하는 카테고리입니다");
      return;
    }
    const updated = {
      ...settings,
      mainCategories: [...settings.mainCategories, newCategory],
    };
    saveSettings(updated);
    setNewCategory("");
  }

  function handleRemoveCategory(cat) {
    const updated = {
      ...settings,
      mainCategories: settings.mainCategories.filter(c => c !== cat),
    };
    saveSettings(updated);
  }

  function handleCollectTimeChange(field, value) {
    const updated = { ...settings, [field]: value };
    setSettings(updated);
  }

  async function handleSaveCollectTime() {
    await saveSettings(settings);
  }

  async function handleClearData(type) {
    const typeLabel = {
      articles: "기사 데이터",
      briefings: "브리핑 캐시",
      logs: "수집 로그",
      all: "모든 데이터",
    }[type];

    if (!window.confirm(`${typeLabel}를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    setClearing(true);
    try {
      const res = await fetch("/api/data/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "삭제 실패");
      setMessage("✅ " + data.message);
      await loadDataStats();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("❌ " + err.message);
    } finally {
      setClearing(false);
    }
  }

  function formatBytes(bytes) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  }

  if (loading) {
    return (
      <div style={{ fontFamily: "'Apple SD Gothic Neo','Pretendard',system-ui,sans-serif", background: C.bg, minHeight: "100vh" }}>
        <Nav current="/settings" />
        <div style={{ textAlign: "center", padding: "60px 20px" }}>로딩 중...</div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Apple SD Gothic Neo','Pretendard',system-ui,sans-serif", background: C.bg, minHeight: "100vh" }}>
      <Nav current="/settings" />

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "24px 16px 40px" }}>
        {/* 헤더 */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: C.txt1, letterSpacing: -0.5 }}>설정</h1>
          <p style={{ margin: "3px 0 0", fontSize: 13, color: C.txt2 }}>카테고리 및 수집 시간 관리</p>
        </div>

        {/* 메시지 */}
        {message && (
          <div style={{
            padding: "12px 14px", marginBottom: 16, borderRadius: 8,
            background: message.includes("❌") ? "#FEF2F2" : "#F0FDF4",
            color: message.includes("❌") ? C.danger : "#15803D",
            fontSize: 13, fontWeight: 500,
          }}>
            {message}
          </div>
        )}

        {/* 탭 */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, borderBottom: `2px solid ${C.border}` }}>
          <button
            onClick={() => setActiveTab("categories")}
            style={{
              background: "none", border: "none", padding: "12px 0", paddingBottom: 10,
              borderBottom: activeTab === "categories" ? `3px solid ${C.accent}` : "none",
              color: activeTab === "categories" ? C.accent : C.txt2,
              fontWeight: activeTab === "categories" ? 700 : 500,
              fontSize: 14, cursor: "pointer", transition: "all .2s",
            }}
          >
            📁 카테고리
          </button>
          <button
            onClick={() => setActiveTab("collect")}
            style={{
              background: "none", border: "none", padding: "12px 0", paddingBottom: 10,
              borderBottom: activeTab === "collect" ? `3px solid ${C.accent}` : "none",
              color: activeTab === "collect" ? C.accent : C.txt2,
              fontWeight: activeTab === "collect" ? 700 : 500,
              fontSize: 14, cursor: "pointer", transition: "all .2s",
            }}
          >
            ⏰ 수집 설정
          </button>
          <button
            onClick={() => setActiveTab("data")}
            style={{
              background: "none", border: "none", padding: "12px 0", paddingBottom: 10,
              borderBottom: activeTab === "data" ? `3px solid ${C.accent}` : "none",
              color: activeTab === "data" ? C.accent : C.txt2,
              fontWeight: activeTab === "data" ? 700 : 500,
              fontSize: 14, cursor: "pointer", transition: "all .2s",
            }}
          >
            🗑️ 데이터 관리
          </button>
        </div>

        {/* 탭 1: 카테고리 */}
        {activeTab === "categories" && settings && (
          <div style={{ animation: "fadeIn .2s" }}>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.txt1, marginBottom: 8 }}>
                대표 카테고리 목록
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "12px", background: C.surface, borderRadius: 8, minHeight: 40 }}>
                {settings.mainCategories.length === 0 ? (
                  <span style={{ color: C.txt3, fontSize: 13 }}>카테고리를 추가해주세요</span>
                ) : (
                  settings.mainCategories.map(cat => (
                    <div
                      key={cat}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        background: C.accent, color: "#fff", padding: "5px 12px", borderRadius: 6,
                        fontSize: 12, fontWeight: 600,
                      }}
                    >
                      {cat}
                      <button
                        onClick={() => handleRemoveCategory(cat)}
                        style={{
                          background: "rgba(255,255,255,.2)", border: "none", color: "#fff",
                          padding: "2px 4px", borderRadius: 3, cursor: "pointer", fontWeight: 700, fontSize: 12,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.txt1, marginBottom: 8 }}>
                새 카테고리 추가
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  onKeyPress={e => e.key === "Enter" && handleAddCategory()}
                  placeholder="카테고리명 입력"
                  style={{
                    flex: 1, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px",
                    fontSize: 13, fontFamily: "inherit", outline: "none",
                  }}
                />
                <button
                  onClick={handleAddCategory}
                  style={{
                    background: C.accent, color: "#fff", border: "none", padding: "10px 20px", borderRadius: 8,
                    fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "all .2s",
                  }}
                  onMouseEnter={e => e.target.style.opacity = ".9"}
                  onMouseLeave={e => e.target.style.opacity = "1"}
                >
                  추가
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 탭 2: 수집 설정 */}
        {activeTab === "collect" && settings && (
          <div>
            <div style={{ marginBottom: 20, padding: "14px", background: C.surface, borderRadius: 8, border: `1px solid ${C.border}` }}>
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13, fontWeight: 600, color: C.txt1 }}>
                <input
                  type="checkbox"
                  checked={settings.collectEnabled}
                  onChange={e => handleCollectTimeChange("collectEnabled", e.target.checked)}
                  style={{ width: 18, height: 18, cursor: "pointer" }}
                />
                자동 수집 활성화
              </label>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.txt1, marginBottom: 10 }}>
                자동 수집 시간
              </label>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <select
                  value={settings.collectHour}
                  onChange={e => handleCollectTimeChange("collectHour", parseInt(e.target.value))}
                  style={{
                    border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px",
                    fontSize: 13, fontFamily: "inherit", outline: "none", minWidth: 80,
                  }}
                >
                  {Array.from({ length: 24 }).map((_, i) => (
                    <option key={i} value={i}>
                      {String(i).padStart(2, "0")}시
                    </option>
                  ))}
                </select>
                <select
                  value={settings.collectMinute}
                  onChange={e => handleCollectTimeChange("collectMinute", parseInt(e.target.value))}
                  style={{
                    border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px",
                    fontSize: 13, fontFamily: "inherit", outline: "none", minWidth: 80,
                  }}
                >
                  {Array.from({ length: 60 }).map((_, i) => (
                    <option key={i} value={i}>
                      {String(i).padStart(2, "0")}분
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.txt1, marginBottom: 10 }}>
                브리핑 생성 시간
              </label>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <select
                  value={settings.briefingHour}
                  onChange={e => handleCollectTimeChange("briefingHour", parseInt(e.target.value))}
                  style={{
                    border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px",
                    fontSize: 13, fontFamily: "inherit", outline: "none", minWidth: 80,
                  }}
                >
                  {Array.from({ length: 24 }).map((_, i) => (
                    <option key={i} value={i}>
                      {String(i).padStart(2, "0")}시
                    </option>
                  ))}
                </select>
                <select
                  value={settings.briefingMinute}
                  onChange={e => handleCollectTimeChange("briefingMinute", parseInt(e.target.value))}
                  style={{
                    border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px",
                    fontSize: 13, fontFamily: "inherit", outline: "none", minWidth: 80,
                  }}
                >
                  {Array.from({ length: 60 }).map((_, i) => (
                    <option key={i} value={i}>
                      {String(i).padStart(2, "0")}분
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleSaveCollectTime}
              disabled={saving}
              style={{
                background: C.accent, color: "#fff", border: "none", padding: "12px 28px", borderRadius: 8,
                fontWeight: 700, fontSize: 14, cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.6 : 1, transition: "all .2s",
              }}
            >
              {saving ? "저장 중..." : "저장"}
            </button>
          </div>
        )}

        {/* 탭 3: 데이터 관리 */}
        {activeTab === "data" && dataStats && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <p style={{ margin: "0 0 16px", fontSize: 13, color: C.txt2, lineHeight: 1.6 }}>
                수집된 기사 데이터, 생성된 브리핑, 로그를 확인하고 삭제할 수 있습니다.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
                {[
                  { key: "articles", label: "기사 데이터", icon: "📰", stats: dataStats.articles },
                  { key: "briefings", label: "브리핑 캐시", icon: "✨", stats: dataStats.briefings },
                  { key: "logs", label: "수집 로그", icon: "📋", stats: dataStats.logs },
                ].map(item => (
                  <div key={item.key} style={{
                    background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16,
                  }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>{item.icon}</div>
                    <div style={{ fontWeight: 600, color: C.txt1, fontSize: 14, marginBottom: 6 }}>{item.label}</div>
                    <div style={{ fontSize: 13, color: C.txt2, marginBottom: 12 }}>
                      {item.stats.count}개 파일<br />
                      {formatBytes(item.stats.size)}
                    </div>
                    <button
                      onClick={() => handleClearData(item.key)}
                      disabled={clearing || item.stats.count === 0}
                      style={{
                        width: "100%", padding: "8px 0", background: C.danger, color: "#fff",
                        border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer",
                        opacity: clearing || item.stats.count === 0 ? 0.5 : 1,
                      }}
                    >
                      {clearing ? "삭제 중..." : "삭제"}
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ background: "#FEF2F2", border: `1px solid #FECACA`, borderRadius: 8, padding: 14, marginBottom: 20 }}>
                <div style={{ fontWeight: 600, color: C.danger, fontSize: 13, marginBottom: 8 }}>전체 용량</div>
                <div style={{ color: C.txt2, fontSize: 14, fontWeight: 700 }}>{formatBytes(dataStats.total.size)}</div>
              </div>

              <button
                onClick={() => handleClearData("all")}
                disabled={clearing || dataStats.total.size === 0}
                style={{
                  width: "100%", padding: "12px 0", background: C.danger, color: "#fff",
                  border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer",
                  opacity: clearing || dataStats.total.size === 0 ? 0.5 : 1,
                }}
              >
                {clearing ? "삭제 중..." : "모든 데이터 삭제"}
              </button>

              <div style={{ marginTop: 16, padding: "12px", background: "#F0F9FF", border: `1px solid #BFDBFE`, borderRadius: 6, fontSize: 12, color: "#0C4A6E", lineHeight: 1.6 }}>
                💡 <strong>팁:</strong> 모든 데이터를 삭제한 후 대시보드의 "수동 수집" 버튼으로 새로운 카테고리 매핑으로 기사를 다시 수집할 수 있습니다.
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
      `}</style>
    </div>
  );
}
