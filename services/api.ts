/**
 * Cliente HTTP tipado para a API de coleções.
 * Envia o usuário logado no header x-user (log de auditoria).
 */
import type { CollectionName } from "@/types";

function userHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem("rh_user");
    if (!raw) return {};
    const u = JSON.parse(raw);
    return { "x-user": u?.nome ?? "desconhecido" };
  } catch {
    return {};
  }
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let msg = `Erro ${res.status}`;
    try {
      const j = await res.json();
      if (j?.error) msg = j.error;
    } catch { /* corpo vazio */ }
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

export const api = {
  list<T>(col: CollectionName): Promise<T[]> {
    return fetch(`/api/data/${col}`, { cache: "no-store" }).then((r) => handle<T[]>(r));
  },

  create<T>(col: CollectionName, item: Partial<T> | Partial<T>[]): Promise<T> {
    return fetch(`/api/data/${col}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...userHeader() },
      body: JSON.stringify(item),
    }).then((r) => handle<T>(r));
  },

  update<T>(col: CollectionName, id: string, patch: Partial<T>): Promise<T> {
    return fetch(`/api/data/${col}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...userHeader() },
      body: JSON.stringify(patch),
    }).then((r) => handle<T>(r));
  },

  remove(col: CollectionName, id: string): Promise<void> {
    return fetch(`/api/data/${col}/${id}`, { method: "DELETE", headers: userHeader() }).then((r) =>
      handle<void>(r)
    );
  },

  async upload(file: File): Promise<{ path: string; nome: string }> {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    return handle(res);
  },

  backup: {
    download: () => window.open("/api/backup", "_blank"),
    restore: (json: unknown) =>
      fetch("/api/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...userHeader() },
        body: JSON.stringify(json),
      }).then((r) => handle<{ ok: boolean }>(r)),
    reset: () =>
      fetch("/api/backup", { method: "DELETE", headers: userHeader() }).then((r) =>
        handle<{ ok: boolean }>(r)
      ),
  },
};
