import { useState } from "react";
import { login } from "./useAuth.js";

export default function Login({ onSuccess }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      if (res.ok) {
        const data = await res.json();
        login(data);
        onSuccess();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "비밀번호가 틀렸습니다");
        setPw("");
      }
    } catch {
      setError("서버 연결 오류");
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0F172A",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Apple SD Gothic Neo','Pretendard',system-ui,sans-serif",
      padding: "0 16px",
    }}>
      <div style={{ width: "100%", maxWidth: 360 }}>
        {/* 로고 */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            width: 52, height: 52, background: "#FFD600", borderRadius: 14,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 14px",
          }}>
            <span style={{ fontWeight: 900, fontSize: 24, color: "#111" }}>D</span>
          </div>
          <h1 style={{ margin: 0, color: "#F8FAFC", fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>
            Daily View
          </h1>
          <p style={{ margin: "6px 0 0", color: "#64748B", fontSize: 13 }}>
            접근하려면 비밀번호를 입력하세요
          </p>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 12 }}>
            <input
              type="password"
              placeholder="비밀번호"
              value={pw}
              onChange={e => { setPw(e.target.value); setError(""); }}
              autoFocus
              style={{
                width: "100%",
                boxSizing: "border-box",
                background: "#1E293B",
                border: error ? "1.5px solid #EF4444" : "1.5px solid #334155",
                borderRadius: 10,
                padding: "14px 16px",
                fontSize: 15,
                color: "#F1F5F9",
                outline: "none",
                fontFamily: "inherit",
                transition: "border .15s",
              }}
            />
          </div>

          {error && (
            <div style={{
              background: "#FEF2F2", color: "#DC2626",
              border: "1px solid #FECACA",
              borderRadius: 8, padding: "10px 14px",
              fontSize: 13, fontWeight: 600, marginBottom: 12,
              textAlign: "center",
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !pw}
            style={{
              width: "100%",
              background: loading || !pw ? "#334155" : "#2563EB",
              color: loading || !pw ? "#64748B" : "#fff",
              border: "none",
              borderRadius: 10,
              padding: "14px",
              fontSize: 15,
              fontWeight: 700,
              cursor: loading || !pw ? "not-allowed" : "pointer",
              transition: "background .15s",
              fontFamily: "inherit",
            }}
          >
            {loading ? "확인 중..." : "입장"}
          </button>
        </form>
      </div>
    </div>
  );
}
