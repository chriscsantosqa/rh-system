"use client";
/**
 * Funcionários: listagem com busca, filtros por loja/status,
 * cadastro/edição em modal e exportações.
 */
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useData } from "@/hooks/use-data";
import { useAuth } from "@/lib/auth";
import { api } from "@/services/api";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Coluna } from "@/components/shared/data-table";
import { FiltroSelect } from "@/components/shared/filtro-select";
import { ExportButtons } from "@/components/shared/export-buttons";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { Avatar } from "@/components/shared/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FuncionarioForm } from "@/components/features/funcionario-form";
import { exportExcel, exportPDF } from "@/utils/export";
import { STATUS_BADGE, STATUS_LABEL } from "@/lib/constants";
import { fmtData } from "@/lib/utils";
import type { Funcionario } from "@/types";

export default function FuncionariosPage() {
  const { funcionarios, lojas, horarios, refresh, loading } = useData();
  const { can } = useAuth();
  const router = useRouter();

  const [lojaFiltro, setLojaFiltro] = useState("todos");
  const [statusFiltro, setStatusFiltro] = useState("todos");
  const [formAberto, setFormAberto] = useState(false);
  const [editando, setEditando] = useState<Funcionario | null>(null);

  const lojaNome = (id: string) => lojas.find((l) => l.id === id)?.nome ?? "—";

  const filtrados = useMemo(() => {
    let out = funcionarios;
    if (lojaFiltro !== "todos") out = out.filter((f) => f.lojaId === lojaFiltro);
    if (statusFiltro !== "todos") out = out.filter((f) => f.status === statusFiltro);
    return out;
  }, [funcionarios, lojaFiltro, statusFiltro]);

  async function excluir(f: Funcionario) {
    try {
      await api.remove("funcionarios", f.id);
      toast.success(`${f.nome} excluída do cadastro.`);
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao excluir.");
    }
  }

  const colunas: Coluna<Funcionario>[] = [
    {
      key: "nome", header: "Colaboradora", sortable: true,
      render: (f) => (
        <div className="flex items-center gap-3">
          <Avatar nome={f.nome} />
          <div className="min-w-0">
            <p className="truncate font-medium">{f.nome}</p>
            <p className="truncate text-xs text-muted-foreground">{f.cargo}</p>
          </div>
        </div>
      ),
    },
    { key: "loja", header: "Loja", sortable: true, value: (f) => lojaNome(f.lojaId), render: (f) => lojaNome(f.lojaId) },
    {
      key: "gerente", header: "Gerente",
      value: (f) => lojas.find((l) => l.id === f.lojaId)?.gerente ?? "",
      render: (f) => <span className="text-muted-foreground">{lojas.find((l) => l.id === f.lojaId)?.gerente ?? "—"}</span>,
    },
    { key: "admissao", header: "Admissão", sortable: true, render: (f) => fmtData(f.admissao) },
    {
      key: "status", header: "Status", sortable: true,
      render: (f) => <Badge className={STATUS_BADGE[f.status]}>{STATUS_LABEL[f.status]}</Badge>,
    },
    {
      key: "acoes", header: "", className: "w-24 text-right",
      render: (f) =>
        can("editar") ? (
          <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditando(f); setFormAberto(true); }} aria-label="Editar">
              <Pencil className="h-4 w-4" />
            </Button>
            <ConfirmDelete
              titulo={`Excluir ${f.nome}?`}
              descricao="Todos os vínculos (atestados, VT, escalas) permanecerão no histórico. Prefira o status Desligado para manter o cadastro."
              onConfirm={() => excluir(f)}
            >
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" aria-label="Excluir">
                <Trash2 className="h-4 w-4" />
              </Button>
            </ConfirmDelete>
          </div>
        ) : null,
    },
  ];

  function doExcel() {
    exportExcel("funcionarios", [{
      name: "Funcionários",
      rows: filtrados.map((f) => ({
        Nome: f.nome, Cargo: f.cargo, Loja: lojaNome(f.lojaId),
        Gerente: lojas.find((l) => l.id === f.lojaId)?.gerente ?? "",
        Escala: f.escala, "Admissão": fmtData(f.admissao), "Nascimento": fmtData(f.nascimento),
        CPF: f.cpf, RG: f.rg, Telefone: f.telefone, "E-mail": f.email,
        "Endereço": f.endereco, Cidade: f.cidade, UF: f.estado, CEP: f.cep,
        Status: STATUS_LABEL[f.status], "Observações": f.obs ?? "",
      })),
    }]);
  }

  function doPDF() {
    exportPDF(
      "funcionarios", "Relatório de Funcionários",
      ["Nome", "Cargo", "Loja", "Admissão", "Telefone", "Status"],
      filtrados.map((f) => [f.nome, f.cargo, lojaNome(f.lojaId), fmtData(f.admissao), f.telefone, STATUS_LABEL[f.status]]),
      { landscape: true }
    );
  }

  return (
    <div>
      <PageHeader titulo="Funcionários" descricao={`${filtrados.length} colaboradora(s) no filtro atual`}>
        <ExportButtons onExcel={doExcel} onPDF={doPDF} />
        {can("editar") && (
          <Button onClick={() => { setEditando(null); setFormAberto(true); }}>
            <Plus /> Nova colaboradora
          </Button>
        )}
      </PageHeader>

      <DataTable
        data={filtrados}
        colunas={colunas}
        busca={(f) => `${f.nome} ${f.cargo} ${f.cpf} ${lojaNome(f.lojaId)}`}
        placeholderBusca="Buscar por nome, cargo, CPF..."
        onRowClick={(f) => router.push(`/funcionarios/${f.id}`)}
        pageSize={12}
        vazio={loading ? "Carregando..." : "Nenhuma colaboradora encontrada."}
        filtros={
          <>
            <FiltroSelect value={lojaFiltro} onChange={setLojaFiltro} opcoes={lojas.map((l) => ({ value: l.id, label: l.nome }))} placeholder="Loja" todosLabel="Todas as lojas" />
            <FiltroSelect
              value={statusFiltro}
              onChange={setStatusFiltro}
              opcoes={Object.entries(STATUS_LABEL).map(([v, l]) => ({ value: v, label: l }))}
              placeholder="Status"
              todosLabel="Todos os status"
              className="w-[160px]"
            />
          </>
        }
      />

      <FuncionarioForm
        aberto={formAberto}
        onFechar={() => setFormAberto(false)}
        onSalvo={refresh}
        funcionario={editando}
        lojas={lojas}
        horarios={horarios}
      />
    </div>
  );
}
