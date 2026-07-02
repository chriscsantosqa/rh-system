"use client";
/**
 * Vale Transporte — módulo completo:
 * cálculo automático do mês, pagamento com divisão cartão/PIX validada,
 * configurações por colaboradora, histórico e dashboard específico.
 */
import { useMemo, useState } from "react";
import { Banknote, CheckCircle2, CreditCard, PiggyBank, Settings2, Trash2, Wallet } from "lucide-react";
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
import { Avatar } from "@/components/shared/avatar";
import { Barras, ChartCard, Pizza } from "@/components/shared/charts";
import { DataTable, type Coluna } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { VTConfigDialog, VTPagamentoDialog } from "@/components/features/vt-dialogs";
import { calculaVT, custoDiaVT, type CalculoVT } from "@/lib/calc";
import { exportExcel, exportPDF } from "@/utils/export";
import { brl, fmtCompetencia, fmtData, mesAtual } from "@/lib/utils";
import type { Funcionario, VTConfig, VTPagamento } from "@/types";

export default function VTPage() {
  const { funcionarios, lojas, vtConfigs, vtPagamentos, escalas, atestados, feriados, loading, refresh } = useData();
  const { can, user } = useAuth();
  const [ym, setYm] = useState(mesAtual());
  const [lojaFiltro, setLojaFiltro] = useState("todos");

  const [cfgDialog, setCfgDialog] = useState<Funcionario | null>(null);
  const [pagDialog, setPagDialog] = useState<{ func: Funcionario; calc: CalculoVT } | null>(null);

  const ativos = useMemo(
    () =>
      funcionarios
        .filter((f) => f.status !== "desligado")
        .filter((f) => lojaFiltro === "todos" || f.lojaId === lojaFiltro)
        .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
    [funcionarios, lojaFiltro]
  );

  const cfgDe = (fid: string) => vtConfigs.find((c) => c.funcionarioId === fid) ?? null;
  const pagoNoMes = (fid: string) => vtPagamentos.find((p) => p.funcionarioId === fid && p.competencia === ym);
  const lojaNome = (id: string) => lojas.find((l) => l.id === id)?.nome ?? "—";

  /** linhas do cálculo do mês (apenas quem recebe VT) */
  const linhas = useMemo(() => {
    return ativos
      .map((f) => {
        const cfg = cfgDe(f.id);
        if (!cfg || !cfg.recebeVT) return null;
        return { func: f, cfg, calc: calculaVT(f, cfg, ym, escalas, atestados, feriados), pago: pagoNoMes(f.id) };
      })
      .filter(Boolean) as { func: Funcionario; cfg: VTConfig; calc: CalculoVT; pago?: VTPagamento }[];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ativos, vtConfigs, vtPagamentos, escalas, atestados, feriados, ym]);

  /* ---------- dashboard VT ---------- */
  const pagsMes = vtPagamentos.filter((p) => p.competencia === ym);
  const totalMes = pagsMes.reduce((s, p) => s + p.valorTotal, 0);
  const totalPix = pagsMes.reduce((s, p) => s + p.valorPix, 0);
  const totalCartao = pagsMes.reduce((s, p) => s + p.valorCartao, 0);
  const previsto = linhas.reduce((s, l) => s + (l.pago ? l.pago.valorTotal : l.calc.valorTotal), 0);

  const porLoja = lojas
    .map((l) => {
      const ids = new Set(funcionarios.filter((f) => f.lojaId === l.id).map((f) => f.id));
      return {
        loja: l.nome.replace("Lupatelli ", "").replace("Enlace ", "En. "),
        cor: l.cor,
        valor: Math.round(pagsMes.filter((p) => ids.has(p.funcionarioId)).reduce((s, p) => s + p.valorTotal, 0) * 100) / 100,
      };
    })
    .filter((x) => x.valor > 0);

  const porColab = pagsMes
    .map((p) => ({ nome: funcionarios.find((f) => f.id === p.funcionarioId)?.nome ?? "?", valor: p.valorTotal }))
    .sort((a, b) => b.valor - a.valor);

  /* ---------- exportações ---------- */
  function doExcel() {
    exportExcel(`vale-transporte-${ym}`, [
      {
        name: "Cálculo do mês",
        rows: linhas.map((l) => ({
          Colaboradora: l.func.nome, Loja: lojaNome(l.func.lojaId),
          "Dias trabalhados": l.calc.diasTrabalhados, "Dias atestado": l.calc.diasAtestado,
          "Dias férias": l.calc.diasFerias, "Afastamento": l.calc.diasAfastamento, Folgas: l.calc.folgas,
          Domingos: l.calc.domingos, Feriados: l.calc.feriadosTrab,
          "Custo/dia": l.calc.custoDia, "Total previsto": l.calc.valorTotal,
          "Pago": l.pago?.valorTotal ?? "", "Cartão": l.pago?.valorCartao ?? "", PIX: l.pago?.valorPix ?? "",
        })),
      },
      {
        name: "Histórico",
        rows: vtPagamentos.map((p) => ({
          Competência: p.competencia, Colaboradora: funcionarios.find((f) => f.id === p.funcionarioId)?.nome ?? "?",
          Dias: p.diasConsiderados, "Custo/dia": p.custoDia, Total: p.valorTotal,
          "Cartão VT": p.valorCartao, PIX: p.valorPix, Data: fmtData(p.dataPagamento),
          Responsável: p.responsavel, Obs: p.obs ?? "",
        })),
      },
    ]);
  }

  function doPDF() {
    exportPDF(
      `vale-transporte-${ym}`, `Vale Transporte — ${fmtCompetencia(ym)}`,
      ["Colaboradora", "Loja", "Dias", "Custo/dia", "Total", "Situação"],
      linhas.map((l) => [
        l.func.nome, lojaNome(l.func.lojaId),
        l.pago?.diasConsiderados ?? l.calc.diasTrabalhados,
        brl(l.calc.custoDia),
        brl(l.pago?.valorTotal ?? l.calc.valorTotal),
        l.pago ? "Pago" : "Pendente",
      ])
    );
  }

  /* ---------- histórico (DataTable) ---------- */
  const colunasHist: Coluna<VTPagamento>[] = [
    { key: "competencia", header: "Competência", sortable: true, render: (p) => <span className="capitalize">{fmtCompetencia(p.competencia)}</span> },
    {
      key: "func", header: "Colaboradora", sortable: true,
      value: (p) => funcionarios.find((f) => f.id === p.funcionarioId)?.nome ?? "",
      render: (p) => funcionarios.find((f) => f.id === p.funcionarioId)?.nome ?? "—",
    },
    { key: "diasConsiderados", header: "Dias", sortable: true },
    { key: "valorTotal", header: "Valor", sortable: true, render: (p) => <span className="font-semibold">{brl(p.valorTotal)}</span> },
    {
      key: "forma", header: "Forma",
      render: (p) => (
        <div className="flex gap-1">
          {p.valorCartao > 0 && <Badge variant="secondary"><CreditCard className="mr-1 h-3 w-3" />{brl(p.valorCartao)}</Badge>}
          {p.valorPix > 0 && <Badge variant="success"><Wallet className="mr-1 h-3 w-3" />{brl(p.valorPix)}</Badge>}
        </div>
      ),
    },
    { key: "dataPagamento", header: "Data", sortable: true, render: (p) => fmtData(p.dataPagamento) },
    { key: "responsavel", header: "Responsável" },
    { key: "obs", header: "Obs.", render: (p) => <span className="text-xs text-muted-foreground">{p.obs ?? "—"}</span> },
    {
      key: "acoes", header: "", className: "w-12",
      render: (p) =>
        can("pagar_vt") ? (
          <div onClick={(e) => e.stopPropagation()}>
            <ConfirmDelete titulo="Excluir pagamento?" descricao="O registro sairá do histórico e dos totais." onConfirm={async () => { await api.remove("vtPagamentos", p.id); toast.success("Pagamento excluído."); refresh(); }}>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
            </ConfirmDelete>
          </div>
        ) : null,
    },
  ];

  if (loading) return <Skeleton className="h-96" />;

  return (
    <div>
      <PageHeader titulo="Vale Transporte" descricao="Cálculo automático, pagamentos, histórico e indicadores">
        <MonthPicker value={ym} onChange={setYm} />
        <ExportButtons onExcel={doExcel} onPDF={doPDF} />
      </PageHeader>

      {/* Cards do dashboard de VT */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard titulo="Previsto no mês" valor={brl(previsto)} sub={`${linhas.length} colaboradoras com VT`} icon={PiggyBank} />
        <StatCard titulo="Pago no mês" valor={brl(totalMes)} sub={`${pagsMes.length} pagamento(s)`} icon={CheckCircle2} tom="ok" />
        <StatCard titulo="Total via cartão" valor={brl(totalCartao)} icon={CreditCard} tom="info" />
        <StatCard titulo="Total via PIX" valor={brl(totalPix)} icon={Banknote} tom="info" />
      </div>

      <Tabs defaultValue="calculo">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="calculo">Cálculo do mês</TabsTrigger>
          <TabsTrigger value="config"><Settings2 /> Configurações</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
          <TabsTrigger value="graficos">Gráficos</TabsTrigger>
        </TabsList>

        {/* ============ CÁLCULO ============ */}
        <TabsContent value="calculo" className="space-y-3">
          <FiltroSelect value={lojaFiltro} onChange={setLojaFiltro} opcoes={lojas.map((l) => ({ value: l.id, label: l.nome }))} placeholder="Loja" todosLabel="Todas as lojas" />
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-transparent">
                  <TableHead>Colaboradora</TableHead>
                  <TableHead className="text-center">Dias trab.</TableHead>
                  <TableHead className="text-center hidden md:table-cell">Atest.</TableHead>
                  <TableHead className="text-center hidden md:table-cell">Férias</TableHead>
                  <TableHead className="text-center hidden lg:table-cell">Folgas</TableHead>
                  <TableHead className="text-center hidden lg:table-cell">Dom/Fer</TableHead>
                  <TableHead className="text-right">Custo/dia</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Situação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {linhas.length === 0 && (
                  <TableRow><TableCell colSpan={9} className="h-24 text-center text-muted-foreground">Nenhuma colaboradora com VT no filtro atual.</TableCell></TableRow>
                )}
                {linhas.map(({ func, cfg, calc, pago }) => (
                  <TableRow key={func.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar nome={func.nome} />
                        <div>
                          <p className="font-medium leading-tight">{func.nome}</p>
                          <p className="text-xs text-muted-foreground">{lojaNome(func.lojaId)}{!calc.baseEscala && " · estimado"}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-semibold">{pago?.diasConsiderados ?? calc.diasTrabalhados}</TableCell>
                    <TableCell className="text-center hidden md:table-cell">{calc.diasAtestado}</TableCell>
                    <TableCell className="text-center hidden md:table-cell">{calc.diasFerias}</TableCell>
                    <TableCell className="text-center hidden lg:table-cell">{calc.folgas}</TableCell>
                    <TableCell className="text-center hidden lg:table-cell">{calc.domingos}/{calc.feriadosTrab}</TableCell>
                    <TableCell className="text-right">{brl(calc.custoDia)}</TableCell>
                    <TableCell className="text-right font-bold">{brl(pago?.valorTotal ?? calc.valorTotal)}</TableCell>
                    <TableCell className="text-right">
                      {pago ? (
                        <Badge variant="success"><CheckCircle2 className="mr-1 h-3 w-3" /> Pago</Badge>
                      ) : can("pagar_vt") ? (
                        <Button size="sm" onClick={() => setPagDialog({ func, calc })}>Registrar</Button>
                      ) : (
                        <Badge variant="warning">Pendente</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-muted-foreground">
            Fórmula: dias efetivamente trabalhados × custo diário (ida + volta + integrações). Dias vêm da escala do mês;
            sem escala lançada, o sistema estima pelo regime (6x1/5x2) descontando atestados. A divisão cartão + PIX é
            travada para bater exatamente com o total.
          </p>
        </TabsContent>

        {/* ============ CONFIGURAÇÕES ============ */}
        <TabsContent value="config">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ativos.map((f) => {
              const cfg = cfgDe(f.id);
              return (
                <button
                  key={f.id}
                  onClick={() => can("editar") && setCfgDialog(f)}
                  className="flex items-center gap-3 rounded-xl border bg-card p-4 text-left shadow-sm transition-all hover:border-primary/60 hover:shadow"
                >
                  <Avatar nome={f.nome} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{f.nome}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {cfg?.recebeVT
                        ? `${brl(custoDiaVT(cfg))}/dia · ${cfg.formaPadrao === "cartao" ? "Cartão" : cfg.formaPadrao === "pix" ? "PIX" : "Misto"}`
                        : "Não recebe VT"}
                    </p>
                  </div>
                  {cfg?.recebeVT ? <Badge variant="success">VT</Badge> : <Badge variant="secondary">—</Badge>}
                </button>
              );
            })}
          </div>
        </TabsContent>

        {/* ============ HISTÓRICO ============ */}
        <TabsContent value="historico">
          <DataTable
            data={[...vtPagamentos].sort((a, b) => b.competencia.localeCompare(a.competencia) || b.dataPagamento.localeCompare(a.dataPagamento))}
            colunas={colunasHist}
            busca={(p) => `${funcionarios.find((f) => f.id === p.funcionarioId)?.nome ?? ""} ${p.competencia} ${p.responsavel}`}
            placeholderBusca="Buscar por colaboradora, competência..."
            pageSize={12}
          />
        </TabsContent>

        {/* ============ GRÁFICOS ============ */}
        <TabsContent value="graficos">
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard titulo="Gasto por loja" descricao={`Competência ${fmtCompetencia(ym)}`}>
              <Pizza data={porLoja.map((x) => ({ nome: x.loja, valor: x.valor, cor: x.cor }))} nameKey="nome" valueKey="valor" format={brl} />
            </ChartCard>
            <ChartCard titulo="Gasto por colaboradora" descricao={`Competência ${fmtCompetencia(ym)}`} altura={Math.max(260, porColab.length * 26)}>
              <Barras data={porColab} x="nome" series={[{ key: "valor", nome: "VT" }]} format={brl} />
            </ChartCard>
          </div>
        </TabsContent>
      </Tabs>

      {/* Diálogos */}
      <VTConfigDialog
        aberto={!!cfgDialog}
        onFechar={() => setCfgDialog(null)}
        onSalvo={refresh}
        funcionario={cfgDialog}
        config={cfgDialog ? cfgDe(cfgDialog.id) : null}
      />
      <VTPagamentoDialog
        aberto={!!pagDialog}
        onFechar={() => setPagDialog(null)}
        onSalvo={refresh}
        funcionario={pagDialog?.func ?? null}
        config={pagDialog ? cfgDe(pagDialog.func.id) : null}
        calculo={pagDialog?.calc ?? null}
        competencia={ym}
        responsavel={user?.nome ?? "—"}
      />
    </div>
  );
}
