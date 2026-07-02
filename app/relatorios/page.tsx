"use client";
/**
 * Central de relatórios: gera PDF e Excel de todos os módulos
 * com filtro de competência.
 */
import { useState } from "react";
import { Bus, CalendarDays, ClipboardPlus, FileBarChart2, Store, Timer, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useData } from "@/hooks/use-data";
import { PageHeader } from "@/components/shared/page-header";
import { MonthPicker } from "@/components/shared/month-picker";
import { ExportButtons } from "@/components/shared/export-buttons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { calculaIndicadores, diasPerdidosNoMes, resumoEscala } from "@/lib/calc";
import { ESCALA_DIA, STATUS_LABEL, TIPO_ATESTADO_LABEL } from "@/lib/constants";
import { exportExcel, exportPDF } from "@/utils/export";
import { brl, diasNoMes, fmtCompetencia, fmtData, mesAtual, num } from "@/lib/utils";

export default function RelatoriosPage() {
  const { funcionarios, lojas, atestados, vtPagamentos, escalas, bancoHoras, feriados, loading } = useData();
  const [ym, setYm] = useState(mesAtual());

  const lojaNome = (id: string) => lojas.find((l) => l.id === id)?.nome ?? "—";
  const nomeDe = (id: string) => funcionarios.find((f) => f.id === id)?.nome ?? "—";

  if (loading) return <Skeleton className="h-96" />;

  /* ---------- geradores ---------- */

  const relatorios: {
    id: string; titulo: string; descricao: string; icon: LucideIcon;
    excel: () => void; pdf: () => void;
  }[] = [
    {
      id: "funcionarios", titulo: "Funcionários", icon: Users,
      descricao: "Cadastro completo com loja, gerente, contatos e status.",
      excel: () =>
        exportExcel("rel-funcionarios", [{
          name: "Funcionários",
          rows: funcionarios.map((f) => ({
            Nome: f.nome, Cargo: f.cargo, Loja: lojaNome(f.lojaId),
            Gerente: lojas.find((l) => l.id === f.lojaId)?.gerente ?? "",
            Escala: f.escala, Admissão: fmtData(f.admissao), CPF: f.cpf,
            Telefone: f.telefone, "E-mail": f.email, Status: STATUS_LABEL[f.status],
          })),
        }]),
      pdf: () =>
        exportPDF("rel-funcionarios", "Relatório de Funcionários",
          ["Nome", "Cargo", "Loja", "Admissão", "Status"],
          funcionarios.map((f) => [f.nome, f.cargo, lojaNome(f.lojaId), fmtData(f.admissao), STATUS_LABEL[f.status]])),
    },
    {
      id: "atestados", titulo: "Atestados", icon: ClipboardPlus,
      descricao: `Atestados da competência ${fmtCompetencia(ym)} com CID e médico.`,
      excel: () =>
        exportExcel(`rel-atestados-${ym}`, [{
          name: "Atestados",
          rows: atestados.filter((a) => a.dataEmissao.startsWith(ym)).map((a) => ({
            Colaboradora: nomeDe(a.funcionarioId), Emissão: fmtData(a.dataEmissao), Dias: a.dias,
            CID: a.cid ?? "", Tipo: TIPO_ATESTADO_LABEL[a.tipo], Médico: a.medico, CRM: a.crm, Hospital: a.hospital,
          })),
        }]),
      pdf: () =>
        exportPDF(`rel-atestados-${ym}`, `Atestados — ${fmtCompetencia(ym)}`,
          ["Colaboradora", "Emissão", "Dias", "CID", "Tipo"],
          atestados.filter((a) => a.dataEmissao.startsWith(ym)).map((a) => [nomeDe(a.funcionarioId), fmtData(a.dataEmissao), a.dias, a.cid ?? "—", TIPO_ATESTADO_LABEL[a.tipo]])),
    },
    {
      id: "vt", titulo: "Vale Transporte", icon: Bus,
      descricao: `Pagamentos da competência ${fmtCompetencia(ym)} com divisão cartão/PIX.`,
      excel: () =>
        exportExcel(`rel-vt-${ym}`, [{
          name: "VT",
          rows: vtPagamentos.filter((p) => p.competencia === ym).map((p) => ({
            Colaboradora: nomeDe(p.funcionarioId), Dias: p.diasConsiderados, "Custo/dia": p.custoDia,
            Total: p.valorTotal, "Cartão": p.valorCartao, PIX: p.valorPix,
            Data: fmtData(p.dataPagamento), Responsável: p.responsavel,
          })),
        }]),
      pdf: () =>
        exportPDF(`rel-vt-${ym}`, `Vale Transporte — ${fmtCompetencia(ym)}`,
          ["Colaboradora", "Dias", "Total", "Cartão", "PIX", "Data"],
          vtPagamentos.filter((p) => p.competencia === ym).map((p) => [nomeDe(p.funcionarioId), p.diasConsiderados, brl(p.valorTotal), brl(p.valorCartao), brl(p.valorPix), fmtData(p.dataPagamento)])),
    },
    {
      id: "lojas", titulo: "Lojas", icon: Store,
      descricao: "Headcount, atestados, dias perdidos e VT por loja.",
      excel: () =>
        exportExcel(`rel-lojas-${ym}`, [{
          name: "Lojas",
          rows: lojas.map((l) => {
            const ids = new Set(funcionarios.filter((f) => f.lojaId === l.id).map((f) => f.id));
            const ats = atestados.filter((a) => ids.has(a.funcionarioId));
            return {
              Loja: l.nome, Gerente: l.gerente,
              Ativas: funcionarios.filter((f) => f.lojaId === l.id && f.status !== "desligado").length,
              "Atestados no mês": ats.filter((a) => a.dataEmissao.startsWith(ym)).length,
              "Dias perdidos no mês": diasPerdidosNoMes(ats, ym),
              "VT no mês": vtPagamentos.filter((p) => ids.has(p.funcionarioId) && p.competencia === ym).reduce((s, p) => s + p.valorTotal, 0),
            };
          }),
        }]),
      pdf: () =>
        exportPDF(`rel-lojas-${ym}`, `Lojas — ${fmtCompetencia(ym)}`,
          ["Loja", "Gerente", "Ativas", "Atestados", "Dias perdidos"],
          lojas.map((l) => {
            const ids = new Set(funcionarios.filter((f) => f.lojaId === l.id).map((f) => f.id));
            const ats = atestados.filter((a) => ids.has(a.funcionarioId));
            return [l.nome, l.gerente, funcionarios.filter((f) => f.lojaId === l.id && f.status !== "desligado").length, ats.filter((a) => a.dataEmissao.startsWith(ym)).length, diasPerdidosNoMes(ats, ym)];
          })),
    },
    {
      id: "escalas", titulo: "Escalas", icon: CalendarDays,
      descricao: `Grade do mês ${fmtCompetencia(ym)} por colaboradora.`,
      excel: () => {
        const rows = funcionarios.filter((f) => f.status !== "desligado").map((f) => {
          const linha: Record<string, unknown> = { Colaboradora: f.nome, Loja: lojaNome(f.lojaId) };
          for (let d = 1; d <= diasNoMes(ym); d++) {
            const data = `${ym}-${String(d).padStart(2, "0")}`;
            const e = escalas.find((x) => x.funcionarioId === f.id && x.data === data);
            linha[String(d)] = e ? ESCALA_DIA[e.tipo].sigla : "";
          }
          const r = resumoEscala(escalas, f.id, ym, feriados);
          linha["Trabalho"] = r.trabalho; linha["Folgas"] = r.folgas;
          linha["Domingos"] = r.domingosTrabalhados; linha["Feriados"] = r.feriadosTrabalhados;
          return linha;
        });
        exportExcel(`rel-escala-${ym}`, [{ name: "Escala", rows }]);
      },
      pdf: () => {
        const head = ["Colaboradora", "Trab.", "Folgas", "Férias", "Atest.", "Dom.", "Fer."];
        exportPDF(`rel-escala-${ym}`, `Resumo de Escalas — ${fmtCompetencia(ym)}`, head,
          funcionarios.filter((f) => f.status !== "desligado").map((f) => {
            const r = resumoEscala(escalas, f.id, ym, feriados);
            return [f.nome, r.trabalho + r.trocas + r.extras, r.folgas, r.ferias, r.atestado, r.domingosTrabalhados, r.feriadosTrabalhados];
          }));
      },
    },
    {
      id: "indicadores", titulo: "Indicadores", icon: FileBarChart2,
      descricao: "Absenteísmo, turnover, dias e horas perdidas do mês.",
      excel: () => {
        const i = calculaIndicadores(funcionarios, atestados, ym);
        exportExcel(`rel-indicadores-${ym}`, [{
          name: "Indicadores",
          rows: [
            { Indicador: "Absenteísmo (%)", Valor: i.absenteismoPct },
            { Indicador: "Turnover 12m (%)", Valor: i.turnoverPct },
            { Indicador: "Dias perdidos no mês", Valor: i.diasPerdidosMes },
            { Indicador: "Horas perdidas no mês", Valor: i.horasPerdidasMes },
            { Indicador: "Atestados no mês", Valor: i.atestadosMes },
            { Indicador: "Ativas", Valor: i.ativos },
            { Indicador: "Afastadas", Valor: i.afastados },
            { Indicador: "Em férias", Valor: i.emFerias },
          ],
        }]);
      },
      pdf: () => {
        const i = calculaIndicadores(funcionarios, atestados, ym);
        exportPDF(`rel-indicadores-${ym}`, `Indicadores — ${fmtCompetencia(ym)}`,
          ["Indicador", "Valor"],
          [
            ["Absenteísmo (%)", num(i.absenteismoPct, 2)],
            ["Turnover 12m (%)", num(i.turnoverPct, 1)],
            ["Dias perdidos no mês", i.diasPerdidosMes],
            ["Horas perdidas no mês", num(i.horasPerdidasMes, 1)],
            ["Atestados no mês", i.atestadosMes],
            ["Ativas", i.ativos],
            ["Afastadas", i.afastados],
            ["Em férias", i.emFerias],
          ]);
      },
    },
    {
      id: "banco", titulo: "Banco de Horas", icon: Timer,
      descricao: "Saldos e lançamentos de banco de horas por colaboradora.",
      excel: () =>
        exportExcel("rel-banco-horas", [
          {
            name: "Saldos",
            rows: funcionarios.filter((f) => f.status !== "desligado").map((f) => ({
              Colaboradora: f.nome,
              Saldo: bancoHoras.filter((b) => b.funcionarioId === f.id).reduce((s, b) => s + b.horas, 0),
            })),
          },
          {
            name: "Lançamentos",
            rows: bancoHoras.map((b) => ({
              Colaboradora: nomeDe(b.funcionarioId), Data: fmtData(b.data), Horas: b.horas, Motivo: b.motivo,
            })),
          },
        ]),
      pdf: () =>
        exportPDF("rel-banco-horas", "Banco de Horas",
          ["Colaboradora", "Data", "Horas", "Motivo"],
          bancoHoras.map((b) => [nomeDe(b.funcionarioId), fmtData(b.data), b.horas, b.motivo])),
    },
  ];

  return (
    <div>
      <PageHeader titulo="Relatórios" descricao="Exportação em Excel e PDF de todos os módulos">
        <MonthPicker value={ym} onChange={setYm} />
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {relatorios.map((r) => (
          <Card key={r.id} className="animate-fade-in flex flex-col">
            <CardHeader className="pb-2">
              <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <r.icon className="h-5 w-5" />
              </div>
              <CardTitle className="text-sm">{r.titulo}</CardTitle>
              <CardDescription className="text-xs">{r.descricao}</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <ExportButtons onExcel={r.excel} onPDF={r.pdf} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
