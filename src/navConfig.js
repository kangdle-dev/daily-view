export const ALL_NAV = [
  { href: "/dashboard",   label: "대시보드",    icon: "LayoutDashboard", roles: ["basic", "analyst", "admin"] },
  { href: "/report",      label: "리포트",      icon: "FileBarChart2",   roles: ["basic", "analyst", "admin"] },
  { href: "/insight",     label: "인사이트",    icon: "Lightbulb",       roles: ["basic", "analyst", "admin"] },
  { href: "/simple",      label: "심플대시보드", icon: "Printer",         roles: ["basic", "analyst", "admin"] },
  { href: "/newspim",     label: "뉴스핌분석",  icon: "TrendingUp",      roles: ["analyst", "admin"] },
  { href: "/feeds",       label: "피드관리",    icon: "Rss",             roles: ["admin"] },
  { href: "/settings",    label: "설정",        icon: "Settings",        roles: ["admin"] },
  { href: "/methodology", label: "분석방법",    icon: "BookOpen",        roles: ["basic", "analyst", "admin"] },
  { href: "/accounts",    label: "계정관리",    icon: "Users",           roles: ["admin"] },
];

export function getNav(role) {
  if (!role) return [];
  return ALL_NAV.filter(n => n.roles.includes(role));
}
