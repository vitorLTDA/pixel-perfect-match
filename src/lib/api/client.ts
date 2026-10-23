import { ApiError } from "./errors";

/**
 * API mode: "mock" (default) uses the in-memory adapter in src/mocks.
 * Set VITE_API_MODE=real and VITE_API_BASE_URL=https://api.example.com to use the
 * real Express backend. Auth relies on the backend's HttpOnly session cookie
 * (credentials: "include"); no tokens are stored client-side.
 */
export const API_MODE: "mock" | "real" = import.meta.env.VITE_API_MODE === "real" ? "real" : "mock";
const BASE = `${(import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "")}/api/v1`;

type Query = Record<string, string | number | undefined | null>;

function qs(query?: Query) {
  if (!query) return "";
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : "";
}

export async function request<T>(method: string, path: string, opts: { body?: unknown; query?: Query } = {}): Promise<T> {
  const full = path + qs(opts.query);
  if (API_MODE === "mock") {
    const { mockRequest } = await import("@/mocks/adapter");
    return mockRequest<T>(method, full, opts.body);
  }
  let res: Response;
  try {
    res = await fetch(BASE + full, {
      method,
      credentials: "include",
      headers: opts.body ? { "Content-Type": "application/json" } : undefined,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
  } catch {
    throw new ApiError(0, "NETWORK", "Can't reach the server. Check your connection.");
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(res.status, data?.error?.code ?? "ERROR", data?.error?.message ?? "Request failed.");
  }
  return data as T;
}
