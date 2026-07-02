"use client";
/**
 * Tabela genérica com busca, ordenação e paginação.
 * Reutilizada em todas as listagens do sistema.
 */
import { useMemo, useState } from "react";
import { ArrowUpDown, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface Coluna<T> {
  key: string;
  header: string;
  /** renderização customizada da célula */
  render?: (item: T) => React.ReactNode;
  /** valor usado para ordenação/busca quando diferente do campo direto */
  value?: (item: T) => string | number;
  sortable?: boolean;
  className?: string;
}

interface Props<T extends { id: string }> {
  data: T[];
  colunas: Coluna<T>[];
  /** campos pesquisáveis pela busca da tabela */
  busca?: (item: T) => string;
  placeholderBusca?: string;
  onRowClick?: (item: T) => void;
  /** conteúdo extra ao lado da busca (filtros) */
  filtros?: React.ReactNode;
  pageSize?: number;
  vazio?: string;
}

export function DataTable<T extends { id: string }>({
  data, colunas, busca, placeholderBusca = "Buscar...", onRowClick, filtros, pageSize = 10, vazio = "Nenhum registro encontrado.",
}: Props<T>) {
  const [q, setQ] = useState("");
  const [pagina, setPagina] = useState(0);
  const [ordem, setOrdem] = useState<{ key: string; dir: 1 | -1 } | null>(null);

  const filtrados = useMemo(() => {
    let out = data;
    if (q && busca) {
      const termo = q.toLowerCase();
      out = out.filter((item) => busca(item).toLowerCase().includes(termo));
    }
    if (ordem) {
      const col = colunas.find((c) => c.key === ordem.key);
      out = [...out].sort((a, b) => {
        const va = col?.value ? col.value(a) : (a as any)[ordem.key] ?? "";
        const vb = col?.value ? col.value(b) : (b as any)[ordem.key] ?? "";
        if (typeof va === "number" && typeof vb === "number") return (va - vb) * ordem.dir;
        return String(va).localeCompare(String(vb), "pt-BR") * ordem.dir;
      });
    }
    return out;
  }, [data, q, ordem, busca, colunas]);

  const totalPaginas = Math.max(Math.ceil(filtrados.length / pageSize), 1);
  const paginaAtual = Math.min(pagina, totalPaginas - 1);
  const visiveis = filtrados.slice(paginaAtual * pageSize, (paginaAtual + 1) * pageSize);

  function toggleOrdem(key: string) {
    setOrdem((o) => (o?.key === key ? { key, dir: o.dir === 1 ? -1 : 1 } : { key, dir: 1 }));
  }

  return (
    <div className="space-y-3">
      {(busca || filtros) && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {busca && (
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => { setQ(e.target.value); setPagina(0); }}
                placeholder={placeholderBusca}
                className="pl-8"
              />
            </div>
          )}
          {filtros}
        </div>
      )}

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent bg-muted/40">
              {colunas.map((c) => (
                <TableHead key={c.key} className={c.className}>
                  {c.sortable ? (
                    <button
                      className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                      onClick={() => toggleOrdem(c.key)}
                    >
                      {c.header}
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  ) : (
                    c.header
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visiveis.length === 0 && (
              <TableRow>
                <TableCell colSpan={colunas.length} className="h-24 text-center text-muted-foreground">
                  {vazio}
                </TableCell>
              </TableRow>
            )}
            {visiveis.map((item) => (
              <TableRow
                key={item.id}
                className={cn(onRowClick && "cursor-pointer")}
                onClick={() => onRowClick?.(item)}
              >
                {colunas.map((c) => (
                  <TableCell key={c.key} className={c.className}>
                    {c.render ? c.render(item) : String((item as any)[c.key] ?? "—")}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filtrados.length > pageSize && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {filtrados.length} registro(s) — página {paginaAtual + 1} de {totalPaginas}
          </span>
          <div className="flex gap-1">
            <Button variant="outline" size="icon" disabled={paginaAtual === 0} onClick={() => setPagina(paginaAtual - 1)}>
              <ChevronLeft />
            </Button>
            <Button variant="outline" size="icon" disabled={paginaAtual >= totalPaginas - 1} onClick={() => setPagina(paginaAtual + 1)}>
              <ChevronRight />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
