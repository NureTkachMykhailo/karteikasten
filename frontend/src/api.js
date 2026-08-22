const API_BASE = localStorage.getItem("api_base") || "http://localhost:8000";

export function getToken() {
  return localStorage.getItem("token");
}
export function setToken(token) {
  localStorage.setItem("token", token);
}
export function clearToken() {
  localStorage.removeItem("token");
}

export async function api(path, options = {}) {
  const token = getToken();
  const lang = localStorage.getItem("lang") || "de";
  const headers = {
    "Content-Type": "application/json",
    "X-Lang": lang,
    ...(options.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(API_BASE + path, { ...options, headers });
  if (!res.ok) {
    let msg = "Serverfehler";
    try {
      msg = (await res.json()).detail || msg;
    } catch {
      /* body wasn't JSON */
    }
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return null;
  return res.json();
}
