"use client";
/**
 * Busca global (topbar): pesquisa por nome, loja, cargo, CID, gerente e CPF.
 */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardPlus, Search, Store, User } from "lucide-react";
import { useData } from "@/hooks/use-data";
import { Input } from "@/components/ui/input";
import { STATUS_LABEL } from "@/lib/constants";
import { fmtData } from "@/lib/utils";

interface Resultado {
  tipo: "funcionario" | "atestado" | "loja";
  id: string;
  titulo: string;
  sub: string;
  href: string;
}

export function GlobalSearch() {
  const { funcionarios, lojas, atestados } = useData();
  const [q, setQ] = useState("");
  const [aberto, setAberto] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  // fecha ao clicar fora
  useEffect(() => {
    function fora(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    }
    document.addEventListener("mousedown", fora);
    return () => document.removeEventListener("mousedown", fora);
  }, []);

  const termo = q.trim().toLowerCase();
  const resultados: Resultado[] = [];

  if (termo.length >= 2) {
    const lojaNome = (id: string) => lojas.find((l) => l.id === id)?.nome ?? "";

    for (const f of funcionarios) {
      const loja = lojas.find((l) => l.id === f.lojaId);
      const alvo = `${f.nome} ${f.cargo} ${f.cpf} ${loja?.nome ?? ""} ${loja?.gerente ?? ""}`.toLowerCase();
      if (alvo.includes(termo)) {
        resultados.push({
          tipo: "funcionario",
          id: f.id,
          titulo: f.nome,
          sub: `${f.cargo} — ${lojaNome(f.lojaId)} · ${STATUS_LABEL[f.status]}`,
          href: `/funcionarios/${f.id}`,
        });
      }
      if (resultados.length >= 6) break;
    }

    for (const a of atestados) {
      if (a.cid && a.cid.toLowerCase().includes(termo)) {
        const f = funcionarios.find((x) => x.id === a.funcionarioId);
        resultados.push({
          tipo: "atestado",
          id: a.id,
          titulo: `CID ${a.cid} — ${f?.nome ?? "?"}`,
          sub: `${fmtData(a.dataEmissao)} · ${a.dias} dia(s)`,
          href: "/atestados",
        });
      }
      if (resultados.length >= 9) break;
    }

    for (const l of lojas) {
      if (`${l.nome} ${l.gerente}`.toLowerCase().includes(termo)) {
        resultados.push({ tipo: "loja", id: l.id, titulo: l.nome, sub: `Gerente: ${l.gerente}`, href: "/funcionarios" });
      }
      if (resultados.length >= 10) break;
    }
  }

  const icone = { funcionario: User, atestado: ClipboardPlus, loja: Store };

  return (
    <div ref={ref} className="relative hidden w-full max-w-sm md:block">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        value={q}
        onChange={(e) => { setQ(e.target.value); setAberto(true); }}
        onFocus={() => setAberto(true)}
        placeholder="Buscar nome, loja, cargo, CID, CPF..."
        className="pl-8 bg-muted/50 border-transparent focus-visible:bg-card"
      />
      {aberto && termo.length >= 2 && (
        <div className="absolute top-11 z-50 w-full rounded-lg border bg-popover p-1.5 shadow-lg animate-fade-in">
          {resultados.length === 0 && (
            <p className="px-3 py-4 text-center text-sm text-muted-foreground">Nada encontrado.</p>
          )}
          {resultados.map((r) => {
            const Icon = icone[r.tipo];
            return (
              <button
                key={`${r.tipo}-${r.id}`}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left hover:bg-accent transition-colors"
                onClick={() => { setAberto(false); setQ(""); router.push(r.href); }}
              >
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{r.titulo}</span>
                  <span className="block truncate text-xs text-muted-foreground">{r.sub}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
