import { useState, useEffect } from "react";
import Nav from "./Nav.jsx";
import { getName } from "./useAuth.js";

const C = {
  bg: "#F1F5F9", surface: "#FFFFFF", border: "#E2E8F0",
  txt1: "#0F172A", txt2: "#475569", txt3: "#94A3B8",
  accent: "#2563EB", danger: "#DC2626", success: "#16A34A",
  nav: "#1E293B",
};

const ROLES = [
  { value: "basic",   label: "기본",   desc: "대시보드·리포트·인사이트·심플대시보드·분석방법", color: "#3B82F6" },
  { value: "analyst", label: "분석가", desc: "기본 + 뉴스핌분석",                             color: "#8B5CF6" },
  { value: "admin",   label: "관리자", desc: "전체 메뉴 + 피드관리·계정관리",                 color: "#EF4444" },
];

function RoleBadge({ role }) {
  const r = ROLES.find(x => x.value === role) || ROLES[0];
  return (
    <span style={{ background: r.color + "18", color: r.color, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 12 }}>
      {r.label}
    </span>
  );
}

function AccountForm({ initial, onSave, onCancel, selfId }) {
  const isEdit = !!initial;
  const [name,     setName]     = useState(initial?.name || "");
  const [role,     setRole]     = useState(initial?.role || "basic");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [saving,   setSaving]   = useState(false);
  const [err,      setErr]      = useState("");

  async function handleSave() {
    if (!name.trim()) { setErr("이름을 입력하세요"); return; }
    if (!isEdit && !password) { setErr("비밀번호를 입력하세요"); return; }
    if (password && password !== confirm) { setErr("비밀번호가 일치하지 않습니다"); return; }
    if (password && password.length < 6) { setErr("비밀번호는 6자 이상이어야 합니다"); return; }
    if (isEdit && initial.id === selfId && role !== initial.role) {
      setErr("자신의 역할은 변경할 수 없습니다"); return;
    }
    setSaving(true); setErr("");
    try {
      const payload = { name: name.trim(), role };
      if (password) payload.password = password;
      await onSave(payload);
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.accent}`, borderRadius: 8, padding: 20, marginBottom: 16 }}>
      <h3 style={{ margin: "0 0 16px", fontSize: 15, color: C.txt1, fontWeight: 700 }}>
        {isEdit ? "계정 편집" : "새 계정 추가"}
      </h3>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label style={{ fontSize: 12, color: C.txt2, display: "block", marginBottom: 4 }}>이름</label>
          <input value={name} onChange={e => setName(e.target.value)}
            placeholder="예: 홍길동"
            style={{ width: "100%", padding: "8px 10px", border: `1px solid ${C.border}`, borderRadius: 5, fontSize: 14, boxSizing: "border-box" }} />
        </div>
        <div>
          <label style={{ fontSize: 12, color: C.txt2, display: "block", marginBottom: 4 }}>역할</label>
          <select value={role} onChange={e => setRole(e.target.value)}
            disabled={isEdit && initial.id === selfId}
            style={{ width: "100%", padding: "8px 10px", border: `1px solid ${C.border}`, borderRadius: 5, fontSize: 14, background: "#fff", boxSizing: "border-box" }}>
            {ROLES.map(r => <option key={r.value} value={r.value}>{r.label} — {r.desc}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, color: C.txt2, display: "block", marginBottom: 4 }}>
            비밀번호{isEdit && " (변경 시만 입력)"}
          </label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder={isEdit ? "변경하지 않으면 빈칸" : "6자 이상"}
            style={{ width: "100%", padding: "8px 10px", border: `1px solid ${C.border}`, borderRadius: 5, fontSize: 14, boxSizing: "border-box" }} />
        </div>
        <div>
          <label style={{ fontSize: 12, color: C.txt2, display: "block", marginBottom: 4 }}>비밀번호 확인</label>
          <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
            placeholder="동일하게 입력"
            style={{ width: "100%", padding: "8px 10px", border: `1px solid ${C.border}`, borderRadius: 5, fontSize: 14, boxSizing: "border-box" }} />
        </div>
      </div>

      {/* 역할 설명 */}
      <div style={{ background: "#F8FAFC", border: `1px solid ${C.border}`, borderRadius: 6, padding: "10px 14px", marginBottom: 14 }}>
        {ROLES.map(r => (
          <div key={r.value} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: r.value !== "admin" ? 6 : 0 }}>
            <RoleBadge role={r.value} />
            <span style={{ fontSize: 12, color: C.txt2, lineHeight: 1.5 }}>{r.desc}</span>
          </div>
        ))}
      </div>

      {err && <div style={{ color: C.danger, fontSize: 13, background: "#FEF2F2", border: `1px solid #FECACA`, borderRadius: 5, padding: "8px 12px", marginBottom: 12 }}>{err}</div>}

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button onClick={onCancel}
          style={{ padding: "7px 16px", background: "#F8FAFC", border: `1px solid ${C.border}`, borderRadius: 5, fontSize: 13, cursor: "pointer" }}>
          취소
        </button>
        <button onClick={handleSave} disabled={saving}
          style={{ padding: "7px 18px", background: saving ? C.txt3 : C.accent, color: "#fff", border: "none", borderRadius: 5, fontSize: 13, cursor: "pointer", fontWeight: 600 }}>
          {saving ? "저장 중..." : "저장"}
        </button>
      </div>
    </div>
  );
}

