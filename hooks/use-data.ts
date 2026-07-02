"use client";
/**
 * Hook central de dados: carrega coleções da API com cache global em memória
 * e permite `refresh()` após mutações. Aplica o escopo do papel "gerente"
 * (enxerga apenas a própria loja).
 */
import { useCallback, useEffect, useState } from "react";
import { api } from "@/services/api";
import { useAuth } from "@/lib/auth";
import type {
  ASO, Atestado, BancoHorasEntry, CollectionName, Documento, EscalaEntry,
  Feriado, Funcionario, Horario, Loja, Usuario, VTConfig, VTPagamento,
} from "@/types";

/* ---------- mini-store global com assinantes ---------- */
const cache = new Map<CollectionName, unknown[]>();
const listeners = new Set<() => void>();
let pending: Promise<void> | null = null;

const ALL: CollectionName[] = [
  "lojas", "horarios", "funcionarios", "escalas", "bancoHoras", "atestados",
  "vtConfigs", "vtPagamentos", "asos", "documentos", "usuarios", "feriados", "auditoria",
];

async function loadAll(): Promise<void> {
  const results = await Promise.all(ALL.map((c) => api.list(c)));
  ALL.forEach((c, i) => cache.set(c, results[i]));
  listeners.forEach((fn) => fn());
}

/** Recarrega tudo (chamado após qualquer mutação) */
export async function refreshData(): Promise<void> {
  pending = loadAll();
  await pending;
}

export interface DBData {
  lojas: Loja[];
  horarios: Horario[];
  funcionarios: Funcionario[];
  escalas: EscalaEntry[];
  bancoHoras: BancoHorasEntry[];
  atestados: Atestado[];
  vtConfigs: VTConfig[];
  vtPagamentos: VTPagamento[];
  asos: ASO[];
  documentos: Documento[];
  usuarios: Usuario[];
  feriados: Feriado[];
  auditoria: any[];
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useData(): DBData {
  const { user } = useAuth();
  const [, force] = useState(0);
  const [loading, setLoading] = useState(cache.size === 0);

  useEffect(() => {
    const fn = () => force((x) => x + 1);
    listeners.add(fn);
    if (cache.size === 0 && !pending) {
      pending = loadAll();
    }
    if (pending) {
      pending.finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
    return () => { listeners.delete(fn); };
  }, []);

  const refresh = useCallback(async () => {
    await refreshData();
  }, []);

  const get = <T,>(c: CollectionName): T[] => (cache.get(c) as T[]) ?? [];

  let funcionarios = get<Funcionario>("funcionarios");
  let atestados = get<Atestado>("atestados");
  let escalas = get<EscalaEntry>("escalas");
  let bancoHoras = get<BancoHorasEntry>("bancoHoras");
  let vtConfigs = get<VTConfig>("vtConfigs");
  let vtPagamentos = get<VTPagamento>("vtPagamentos");
  let asos = get<ASO>("asos");
  let documentos = get<Documento>("documentos");

  // Escopo do gerente: apenas dados da própria loja
  if (user?.papel === "gerente" && user.lojaId) {
    funcionarios = funcionarios.filter((f) => f.lojaId === user.lojaId);
    const ids = new Set(funcionarios.map((f) => f.id));
    atestados = atestados.filter((a) => ids.has(a.funcionarioId));
    escalas = escalas.filter((e) => ids.has(e.funcionarioId));
    bancoHoras = bancoHoras.filter((b) => ids.has(b.funcionarioId));
    vtConfigs = vtConfigs.filter((v) => ids.has(v.funcionarioId));
    vtPagamentos = vtPagamentos.filter((v) => ids.has(v.funcionarioId));
    asos = asos.filter((a) => ids.has(a.funcionarioId));
    documentos = documentos.filter((d) => ids.has(d.funcionarioId));
  }

  return {
    lojas: get<Loja>("lojas"),
    horarios: get<Horario>("horarios"),
    funcionarios,
    escalas,
    bancoHoras,
    atestados,
    vtConfigs,
    vtPagamentos,
    asos,
    documentos,
    usuarios: get<Usuario>("usuarios"),
    feriados: get<Feriado>("feriados"),
    auditoria: get("auditoria"),
    loading,
    refresh,
  };
}
