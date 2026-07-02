"use client";
/**
 * Controle de Atestados: cadastro, cálculos automáticos, alertas,
 * dashboard específico com gráficos/rankings e exportações.
 */
import { useMemo, useState } from "react";
import { AlertTriangle, CalendarX2, ClipboardPlus, Paperclip, Pencil, Plus, Stethoscope, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useData } from "@/hooks/use-data";
import { useAuth } from "@/lib/auth";
import { api } from "@/services/api";
import { PageHeader } from "@/components/shared/page-header";
import { MonthPicker } from "@/components/shared/month-picker";
import { FiltroSelect } from "@/components/shared/filtro-select";
import { StatCard } from "@/components/shared/stat-card";
import { ExportButtons } from "@/components/shared/export-buttons";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { DataTable, type Coluna } from "@/components/shared/data-table";
import { Barras, BarrasH, ChartCard, Pizza } from "@/components/shared/charts";
import { AtestadoForm } from "@/components/features/atestado-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { alertasAtestado, diasPerdidosNoMes, serieAtestadosMensal } from "@/lib/calc";
import { TIPO_ATESTADO_LABEL } from "@/lib/constants";
import { exportExcel, exportPDF } from "@/utils/export";
import { fmtCompetencia, fmtCompetenciaCurta, fmtData, mesAtual } from "@/lib/utils";
import type { Atestado } from "@/types";

