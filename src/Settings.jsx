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

  useEffect(() => {
    loadSettings();
  }, []);

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
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
      `}</style>
    </div>
  );
}
