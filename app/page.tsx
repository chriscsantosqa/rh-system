"use client";
/**
 * Dashboard principal: visão geral do RH com cards, gráficos e filtros
 * por mês, período, loja e colaborador.
 */
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle, Bus, CakeSlice, ClipboardPlus, HeartPulse,
  Palmtree, UserMinus, Users,
} from "lucide-react";
import { useData } from "@/hooks/use-data";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { MonthPicker } from "@/components/shared/month-picker";
import { FiltroSelect } from "@/components/shared/filtro-select";
import { Barras, BarrasH, ChartCard, Linha, Pizza } from "@/components/shared/charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  diasPerdidosNoMes, geraNotificacoes, serieAtestadosMensal, serieVTMensal,
} from "@/lib/calc";
import { brl, diffDias, fmtCompetenciaCurta, hojeISO, mesAtual, num, ultimasCompetencias } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { funcionarios, lojas, atestados, vtPagamentos, asos, loading } = useData();
  const [ym, setYm] = useState(mesAtual());
  const [periodo, setPeriodo] = useState("6");
  const [lojaFiltro, setLojaFiltro] = useState("todos");
  const [funcFiltro, setFuncFiltro] = useState("todos");
  const router = useRouter();

  /* ---------- aplica filtros de loja/colaborador ---------- */
  const funcs = useMemo(() => {
    let out = funcionarios;
    if (lojaFiltro !== "todos") out = out.filter((f) => f.lojaId === lojaFiltro);
    if (funcFiltro !== "todos") out = out.filter((f) => f.id === funcFiltro);
    return out;
  }, [funcionarios, lojaFiltro, funcFiltro]);

  const idsFiltro = useMemo(() => new Set(funcs.map((f) => f.id)), [funcs]);
  const ats = useMemo(() => atestados.filter((a) => idsFiltro.has(a.funcionarioId)), [atestados, idsFiltro]);
  const pags = useMemo(() => vtPagamentos.filter((p) => idsFiltro.has(p.funcionarioId)), [vtPagamentos, idsFiltro]);

  /* ---------- métricas dos cards ---------- */
  const hoje = hojeISO();
  const ativos = funcs.filter((f) => f.status !== "desligado");
  const afastados = funcs.filter((f) => f.status === "afastado");
  const atestadosMes = ats.filter((a) => a.dataEmissao.startsWith(ym));
  const diasPerdidos = diasPerdidosNoMes(ats, ym);
  const gastoVTMes = pags.filter((p) => p.competencia === ym).reduce((s, p) => s + p.valorTotal, 0);
  const feriasProximas = ativos.filter(
    (f) => f.feriasInicio && f.feriasInicio >= hoje && diffDias(hoje, f.feriasInicio) <= 60
  );
  const asoVencendo = ativos.filter((f) => {
    const doFunc = asos.filter((a) => a.funcionarioId === f.id && a.validade);
    if (doFunc.length === 0) return false;
    const ult = doFunc.sort((a, b) => (b.validade ?? "").localeCompare(a.validade ?? ""))[0];
    return diffDias(hoje, ult.validade!) <= 30;
  });
  const aniversariantes = ativos.filter((f) => f.nascimento.slice(5, 7) === ym.slice(5, 7));

  /* ---------- séries e rankings ---------- */
  const n = Number(periodo);
  const serieAts = serieAtestadosMensal(ats, n).map((x) => ({ ...x, mes: fmtCompetenciaCurta(x.ym) }));
  const serieVT = serieVTMensal(pags, n).map((x) => ({ ...x, mes: fmtCompetenciaCurta(x.ym) }));
  const comps = new Set(ultimasCompetencias(n));

  const porLoja = lojas
    .map((l) => {
      const idsLoja = new Set(funcionarios.filter((f) => f.lojaId === l.id && idsFiltro.has(f.id)).map((f) => f.id));
      const doPeriodo = ats.filter((a) => idsLoja.has(a.funcionarioId) && comps.has(a.dataEmissao.slice(0, 7)));
      return {
        loja: l.nome.replace("Lupatelli ", "").replace("Enlace ", "En. "),
        cor: l.cor,
        atestados: doPeriodo.length,
        diasPerdidos: doPeriodo.reduce((s, a) => s + a.dias, 0),
        vt: pags.filter((p) => idsLoja.has(p.funcionarioId) && comps.has(p.competencia)).reduce((s, p) => s + p.valorTotal, 0),
        colaboradores: funcionarios.filter((f) => f.lojaId === l.id && f.status !== "desligado" && idsFiltro.has(f.id)).length,
      };
    })
    .filter((x) => x.colaboradores > 0 || x.atestados > 0);

  const rankingFuncs = ativos
    .map((f) => {
      const doPeriodo = ats.filter((a) => a.funcionarioId === f.id && comps.has(a.dataEmissao.slice(0, 7)));
      return { nome: f.nome, atestados: doPeriodo.length, dias: doPeriodo.reduce((s, a) => s + a.dias, 0) };
    })
    .filter((x) => x.atestados > 0)
    .sort((a, b) => b.atestados - a.atestados || b.dias - a.dias)
    .slice(0, 7);

  const rankingDias = ativos
    .map((f) => ({
      nome: f.nome,
      dias: ats.filter((a) => a.funcionarioId === f.id && comps.has(a.dataEmissao.slice(0, 7))).reduce((s, a) => s + a.dias, 0),
    }))
    .filter((x) => x.dias > 0)
    .sort((a, b) => b.dias - a.dias)
    .slice(0, 7);

  const notifs = geraNotificacoes(funcionarios, atestados, asos, vtPagamentos, mesAtual());

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-72" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader titulo="Dashboard" descricao="Visão geral do RH — Lupatelli & Enlace">
        <MonthPicker value={ym} onChange={setYm} />
      </PageHeader>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2 -mt-2">
        <FiltroSelect
          value={lojaFiltro}
          onChange={setLojaFiltro}
          opcoes={lojas.map((l) => ({ value: l.id, label: l.nome }))}
          placeholder="Loja"
          todosLabel="Todas as lojas"
        />
        <FiltroSelect
          value={funcFiltro}
          onChange={setFuncFiltro}
          opcoes={funcionarios.filter((f) => f.status !== "desligado").map((f) => ({ value: f.id, label: f.nome }))}
          placeholder="Colaboradora"
          todosLabel="Todas as colaboradoras"
          className="w-[200px]"
        />
        <Select value={periodo} onValueChange={setPeriodo}>
          <SelectTrigger className="w-[190px]">
            <SelectValue placeholder="Período dos gráficos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">Últimos 3 meses</SelectItem>
            <SelectItem value="6">Últimos 6 meses</SelectItem>
            <SelectItem value="12">Últimos 12 meses</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cards de indicadores */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard titulo="Colaboradoras" valor={ativos.length} sub={`${lojas.length} lojas`} icon={Users} onClick={() => router.push("/funcionarios")} />
        <StatCard titulo="Atestados no mês" valor={atestadosMes.length} sub={`${ats.length} no total`} icon={ClipboardPlus} tom="info" onClick={() => router.push("/atestados")} />
        <StatCard titulo="Dias perdidos no mês" valor={diasPerdidos} sub="por atestados" icon={AlertTriangle} tom={diasPerdidos > 10 ? "alerta" : "default"} />
        <StatCard titulo="Gasto com VT no mês" valor={brl(gastoVTMes)} sub={gastoVTMes === 0 ? "sem pagamentos na competência" : "pagamentos registrados"} icon={Bus} tom="ok" onClick={() => router.push("/vale-transporte")} />
        <StatCard titulo="Afastadas" valor={afastados.length} sub={afastados.map((f) => f.nome).join(", ") || "nenhuma"} icon={UserMinus} tom={afastados.length > 0 ? "alerta" : "default"} />
        <StatCard titulo="Férias próximas" valor={feriasProximas.length} sub={feriasProximas.map((f) => f.nome).join(", ") || "próximos 60 dias"} icon={Palmtree} tom="info" />
        <StatCard titulo="ASO vencendo" valor={asoVencendo.length} sub={asoVencendo.map((f) => f.nome).join(", ") || "próximos 30 dias"} icon={HeartPulse} tom={asoVencendo.length > 0 ? "alerta" : "ok"} onClick={() => router.push("/medicina")} />
        <StatCard titulo="Aniversariantes do mês" valor={aniversariantes.length} sub={aniversariantes.map((f) => f.nome).join(", ") || "—"} icon={CakeSlice} />
      </div>

      {/* Quantidade por loja + alertas */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="animate-fade-in lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Colaboradoras por loja</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {porLoja.map((l) => (
              <div key={l.loja} className="rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: l.cor }} />
                  <p className="truncate text-xs font-medium text-muted-foreground">{l.loja}</p>
                </div>
                <p className="mt-1 text-xl font-bold">{l.colaboradores}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="animate-fade-in">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <AlertTriangle className="h-4 w-4 text-amber-500" /> Alertas
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-56 space-y-2 overflow-y-auto">
            {notifs.length === 0 && <p className="text-sm text-muted-foreground">Nenhum alerta ativo.</p>}
            {notifs.slice(0, 8).map((nf) => (
              <button
                key={nf.id}
                onClick={() => router.push(nf.href)}
                className="flex w-full items-start gap-2 rounded-md p-1.5 text-left hover:bg-accent transition-colors"
              >
                <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", nf.nivel === "alto" ? "bg-red-500" : nf.nivel === "medio" ? "bg-amber-500" : "bg-sky-500")} />
                <span className="min-w-0">
                  <span className="block truncate text-xs font-medium">{nf.titulo}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">{nf.detalhe}</span>
                </span>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard titulo="Atestados por mês" descricao={`Últimos ${n} meses`}>
          <Barras data={serieAts} x="mes" series={[{ key: "atestados", nome: "Atestados" }, { key: "diasPerdidos", nome: "Dias perdidos", cor: "hsl(var(--chart-3))" }]} />
        </ChartCard>

        <ChartCard titulo="Atestados por loja" descricao={`Últimos ${n} meses`}>
          <Barras data={porLoja} x="loja" series={[{ key: "atestados", nome: "Atestados" }]} />
        </ChartCard>

        <ChartCard titulo="Gasto mensal com Vale Transporte" descricao={`Últimos ${n} meses (pago)`}>
          <Linha data={serieVT} x="mes" format={brl} series={[{ key: "total", nome: "Total" }, { key: "cartao", nome: "Cartão VT", cor: "hsl(var(--chart-2))" }, { key: "pix", nome: "PIX", cor: "hsl(var(--chart-3))" }]} />
        </ChartCard>

        <ChartCard titulo="Gasto de VT por loja" descricao={`Últimos ${n} meses`}>
          <Pizza data={porLoja.filter((x) => x.vt > 0).map((x) => ({ nome: x.loja, valor: Math.round(x.vt * 100) / 100, cor: x.cor }))} nameKey="nome" valueKey="valor" format={brl} />
        </ChartCard>

        <ChartCard titulo="Ranking — mais atestados" descricao={`Colaboradoras · últimos ${n} meses`}>
          <BarrasH data={rankingFuncs} categoria="nome" valor="atestados" nome="Atestados" />
        </ChartCard>

        <ChartCard titulo="Dias perdidos por colaboradora" descricao={`Últimos ${n} meses`}>
          <BarrasH data={rankingDias} categoria="nome" valor="dias" nome="Dias" />
        </ChartCard>
      </div>

      {/* Ranking de lojas */}
      <Card className="animate-fade-in">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Ranking de lojas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {[...porLoja]
              .sort((a, b) => a.diasPerdidos - b.diasPerdidos)
              .map((l, i) => (
                <div key={l.loja} className="flex items-center gap-3 rounded-lg border p-3">
                  <Badge variant={i === 0 ? "success" : i >= porLoja.length - 2 ? "warning" : "secondary"} className="h-7 w-7 justify-center rounded-full p-0">
                    {i + 1}º
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{l.loja}</p>
                    <p className="text-xs text-muted-foreground">
                      {l.atestados} atestado(s) · {l.diasPerdidos} dia(s) perdido(s) · VT {brl(l.vt)}
                    </p>
                  </div>
                </div>
              ))}
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">
            Ordenado do melhor para o pior desempenho (menos dias perdidos no período).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
