const KEY = "dv_auth";

export function isLoggedIn() {
  return sessionStorage.getItem(KEY) === "1";
}

export function login() {
  sessionStorage.setItem(KEY, "1");
}

export function logout() {
  sessionStorage.removeItem(KEY);
}
