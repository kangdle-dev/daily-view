import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./Dashboard.jsx";
import Report from "./Report.jsx";
import Insight from "./Insight.jsx";
import SimpleDashboard from "./SimpleDashboard.jsx";
import NewspimAnalysis from "./NewspimAnalysis.jsx";
import FeedsManager from "./FeedsManager.jsx";
import Methodology from "./Methodology.jsx";
import AccountManager from "./AccountManager.jsx";
import Login from "./Login.jsx";
import { isLoggedIn, getToken, hasRoute } from "./useAuth.js";

// ── 모든 /api 요청에 Bearer 토큰 자동 첨부 ───────────────
const _origFetch = window.fetch;
window.fetch = (url, opts = {}) => {
  if (typeof url === "string" && url.startsWith("/api")) {
    const token = getToken();
    if (token) {
      opts = { ...opts, headers: { Authorization: `Bearer ${token}`, ...opts.headers } };
    }
  }
  return _origFetch(url, opts);
};

function AuthGuard({ children }) {
  const [authed, setAuthed] = useState(isLoggedIn());
  if (!authed) return <Login onSuccess={() => setAuthed(true)} />;
  return children;
}

// 해당 경로에 대한 권한이 없으면 /dashboard로 리다이렉트
function PermGuard({ route, children }) {
  if (!hasRoute(route)) return <Navigate to="/dashboard" replace />;
  return children;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthGuard>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/report"    element={<Report />} />
          <Route path="/insight"   element={<Insight />} />
          <Route path="/simple"    element={<SimpleDashboard />} />
          <Route path="/methodology" element={<Methodology />} />
          <Route path="/newspim" element={
            <PermGuard route="/newspim"><NewspimAnalysis /></PermGuard>
          } />
          <Route path="/feeds" element={
            <PermGuard route="/feeds"><FeedsManager /></PermGuard>
          } />
          <Route path="/accounts" element={
            <PermGuard route="/accounts"><AccountManager /></PermGuard>
          } />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthGuard>
    </BrowserRouter>
  </StrictMode>
);
