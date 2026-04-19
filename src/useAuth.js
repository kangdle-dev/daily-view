const KEY = "dv_auth";

function parse() {
  try { return JSON.parse(sessionStorage.getItem(KEY) || "null"); }
  catch { return null; }
}

export function isLoggedIn() { return !!getToken(); }
export function getToken()   { return parse()?.token || null; }
export function getRole()    { return parse()?.role  || null; }
export function getName()    { return parse()?.name  || null; }
export function getRoutes()  { return parse()?.routes || []; }
export function hasRoute(path) { return getRoutes().includes(path); }

export function login(data) {
  sessionStorage.setItem(KEY, JSON.stringify(data));
}

export function logout() {
  const token = getToken();
  if (token) {
    fetch("/api/auth/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  }
  sessionStorage.removeItem(KEY);
}
