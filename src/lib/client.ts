export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export function notifyAuth() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("wx-auth"));
}

export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("content-type")) headers.set("content-type", "application/json");
  if (typeof window !== "undefined") {
    const simulated = sessionStorage.getItem("wx-dev-ip");
    if (simulated && !headers.has("x-weixiang-dev-ip")) headers.set("x-weixiang-dev-ip", simulated);
  }
  const response = await fetch(url, { ...init, headers, cache: "no-store" });
  const data = (await response.json().catch(() => ({}))) as { message?: string; code?: string };
  if (!response.ok) throw new ApiError(data.message || "请求失败", response.status, data.code);
  return data as T;
}
