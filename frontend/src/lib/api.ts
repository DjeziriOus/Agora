import { API_URL } from "@/config";
const BASE_URL = API_URL;

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      message = body?.message ?? body?.error ?? message;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(res.status, message);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ── Products ────────────────────────────────────────────────────────────────
export const productsApi = {
  getAll: (params?: Record<string, string | undefined>) => {
    const qs = params
      ? "?" + new URLSearchParams(
          Object.fromEntries(
            Object.entries(params).filter(([, v]) => v !== undefined)
          ) as Record<string, string>
        ).toString()
      : "";
    return apiFetch<{ products: unknown[]; total: number }>(`/api/products${qs}`);
  },
  getById: (id: string) => apiFetch<unknown>(`/api/products/${id}`),
  getMine: () => apiFetch<unknown[]>(`/api/products/mine`),
  create: (data: unknown) =>
    apiFetch<unknown>("/api/products", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: unknown) =>
    apiFetch<unknown>(`/api/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiFetch<void>(`/api/products/${id}`, { method: "DELETE" }),
};

// ── Shops ────────────────────────────────────────────────────────────────────
export const shopsApi = {
  getById: (id: string) => apiFetch<unknown>(`/api/shops/${id}`),
  create: (data: unknown) =>
    apiFetch<unknown>("/api/shops", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: unknown) =>
    apiFetch<unknown>(`/api/shops/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

// ── Orders ───────────────────────────────────────────────────────────────────
export const ordersApi = {
  getAll: () => apiFetch<unknown[]>("/api/orders"),
  create: (data: unknown) =>
    apiFetch<unknown>("/api/orders", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ── Addresses ────────────────────────────────────────────────────────────────
export const addressesApi = {
  getAll: () => apiFetch<unknown[]>("/api/addresses"),
  create: (data: unknown) =>
    apiFetch<unknown>("/api/addresses", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: unknown) =>
    apiFetch<unknown>(`/api/addresses/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiFetch<void>(`/api/addresses/${id}`, { method: "DELETE" }),
  setDefault: (id: string) =>
    apiFetch<unknown>(`/api/addresses/${id}/default`, { method: "PATCH" }),
};