export default function AtestadosPage() {
  const { funcionarios, lojas, atestados, loading, refresh } = useData();
  const { can } = useAuth();
  const [ym, setYm] = useState(mesAtual());
  const [lojaFiltro, setLojaFiltro] = useState("todos");
  const [funcFiltro, setFuncFiltro] = useState("todos");
  const [tipoFiltro, setTipoFiltro] = useState("todos");
  const [formAberto, setFormAberto] = useState(false);
  const [editando, setEditando] = useState<Atestado | null>(null);

  const nomeDe = (id: string) => funcionarios.find((f) => f.id === id)?.nome ?? "—";
  const lojaDe = (fid: string) => lojas.find((l) => l.id === funcionarios.find((f) => f.id === fid)?.lojaId);

  /* ---------- filtros ---------- */
  const filtrados = useMemo(() => {
    let out = atestados;
    if (lojaFiltro !== "todos") {
      const ids = new Set(funcionarios.filter((f) => f.lojaId === lojaFiltro).map((f) => f.id));
      out = out.filter((a) => ids.has(a.funcionarioId));
    }
    if (funcFiltro !== "todos") out = out.filter((a) => a.funcionarioId === funcFiltro);
    if (tipoFiltro !== "todos") out = out.filter((a) => a.tipo === tipoFiltro);
    return [...out].sort((a, b) => b.dataEmissao.localeCompare(a.dataEmissao));
  }, [atestados, funcionarios, lojaFiltro, funcFiltro, tipoFiltro]);

  /* ---------- métricas automáticas ---------- */
  const doMes = filtrados.filter((a) => a.dataEmissao.startsWith(ym));
  const doAno = filtrados.filter((a) => a.dataEmissao.startsWith(ym.slice(0, 4)));
  const diasPerdidosMes = diasPerdidosNoMes(filtrados, ym);
  const diasAcumuladosAno = doAno.reduce((s, a) => s + a.dias, 0);

  /** colaboradoras com alertas ativos */
  const comAlertas = useMemo(() => {
    return funcionarios
      .filter((f) => f.status !== "desligado")
      .map((f) => ({ func: f, alertas: alertasAtestado(atestados.filter((a) => a.funcionarioId === f.id)) }))
      .filter((x) => x.alertas.length > 0)
      .sort((a, b) => b.alertas.length - a.alertas.length);
  }, [funcionarios, atestados]);

  /* ---------- séries para gráficos ---------- */
  const serie = serieAtestadosMensal(filtrados, 6).map((x) => ({ ...x, mes: fmtCompetenciaCurta(x.ym) }));

  const porLoja = lojas
    .map((l) => {
      const ids = new Set(funcionarios.filter((f) => f.lojaId === l.id).map((f) => f.id));
      const da = filtrados.filter((a) => ids.has(a.funcionarioId));
      return { loja: l.nome.replace("Lupatelli ", "").replace("Enlace ", "En. "), cor: l.cor, atestados: da.length, dias: da.reduce((s, a) => s + a.dias, 0) };
    })
    .filter((x) => x.atestados > 0);

  const porCID = Object.entries(
    filtrados.reduce<Record<string, number>>((acc, a) => {
      const k = a.cid ?? "Sem CID";
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {})
  )
    .map(([cid, qtd]) => ({ cid, qtd }))
    .sort((a, b) => b.qtd - a.qtd)
    .slice(0, 8);

  const ranking = funcionarios
    .filter((f) => f.status !== "desligado")
    .map((f) => {
      const da = filtrados.filter((a) => a.funcionarioId === f.id);
      return { nome: f.nome, qtd: da.length, dias: da.reduce((s, a) => s + a.dias, 0) };
    })
    .filter((x) => x.qtd > 0)
    .sort((a, b) => b.qtd - a.qtd || b.dias - a.dias)
    .slice(0, 8);

  /* ---------- exportações ---------- */
  function doExcel() {
    exportExcel("atestados", [{
      name: "Atestados",
      rows: filtrados.map((a) => ({
        Colaboradora: nomeDe(a.funcionarioId), Loja: lojaDe(a.funcionarioId)?.nome ?? "",
        "Data emissão": fmtData(a.dataEmissao), Dias: a.dias, CID: a.cid ?? "",
        Tipo: TIPO_ATESTADO_LABEL[a.tipo], "Médico": a.medico, CRM: a.crm,
        Hospital: a.hospital, "Observações": a.obs ?? "",
      })),
    }]);
  }
  function doPDF() {
    exportPDF("atestados", "Relatório de Atestados",
      ["Colaboradora", "Loja", "Emissão", "Dias", "CID", "Tipo", "Médico"],
      filtrados.map((a) => [nomeDe(a.funcionarioId), lojaDe(a.funcionarioId)?.nome ?? "", fmtData(a.dataEmissao), a.dias, a.cid ?? "—", TIPO_ATESTADO_LABEL[a.tipo], a.medico]),
      { landscape: true });
  }

  async function excluir(a: Atestado) {
    try {
      await api.remove("atestados", a.id);
      toast.success("Atestado excluído.");
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao excluir.");
    }
  }

  /* ---------- colunas ---------- */
  const colunas: Coluna<Atestado>[] = [
    { key: "func", header: "Colaboradora", sortable: true, value: (a) => nomeDe(a.funcionarioId),
      render: (a) => (
        <div>
          <p className="font-medium">{nomeDe(a.funcionarioId)}</p>
          <p className="text-xs text-muted-foreground">{lojaDe(a.funcionarioId)?.nome ?? ""}</p>
        </div>
      ) },
    { key: "dataEmissao", header: "Emissão", sortable: true, render: (a) => fmtData(a.dataEmissao) },
    { key: "dias", header: "Dias", sortable: true, render: (a) => <span className="font-semibold">{a.dias}</span> },
    { key: "cid", header: "CID", render: (a) => (a.cid ? <Badge>{a.cid}</Badge> : <span className="text-muted-foreground">—</span>) },
    { key: "tipo", header: "Tipo", render: (a) => <Badge variant={a.tipo === "inss" ? "destructive" : a.tipo === "acidente" ? "warning" : "secondary"}>{TIPO_ATESTADO_LABEL[a.tipo]}</Badge> },
    { key: "medico", header: "Médico / CRM", render: (a) => <span className="text-xs">{a.medico}<br /><span className="text-muted-foreground">CRM {a.crm}</span></span> },
    { key: "hospital", header: "Hospital", className: "hidden xl:table-cell", render: (a) => <span className="text-xs text-muted-foreground">{a.hospital}</span> },
    { key: "arquivo", header: "", className: "w-8",
      render: (a) => a.arquivo ? <a href={a.arquivo} target="_blank" onClick={(e) => e.stopPropagation()} title="Abrir anexo"><Paperclip className="h-4 w-4 text-primary" /></a> : null },
    { key: "acoes", header: "", className: "w-20 text-right",
      render: (a) => can("editar") ? (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditando(a); setFormAberto(true); }}><Pencil className="h-4 w-4" /></Button>
          <ConfirmDelete titulo="Excluir atestado?" onConfirm={() => excluir(a)}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
          </ConfirmDelete>
        </div>
      ) : null },
  ];

  if (loading) return <Skeleton className="h-96" />;

  return (
    <div>
      <PageHeader titulo="Atestados" descricao="Controle completo com alertas automáticos e histórico por colaboradora">
        <MonthPicker value={ym} onChange={setYm} />
        <ExportButtons onExcel={doExcel} onPDF={doPDF} />
        {can("editar") && (
          <Button onClick={() => { setEditando(null); setFormAberto(true); }}><Plus /> Novo atestado</Button>
        )}
      </PageHeader>

      {/* Cards automáticos */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard titulo={`Atestados em ${fmtCompetenciaCurta(ym)}`} valor={doMes.length} sub={`${filtrados.length} no filtro`} icon={ClipboardPlus} />
        <StatCard titulo="Dias perdidos no mês" valor={diasPerdidosMes} icon={CalendarX2} tom={diasPerdidosMes > 10 ? "alerta" : "default"} />
        <StatCard titulo={`Atestados em ${ym.slice(0, 4)}`} valor={doAno.length} sub={`${diasAcumuladosAno} dias acumulados`} icon={Stethoscope} tom="info" />
        <StatCard titulo="Colaboradoras em alerta" valor={comAlertas.length} sub="critérios automáticos" icon={AlertTriangle} tom={comAlertas.length > 0 ? "alerta" : "ok"} />
      </div>

      <Tabs defaultValue="lista">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="lista">Registros</TabsTrigger>
          <TabsTrigger value="alertas">Alertas ({comAlertas.length})</TabsTrigger>
          <TabsTrigger value="graficos">Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="lista">
          <DataTable
            data={filtrados}
            colunas={colunas}
            busca={(a) => `${nomeDe(a.funcionarioId)} ${a.cid ?? ""} ${a.medico} ${a.hospital}`}
            placeholderBusca="Buscar por nome, CID, médico..."
            pageSize={12}
            filtros={
              <>
                <FiltroSelect value={lojaFiltro} onChange={setLojaFiltro} opcoes={lojas.map((l) => ({ value: l.id, label: l.nome }))} placeholder="Loja" todosLabel="Todas as lojas" />
                <FiltroSelect value={funcFiltro} onChange={setFuncFiltro} opcoes={funcionarios.map((f) => ({ value: f.id, label: f.nome }))} placeholder="Colaboradora" todosLabel="Todas" className="w-[170px]" />
                <FiltroSelect value={tipoFiltro} onChange={setTipoFiltro} opcoes={Object.entries(TIPO_ATESTADO_LABEL).map(([v, l]) => ({ value: v, label: l }))} placeholder="Tipo" todosLabel="Todos os tipos" className="w-[150px]" />
              </>
            }
          />
        </TabsContent>

        <TabsContent value="alertas">
          <div className="grid gap-3 lg:grid-cols-2">
            {comAlertas.length === 0 && (
              <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Nenhum alerta ativo. 🎉</CardContent></Card>
            )}
            {comAlertas.map(({ func, alertas }) => {
              const ats = atestados.filter((a) => a.funcionarioId === func.id);
              return (
                <Card key={func.id} className="border-l-4 border-l-amber-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between text-sm">
                      {func.nome}
                      <span className="text-xs font-normal text-muted-foreground">{lojaDe(func.id)?.nome}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {alertas.map((a, i) => (
                      <Badge key={i} variant={a.nivel === "alto" ? "destructive" : "warning"} className="mr-1">{a.texto}</Badge>
                    ))}
                    <p className="text-xs text-muted-foreground">
                      Histórico: {ats.length} atestado(s), {ats.reduce((s, a) => s + a.dias, 0)} dia(s) no total.
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Critérios: 3+ atestados em 6 meses · mais de 15 dias em 12 meses · mais de 30 dias ·
            atestado único ≥ 15 dias (INSS) · atestados consecutivos encadeados.
          </p>
        </TabsContent>

        <TabsContent value="graficos">
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard titulo="Atestados e dias perdidos por mês" descricao="Últimos 6 meses">
              <Barras data={serie} x="mes" series={[{ key: "atestados", nome: "Atestados" }, { key: "diasPerdidos", nome: "Dias perdidos", cor: "hsl(var(--chart-3))" }]} />
            </ChartCard>
            <ChartCard titulo="Atestados por loja">
              <Barras data={porLoja} x="loja" series={[{ key: "atestados", nome: "Atestados" }, { key: "dias", nome: "Dias", cor: "hsl(var(--chart-4))" }]} />
            </ChartCard>
            <ChartCard titulo="Distribuição por CID">
              <Pizza data={porCID.map((x) => ({ nome: x.cid, valor: x.qtd }))} nameKey="nome" valueKey="valor" />
            </ChartCard>
            <ChartCard titulo="Ranking por colaboradora" altura={Math.max(260, ranking.length * 30)}>
              <BarrasH data={ranking} categoria="nome" valor="qtd" nome="Atestados" />
            </ChartCard>
          </div>
        </TabsContent>
      </Tabs>

      <AtestadoForm
        aberto={formAberto}
        onFechar={() => setFormAberto(false)}
        onSalvo={refresh}
        atestado={editando}
        funcionarios={funcionarios.filter((f) => f.status !== "desligado")}
      />
    </div>
  );
}
