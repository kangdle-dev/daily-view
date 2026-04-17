import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "../App.jsx";
import Dashboard from "./Dashboard.jsx";
import Report from "./Report.jsx";
import Login from "./Login.jsx";
import Insight from "./Insight.jsx";
import { isLoggedIn } from "./useAuth.js";

function AuthGuard({ children }) {
  const [authed, setAuthed] = useState(isLoggedIn());
  if (!authed) return <Login onSuccess={() => setAuthed(true)} />;
  return children;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthGuard>
        <Routes>
          <Route path="/*" element={<App />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/report" element={<Report />} />
          <Route path="/insight" element={<Insight />} />
        </Routes>
      </AuthGuard>
    </BrowserRouter>
  </StrictMode>
);
