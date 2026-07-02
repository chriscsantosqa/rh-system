"use client";
/**
 * Indicadores automáticos de RH: absenteísmo, turnover, dias/horas perdidas,
 * atestados e VT por loja/gerente/colaboradora, headcount por status.
 */
import { useMemo, useState } from "react";
import { Activity, CalendarX2, Clock4, Palmtree, Repeat2, UserMinus, Users } from "lucide-react";
import { useData } from "@/hooks/use-data";
import { PageHeader } from "@/components/shared/page-header";
import { MonthPicker } from "@/components/shared/month-picker";
import { StatCard } from "@/components/shared/stat-card";
import { Barras, BarrasH, ChartCard, Linha } from "@/components/shared/charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { calculaIndicadores, diasPerdidosNoMes } from "@/lib/calc";
import { brl, fmtCompetencia, fmtCompetenciaCurta, mesAtual, num, ultimasCompetencias } from "@/lib/utils";

export default function IndicadoresPage() {
  const { funcionarios, lojas, atestados, vtPagamentos, loading } = useData();
  const [ym, setYm] = useState(mesAtual());

  const ind = useMemo(() => calculaIndicadores(funcionarios, atestados, ym), [funcionarios, atestados, ym]);

  /* série de absenteísmo (últimos 6 meses) */
  const serieAbs = ultimasCompetencias(6, ym).reverse().map((c) => {
    const i = calculaIndicadores(funcionarios, atestados, c);
    return { mes: fmtCompetenciaCurta(c), absenteismo: i.absenteismoPct, diasPerdidos: i.diasPerdidosMes };
  });

  /* tabela por loja (inclui gerente) */
  const porLoja = lojas.map((l) => {
    const funcs = funcionarios.filter((f) => f.lojaId === l.id);
    const ids = new Set(funcs.map((f) => f.id));
    const ats = atestados.filter((a) => ids.has(a.funcionarioId));
    const atsMes = ats.filter((a) => a.dataEmissao.startsWith(ym));
    const vt = vtPagamentos.filter((p) => ids.has(p.funcionarioId) && p.competencia === ym).reduce((s, p) => s + p.valorTotal, 0);
    return {
      loja: l.nome, gerente: l.gerente,
      ativos: funcs.filter((f) => f.status !== "desligado").length,
      atestadosMes: atsMes.length,
      diasPerdidos: diasPerdidosNoMes(ats, ym),
      vt,
    };
  });

  const vtPorColab = vtPagamentos
    .filter((p) => p.competencia === ym)
    .map((p) => ({ nome: funcionarios.find((f) => f.id === p.funcionarioId)?.nome ?? "?", valor: p.valorTotal }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 10);

  const atsPorColab = funcionarios
    .filter((f) => f.status !== "desligado")
    .map((f) => ({ nome: f.nome, qtd: atestados.filter((a) => a.funcionarioId === f.id && a.dataEmissao.startsWith(ym.slice(0, 4))).length }))
    .filter((x) => x.qtd > 0)
    .sort((a, b) => b.qtd - a.qtd)
    .slice(0, 10);

  if (loading) return <Skeleton className="h-96" />;

  return (
    <div className="space-y-6">
      <PageHeader titulo="Indicadores" descricao="Métricas automáticas calculadas a partir dos dados do sistema">
        <MonthPicker value={ym} onChange={setYm} />
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard titulo="Absenteísmo" valor={`${num(ind.absenteismoPct, 2)}%`} sub="dias perdidos ÷ dias úteis previstos" icon={Activity} tom={ind.absenteismoPct > 3 ? "alerta" : "ok"} />
        <StatCard titulo="Turnover (12m)" valor={`${num(ind.turnoverPct, 1)}%`} sub={`${ind.desligados12m} desligamento(s) em 12 meses`} icon={Repeat2} tom={ind.turnoverPct > 20 ? "alerta" : "ok"} />
        <StatCard titulo="Dias perdidos no mês" valor={ind.diasPerdidosMes} sub={`${ind.atestadosMes} atestado(s)`} icon={CalendarX2} />
        <StatCard titulo="Horas perdidas no mês" valor={`${num(ind.horasPerdidasMes, 1)}h`} sub="jornada média por regime" icon={Clock4} />
        <StatCard titulo="Ativas" valor={ind.ativos} icon={Users} tom="ok" />
        <StatCard titulo="Afastadas" valor={ind.afastados} icon={UserMinus} tom={ind.afastados > 0 ? "alerta" : "ok"} />
        <StatCard titulo="Em férias / programadas" valor={ind.emFerias} icon={Palmtree} tom="info" />
        <StatCard titulo="VT total no mês" valor={brl(vtPagamentos.filter((p) => p.competencia === ym).reduce((s, p) => s + p.valorTotal, 0))} icon={Activity} tom="info" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard titulo="Absenteísmo mensal (%)" descricao="Últimos 6 meses">
          <Linha data={serieAbs} x="mes" series={[{ key: "absenteismo", nome: "Absenteísmo %" }]} />
        </ChartCard>
        <ChartCard titulo="Dias perdidos por mês" descricao="Últimos 6 meses">
          <Barras data={serieAbs} x="mes" series={[{ key: "diasPerdidos", nome: "Dias perdidos", cor: "hsl(var(--chart-3))" }]} />
        </ChartCard>
        <ChartCard titulo={`Atestados por colaboradora em ${ym.slice(0, 4)}`} altura={Math.max(260, atsPorColab.length * 28)}>
          <BarrasH data={atsPorColab} categoria="nome" valor="qtd" nome="Atestados" />
        </ChartCard>
        <ChartCard titulo="VT por colaboradora" descricao={`Competência ${fmtCompetencia(ym)}`} altura={Math.max(260, vtPorColab.length * 28)}>
          <BarrasH data={vtPorColab} categoria="nome" valor="valor" nome="VT" format={brl} />
        </ChartCard>
      </div>

      {/* Por loja / gerente */}
      <Card className="animate-fade-in">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Indicadores por loja e gerente — {fmtCompetencia(ym)}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-transparent">
                <TableHead>Loja</TableHead>
                <TableHead>Gerente</TableHead>
                <TableHead className="text-center">Ativas</TableHead>
                <TableHead className="text-center">Atestados no mês</TableHead>
                <TableHead className="text-center">Dias perdidos</TableHead>
                <TableHead className="text-right">VT pago</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {porLoja.map((l) => (
                <TableRow key={l.loja}>
                  <TableCell className="font-medium">{l.loja}</TableCell>
                  <TableCell className="text-muted-foreground">{l.gerente}</TableCell>
                  <TableCell className="text-center">{l.ativos}</TableCell>
                  <TableCell className="text-center">{l.atestadosMes}</TableCell>
                  <TableCell className="text-center">{l.diasPerdidos}</TableCell>
                  <TableCell className="text-right font-medium">{brl(l.vt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
            Fórmulas — Absenteísmo: dias perdidos no mês ÷ (colaboradoras ativas × 24 dias úteis médios).
            Turnover: desligamentos em 12 meses ÷ headcount médio. Horas perdidas: dias de atestado × jornada média
            do regime (6x1 ≈ 7h20; 5x2 = 9h).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
