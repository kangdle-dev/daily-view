import { useState, useEffect } from "react";
import { getNav } from "./navConfig.js";
import { getRole, getName, logout } from "./useAuth.js";

function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth < 640);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 640);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return mobile;
}

export default function Nav({ current }) {
  const isMobile = useIsMobile();
  const role = getRole();
  const name = getName();
  const navItems = getNav(role);

  function handleLogout() {
    logout();
    window.location.href = "/";
  }

  return (
    <nav style={{
      background: "#1E293B",
      padding: isMobile ? "0 8px" : "0 20px",
      display: "flex",
      alignItems: "center",
      gap: 2,
      height: 52,
      position: "sticky",
      top: 0,
      zIndex: 100,
      overflowX: "auto",
    }}>
      {navItems.map(n => (
        <a key={n.href} href={n.href} style={{
          color: n.href === current ? "#FFFFFF" : "#94A3B8",
          textDecoration: "none",
          padding: isMobile ? "6px 8px" : "6px 12px",
          borderRadius: 6,
          fontSize: isMobile ? 18 : 13,
          background: n.href === current ? "rgba(255,255,255,0.12)" : "transparent",
          fontWeight: n.href === current ? 600 : 400,
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}>
          {isMobile ? n.mLabel : n.label}
        </a>
      ))}

      {/* 사용자 정보 + 로그아웃 */}
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        {!isMobile && name && (
          <span style={{ color: "#64748B", fontSize: 12 }}>{name}</span>
        )}
        <button onClick={handleLogout} style={{
          background: "transparent",
          border: "1px solid #334155",
          color: "#64748B",
          borderRadius: 5,
          padding: "4px 10px",
          fontSize: 12,
          cursor: "pointer",
        }}>
          {isMobile ? "↩" : "로그아웃"}
        </button>
      </div>
    </nav>
  );
}
