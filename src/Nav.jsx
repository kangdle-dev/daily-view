import { useState, useEffect } from "react";
import {
  LayoutDashboard, FileBarChart2, Lightbulb, Printer,
  TrendingUp, Rss, BookOpen, Users, LogOut, ChevronDown, Settings,
  SlidersHorizontal, Activity,
} from "lucide-react";
import { getNav } from "./navConfig.js";
import { getRole, getName, logout } from "./useAuth.js";

const ICON_MAP = {
  LayoutDashboard, FileBarChart2, Lightbulb, Printer,
  TrendingUp, Rss, BookOpen, Users, Settings, SlidersHorizontal, Activity,
};

function NavIcon({ name, size = 15 }) {
  const Icon = ICON_MAP[name];
  return Icon ? <Icon size={size} strokeWidth={1.8} /> : null;
}

function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return mobile;
}

// 단일 링크 메뉴 아이템
function NavLink({ item, current, isMobile }) {
  const active = item.href === current;
  return (
    <a href={item.href} style={{
      display: "flex",
      alignItems: "center",
      gap: isMobile ? 0 : 6,
      padding: isMobile ? "7px 10px" : "6px 11px",
      borderRadius: 6,
      textDecoration: "none",
      color:      active ? "#fff" : "rgba(148,163,184,0.9)",
      background: active ? "rgba(99,102,241,0.18)" : "transparent",
      fontWeight: active ? 600 : 400,
      fontSize: 13,
      whiteSpace: "nowrap",
      flexShrink: 0,
      transition: "background 0.15s, color 0.15s",
      borderBottom: active ? "2px solid #6366F1" : "2px solid transparent",
    }}>
      <span style={{ color: active ? "#818CF8" : "rgba(100,116,139,0.9)", display: "flex", alignItems: "center" }}>
        <NavIcon name={item.icon} size={15} />
      </span>
      {!isMobile && item.label}
    </a>
  );
}

