// Thin fetch wrapper around the Spring Boot REST API.
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

export type AuthUser = { token: string; id: number; fullName: string; email: string; role: "STUDENT" | "ADMIN" | "OFFICER" };

const KEY = "rupp_auth";

export function getAuth(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
export function setAuth(u: AuthUser | null) {
  if (u) localStorage.setItem(KEY, JSON.stringify(u));
  else localStorage.removeItem(KEY);
}

async function request(path: string, opts: { method?: string; body?: any; form?: FormData } = {}) {
  const auth = getAuth();
  const headers: Record<string, string> = {};
  if (auth) headers["Authorization"] = `Bearer ${auth.token}`;
  let body: BodyInit | undefined;
  if (opts.form) body = opts.form;
  else if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.body);
  }
  const res = await fetch(`${API}${path}`, { method: opts.method || (body ? "POST" : "GET"), headers, body });
  if (res.status === 401 && auth && !path.startsWith("/auth")) {
    setAuth(null);
    if (typeof window !== "undefined") window.location.href = "/login";
  }
  return res;
}

export async function api<T = any>(path: string, opts: { method?: string; body?: any; form?: FormData } = {}): Promise<T> {
  const res = await request(path, opts);
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(data?.message || `Request failed (${res.status})`);
  return data as T;
}

/** Opens a protected file (e.g. an applicant document) in a new tab. */
export async function openFile(path: string) {
  const res = await request(path);
  if (!res.ok) throw new Error("Could not open the file");
  const blob = await res.blob();
  window.open(URL.createObjectURL(blob), "_blank");
}

export const fmtDate = (s?: string | null) =>
  s ? new Date(s).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "—";