export default function AccountManager() {
  const [accounts,   setAccounts]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showAdd,    setShowAdd]    = useState(false);
  const [editingId,  setEditingId]  = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [msg,        setMsg]        = useState({ text: "", ok: true });
  const selfName = getName();

  async function load() {
    try {
      const res  = await fetch("/api/accounts");
      const data = await res.json();
      setAccounts(data.accounts || []);
    } catch { setAccounts([]); }
    finally  { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function flash(text, ok = true) {
    setMsg({ text, ok });
    setTimeout(() => setMsg({ text: "", ok: true }), 3000);
  }

  // 자기 자신 ID: 이름으로 매핑
  const selfAccount = accounts.find(a => a.name === selfName);
  const selfId      = selfAccount?.id;

  async function handleAdd(payload) {
    const res  = await fetch("/api/accounts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "추가 실패");
    setShowAdd(false);
    await load();
    flash(`'${payload.name}' 계정이 추가되었습니다.`);
  }

  async function handleEdit(id, payload) {
    const res  = await fetch(`/api/accounts/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "수정 실패");
    setEditingId(null);
    await load();
    flash(`'${payload.name}' 계정이 수정되었습니다.`);
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`'${name}' 계정을 삭제하시겠습니까?`)) return;
    setDeletingId(id);
    try {
      const res  = await fetch(`/api/accounts/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await load();
      flash(`'${name}' 계정이 삭제되었습니다.`);
    } catch (e) {
      flash(e.message, false);
    } finally {
      setDeletingId(null);
    }
  }

  const createdAt = (iso) => {
    if (!iso) return "-";
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,"0")}.${String(d.getDate()).padStart(2,"0")}`;
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif" }}>
      <Nav current="/accounts" />

      <div style={{ maxWidth: 780, margin: "0 auto", padding: "32px 20px" }}>

        {/* 헤더 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.txt1 }}>계정 관리</h1>
            <p style={{ margin: "4px 0 0", color: C.txt2, fontSize: 13 }}>비밀번호 및 접근 권한을 관리합니다 (관리자 전용)</p>
          </div>
          <button onClick={() => { setShowAdd(v => !v); setEditingId(null); }}
            style={{ padding: "8px 18px", background: showAdd ? "#64748B" : C.accent, color: "#fff", border: "none", borderRadius: 6, fontSize: 14, cursor: "pointer", fontWeight: 600 }}>
            {showAdd ? "취소" : "+ 계정 추가"}
          </button>
        </div>

        {/* 플래시 */}
        {msg.text && (
          <div style={{ background: msg.ok ? "#F0FDF4" : "#FEF2F2", border: `1px solid ${msg.ok ? "#BBF7D0" : "#FECACA"}`, color: msg.ok ? C.success : C.danger, padding: "10px 14px", borderRadius: 6, marginBottom: 16, fontSize: 13 }}>
            {msg.text}
          </div>
        )}

        {/* 추가 폼 */}
        {showAdd && (
          <AccountForm selfId={selfId} onSave={handleAdd} onCancel={() => setShowAdd(false)} />
        )}

        {/* 역할별 권한 요약 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 24 }}>
          {ROLES.map(r => (
            <div key={r.value} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "12px 14px" }}>
              <div style={{ marginBottom: 6 }}><RoleBadge role={r.value} /></div>
              <div style={{ fontSize: 12, color: C.txt2, lineHeight: 1.6 }}>{r.desc}</div>
            </div>
          ))}
        </div>

        {/* 계정 목록 */}
        <section>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: C.txt2, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            전체 계정 ({loading ? "…" : accounts.length})
          </h2>

          {loading ? (
            <div style={{ textAlign: "center", color: C.txt3, padding: 32, fontSize: 14 }}>불러오는 중...</div>
          ) : accounts.length === 0 ? (
            <div style={{ textAlign: "center", color: C.txt3, padding: 32, fontSize: 14 }}>계정이 없습니다</div>
          ) : accounts.map(acc => (
            <div key={acc.id}>
              {editingId === acc.id ? (
                <AccountForm
                  initial={acc}
                  selfId={selfId}
                  onSave={payload => handleEdit(acc.id, payload)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "14px 16px", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: ROLES.find(r=>r.value===acc.role)?.color + "20", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 16 }}>👤</span>
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: C.txt1, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
                        {acc.name}
                        {acc.id === selfId && <span style={{ fontSize: 10, background: "#FEF9C3", color: "#A16207", padding: "1px 6px", borderRadius: 8, fontWeight: 600 }}>나</span>}
                      </div>
                      <div style={{ fontSize: 12, color: C.txt3, marginTop: 1 }}>생성: {createdAt(acc.createdAt)}{acc.updatedAt ? ` · 수정: ${createdAt(acc.updatedAt)}` : ""}</div>
                    </div>
                    <RoleBadge role={acc.role} />
                  </div>

                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button onClick={() => { setEditingId(acc.id); setShowAdd(false); }}
                      style={{ padding: "5px 14px", background: "#F1F5F9", border: `1px solid ${C.border}`, borderRadius: 5, fontSize: 12, cursor: "pointer", color: C.txt2, fontWeight: 500 }}>
                      편집
                    </button>
                    <button
                      onClick={() => handleDelete(acc.id, acc.name)}
                      disabled={deletingId === acc.id || acc.id === selfId}
                      title={acc.id === selfId ? "자신의 계정은 삭제할 수 없습니다" : ""}
                      style={{ padding: "5px 14px", background: acc.id === selfId ? "#F1F5F9" : "#FEF2F2", border: `1px solid ${acc.id === selfId ? C.border : "#FECACA"}`, borderRadius: 5, fontSize: 12, cursor: acc.id === selfId ? "not-allowed" : "pointer", color: acc.id === selfId ? C.txt3 : C.danger, fontWeight: 500 }}>
                      {deletingId === acc.id ? "삭제 중…" : "삭제"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </section>

        {/* 보안 안내 */}
        <div style={{ marginTop: 32, background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, padding: "14px 16px" }}>
          <div style={{ fontWeight: 600, color: "#92400E", fontSize: 13, marginBottom: 6 }}>보안 안내</div>
          <ul style={{ margin: 0, paddingLeft: 16, color: "#78350F", fontSize: 12, lineHeight: 1.8 }}>
            <li>비밀번호는 scrypt 알고리즘으로 해시되어 저장됩니다. 원문은 복구할 수 없습니다.</li>
            <li>로그인 실패가 10회를 초과하면 IP당 15분간 접근이 차단됩니다.</li>
            <li>세션 토큰은 서버 재시작 시 초기화됩니다 (재로그인 필요).</li>
            <li>관리자 계정은 최소 1개 이상 유지해야 합니다.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