// 드롭다운 메뉴 아이템 (children 있는 경우)
function NavDropdown({ item, current, isMobile }) {
  const [open, setOpen] = useState(false);
  const active = item.children.some(c => c.href === current);

  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: isMobile ? 0 : 6,
          padding: isMobile ? "7px 10px" : "6px 11px",
          borderRadius: 6,
          background: active ? "rgba(99,102,241,0.18)" : "transparent",
          border: "none",
          color:      active ? "#fff" : "rgba(148,163,184,0.9)",
          fontWeight: active ? 600 : 400,
          fontSize: 13,
          whiteSpace: "nowrap",
          cursor: "pointer",
          transition: "background 0.15s, color 0.15s",
          borderBottom: active ? "2px solid #6366F1" : "2px solid transparent",
        }}
      >
        <span style={{ color: active ? "#818CF8" : "rgba(100,116,139,0.9)", display: "flex", alignItems: "center" }}>
          <NavIcon name={item.icon} size={15} />
        </span>
        {!isMobile && item.label}
        {!isMobile && (
          <ChevronDown size={11} color={active ? "#818CF8" : "#64748B"}
            style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s" }} />
        )}
      </button>

      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 299 }} onClick={() => setOpen(false)} />
          <div style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0,
            background: "#1E293B",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8,
            padding: "4px",
            minWidth: 140,
            zIndex: 300,
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          }}>
            {item.children.map(child => {
              const childActive = child.href === current;
              return (
                <a key={child.href} href={child.href} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "7px 10px",
                  borderRadius: 5,
                  textDecoration: "none",
                  color:      childActive ? "#fff" : "#94A3B8",
                  background: childActive ? "rgba(99,102,241,0.2)" : "transparent",
                  fontWeight: childActive ? 600 : 400,
                  fontSize: 13,
                  whiteSpace: "nowrap",
                  transition: "background 0.15s, color 0.15s",
                }}>
                  <span style={{ color: childActive ? "#818CF8" : "#64748B", display: "flex", alignItems: "center" }}>
                    <NavIcon name={child.icon} size={13} />
                  </span>
                  {child.label}
                </a>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default function Nav({ current }) {
  const isMobile = useIsMobile();
  const role     = getRole();
  const name     = getName();
  const navItems = getNav(role);
  const [showUser, setShowUser] = useState(false);

  function handleLogout() {
    logout();
    window.location.href = "/";
  }

  return (
    <nav style={{
      background: "#0F172A",
      borderBottom: "1px solid rgba(255,255,255,0.07)",
      padding: "0 16px",
      display: "flex",
      alignItems: "center",
      height: 52,
      position: "sticky",
      top: 0,
      zIndex: 200,
      gap: 0,
    }}>
      {/* 로고 */}
      <a href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", marginRight: 20, flexShrink: 0 }}>
        <div style={{
          width: 28, height: 28,
          background: "linear-gradient(135deg,#3B82F6,#6366F1)",
          borderRadius: 7,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 0 1px rgba(99,102,241,0.4)",
        }}>
          <span style={{ fontWeight: 900, fontSize: 13, color: "#fff", letterSpacing: -1 }}>D</span>
        </div>
        {!isMobile && (
          <span style={{ color: "#F1F5F9", fontWeight: 700, fontSize: 14, letterSpacing: -0.3 }}>
            Daily<span style={{ color: "#6366F1" }}>View</span>
          </span>
        )}
      </a>

      {/* 구분선 */}
      {!isMobile && <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.1)", marginRight: 16 }} />}

      {/* 메뉴 아이템 */}
      <div style={{ display: "flex", alignItems: "center", gap: 2, flex: 1, minWidth: 0 }}>
        {navItems.map(n =>
          n.children
            ? <NavDropdown key={n.label} item={n} current={current} isMobile={isMobile} />
            : <NavLink    key={n.href}  item={n} current={current} isMobile={isMobile} />
        )}
      </div>

      {/* 유저 메뉴 */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <button
          onClick={() => setShowUser(v => !v)}
          style={{
            display: "flex", alignItems: "center", gap: 7,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 7,
            padding: isMobile ? "5px 8px" : "5px 12px",
            cursor: "pointer",
            color: "#94A3B8",
          }}
        >
          <div style={{
            width: 22, height: 22,
            background: "linear-gradient(135deg,#3B82F6,#6366F1)",
            borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <Users size={11} color="#fff" strokeWidth={2} />
          </div>
          {!isMobile && <span style={{ fontSize: 12, color: "#CBD5E1", maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>}
          {!isMobile && <ChevronDown size={12} color="#64748B" />}
        </button>

        {showUser && (
          <>
            <div style={{ position: "fixed", inset: 0, zIndex: 299 }} onClick={() => setShowUser(false)} />
            <div style={{
              position: "absolute", top: "calc(100% + 6px)", right: 0,
              background: "#1E293B",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              padding: "6px",
              minWidth: 160,
              zIndex: 300,
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            }}>
              <div style={{ padding: "8px 10px", borderBottom: "1px solid rgba(255,255,255,0.08)", marginBottom: 4 }}>
                <div style={{ color: "#F1F5F9", fontSize: 13, fontWeight: 600 }}>{name}</div>
                <div style={{ color: "#64748B", fontSize: 11, marginTop: 1 }}>
                  {role === "admin" ? "관리자" : role === "analyst" ? "분석가" : "기본 사용자"}
                </div>
              </div>
              <button onClick={handleLogout} style={{
                display: "flex", alignItems: "center", gap: 8,
                width: "100%", padding: "7px 10px",
                background: "transparent", border: "none", borderRadius: 5,
                color: "#94A3B8", fontSize: 13, cursor: "pointer",
                textAlign: "left",
              }}>
                <LogOut size={13} strokeWidth={1.8} />
                로그아웃
              </button>
            </div>
          </>
        )}
      </div>
    </nav>
  );
}
