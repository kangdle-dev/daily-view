export const ALL_NAV = [
  { href: "/dashboard",   label: "대시보드",    mLabel: "📰", roles: ["basic", "analyst", "admin"] },
  { href: "/report",      label: "리포트",      mLabel: "📊", roles: ["basic", "analyst", "admin"] },
  { href: "/insight",     label: "인사이트",    mLabel: "💡", roles: ["basic", "analyst", "admin"] },
  { href: "/simple",      label: "심플대시보드", mLabel: "🖨️", roles: ["basic", "analyst", "admin"] },
  { href: "/newspim",     label: "뉴스핌분석",  mLabel: "📈", roles: ["analyst", "admin"] },
  { href: "/feeds",       label: "피드관리",    mLabel: "⚙️", roles: ["admin"] },
  { href: "/methodology", label: "분석방법",    mLabel: "📐", roles: ["basic", "analyst", "admin"] },
  { href: "/accounts",    label: "계정관리",    mLabel: "👤", roles: ["admin"] },
];

export function getNav(role) {
  if (!role) return [];
  return ALL_NAV.filter(n => n.roles.includes(role));
}
