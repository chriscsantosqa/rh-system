"use client";
/**
 * Autenticação local de demonstração + controle de permissões (RBAC).
 * O usuário é persistido em localStorage; papéis: admin, rh, gerente, consulta.
 */
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Papel, Usuario } from "@/types";

/** Ações controladas por papel */
export type Permissao =
  | "editar"            // criar/editar/excluir registros operacionais
  | "pagar_vt"          // registrar pagamentos de VT
  | "configuracoes"     // lojas, horários, feriados
  | "usuarios"          // gerenciar usuários
  | "backup"            // backup/restauração/reset
  | "auditoria";        // ver log de auditoria

const MATRIZ: Record<Papel, Permissao[]> = {
  admin: ["editar", "pagar_vt", "configuracoes", "usuarios", "backup", "auditoria"],
  rh: ["editar", "pagar_vt", "configuracoes", "auditoria"],
  gerente: ["editar"],
  consulta: [],
};

interface AuthCtx {
  user: Usuario | null;
  pronto: boolean;
  login: (u: Usuario) => void;
  logout: () => void;
  can: (p: Permissao) => boolean;
}

const Ctx = createContext<AuthCtx>({
  user: null,
  pronto: false,
  login: () => {},
  logout: () => {},
  can: () => false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [pronto, setPronto] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    try {
      const raw = localStorage.getItem("rh_user");
      if (raw) setUser(JSON.parse(raw));
    } catch { /* ignora */ }
    setPronto(true);
  }, []);

  // proteção de rotas: sem usuário → /login
  useEffect(() => {
    if (!pronto) return;
    if (!user && pathname !== "/login") router.replace("/login");
    if (user && pathname === "/login") router.replace("/");
  }, [pronto, user, pathname, router]);

  const login = useCallback((u: Usuario) => {
    localStorage.setItem("rh_user", JSON.stringify(u));
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("rh_user");
    setUser(null);
  }, []);

  const can = useCallback(
    (p: Permissao) => (user ? MATRIZ[user.papel].includes(p) : false),
    [user]
  );

  return <Ctx.Provider value={{ user, pronto, login, logout, can }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
