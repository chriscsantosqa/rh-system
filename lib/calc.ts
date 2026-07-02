/**
 * Regras de negócio e cálculos automáticos do RH.
 * Compartilhado por Dashboard, VT, Atestados, Indicadores e Relatórios.
 */
import type {
  ASO, Atestado, EscalaEntry, Feriado, Funcionario, VTConfig, VTPagamento,
} from "@/types";
import { addDias, diaSemana, diasNoMes, diffDias, hojeISO, ultimasCompetencias } from "@/lib/utils";

/* =============================================================
 * ATESTADOS
 * ============================================================= */

/** Último dia coberto pelo atestado (inclusive) */
export function atestadoFim(a: Atestado): string {
  return addDias(a.dataEmissao, a.dias - 1);
}

/** Quantos dias do atestado caem dentro da competência yyyy-MM */
export function diasAtestadoNoMes(a: Atestado, ym: string): number {
  const ini = `${ym}-01`;
  const fim = `${ym}-${String(diasNoMes(ym)).padStart(2, "0")}`;
  const aIni = a.dataEmissao > ini ? a.dataEmissao : ini;
  const aFim = atestadoFim(a) < fim ? atestadoFim(a) : fim;
  return aFim < aIni ? 0 : diffDias(aIni, aFim) + 1;
}

/** Total de dias perdidos por uma lista de atestados dentro do mês */
export function diasPerdidosNoMes(atestados: Atestado[], ym: string): number {
  return atestados.reduce((s, a) => s + diasAtestadoNoMes(a, ym), 0);
}

export interface AlertaAtestado {
  nivel: "alto" | "medio";
  texto: string;
}

/**
 * Alertas automáticos por colaborador:
 *  - mais de 3 atestados em 6 meses
 *  - mais de 15 dias acumulados em 12 meses (próximo do INSS)
 *  - mais de 30 dias acumulados
 *  - atestado único ≥ 15 dias → encaminhamento ao INSS
 */
export function alertasAtestado(atestadosFunc: Atestado[]): AlertaAtestado[] {
  const hoje = hojeISO();
  const seisMeses = addDias(hoje, -182);
  const dozeMeses = addDias(hoje, -365);
  const out: AlertaAtestado[] = [];

  const ultimos6m = atestadosFunc.filter((a) => a.dataEmissao >= seisMeses);
  if (ultimos6m.length > 3) {
    out.push({ nivel: "alto", texto: `${ultimos6m.length} atestados nos últimos 6 meses` });
  } else if (ultimos6m.length === 3) {
    out.push({ nivel: "medio", texto: "3 atestados nos últimos 6 meses" });
  }

  const dias12m = atestadosFunc
    .filter((a) => a.dataEmissao >= dozeMeses)
    .reduce((s, a) => s + a.dias, 0);
  if (dias12m > 30) out.push({ nivel: "alto", texto: `${dias12m} dias perdidos em 12 meses` });
  else if (dias12m > 15) out.push({ nivel: "medio", texto: `${dias12m} dias perdidos em 12 meses` });

  if (atestadosFunc.some((a) => a.dias >= 15 && a.tipo !== "inss")) {
    out.push({ nivel: "alto", texto: "Atestado ≥ 15 dias — verificar encaminhamento ao INSS" });
  }

  // dias consecutivos: atestados encadeados (fim de um encosta no início do outro)
  const ord = [...atestadosFunc].sort((a, b) => a.dataEmissao.localeCompare(b.dataEmissao));
  for (let i = 1; i < ord.length; i++) {
    const gap = diffDias(atestadoFim(ord[i - 1]), ord[i].dataEmissao);
    if (gap >= 0 && gap <= 2) {
      const total = ord[i - 1].dias + ord[i].dias;
      if (total >= 15) out.push({ nivel: "alto", texto: `Atestados consecutivos somando ${total} dias` });
      break;
    }
  }
  return out;
}

/* =============================================================
 * ESCALA
 * ============================================================= */

export interface ResumoEscalaMes {
  trabalho: number;
  folgas: number;
  ferias: number;
  atestado: number;
  afastamento: number;
  trocas: number;
  extras: number;
  domingosTrabalhados: number;
  feriadosTrabalhados: number;
}

/** Resumo mensal da escala de um colaborador */
export function resumoEscala(
  entries: EscalaEntry[],
  funcionarioId: string,
  ym: string,
  feriados: Feriado[]
): ResumoEscalaMes {
  const fer = new Set(feriados.map((f) => f.data));
  const doFunc = entries.filter((e) => e.funcionarioId === funcionarioId && e.data.startsWith(ym));
  const r: ResumoEscalaMes = {
    trabalho: 0, folgas: 0, ferias: 0, atestado: 0, afastamento: 0,
    trocas: 0, extras: 0, domingosTrabalhados: 0, feriadosTrabalhados: 0,
  };
  for (const e of doFunc) {
    const trabalhou = e.tipo === "trabalho" || e.tipo === "troca" || e.tipo === "extra";
    if (e.tipo === "trabalho") r.trabalho++;
    if (e.tipo === "folga") r.folgas++;
    if (e.tipo === "ferias") r.ferias++;
    if (e.tipo === "atestado") r.atestado++;
    if (e.tipo === "afastamento") r.afastamento++;
    if (e.tipo === "troca") r.trocas++;
    if (e.tipo === "extra") r.extras++;
    if (trabalhou && diaSemana(e.data) === 0) r.domingosTrabalhados++;
    if (trabalhou && fer.has(e.data)) r.feriadosTrabalhados++;
  }
  return r;
}

/** Estimativa de dias úteis quando não há escala lançada no mês */
export function diasBaseEstimados(f: Funcionario, ym: string): number {
  const total = diasNoMes(ym);
  let uteis = 0;
  for (let d = 1; d <= total; d++) {
    const data = `${ym}-${String(d).padStart(2, "0")}`;
    const dow = diaSemana(data);
    if (f.escala === "5x2") {
      if (dow >= 1 && dow <= 5) uteis++;
    } else {
      if (dow !== 0) uteis++; // 6x1: seg a sáb
    }
  }
  // desconta ~4 folgas mensais no regime 6x1
  return f.escala === "5x2" ? uteis : Math.max(uteis - 4, 0);
}

/* =============================================================
 * VALE TRANSPORTE
 * ============================================================= */

export interface CalculoVT {
  funcionarioId: string;
  /** dias com presença efetiva (trabalho/troca/extra) */
  diasTrabalhados: number;
  diasFerias: number;
  diasAfastamento: number;
  diasAtestado: number;
  folgas: number;
  domingos: number;
  feriadosTrab: number;
  custoDia: number;
  valorTotal: number;
  /** true quando calculado pela escala; false quando estimado */
  baseEscala: boolean;
}

export function custoDiaVT(cfg: VTConfig): number {
  return cfg.valorIda + cfg.valorVolta + cfg.qtdIntegracoes * cfg.valorIntegracao;
}

/**
 * Cálculo automático do VT do mês:
 * dias efetivamente trabalhados × custo diário das conduções.
 */
export function calculaVT(
  f: Funcionario,
  cfg: VTConfig,
  ym: string,
  escalas: EscalaEntry[],
  atestados: Atestado[],
  feriados: Feriado[]
): CalculoVT {
  const r = resumoEscala(escalas, f.id, ym, feriados);
  const temEscala = escalas.some((e) => e.funcionarioId === f.id && e.data.startsWith(ym));
  const custo = custoDiaVT(cfg);

  let dias: number;
  let baseEscala: boolean;
  if (temEscala) {
    dias = r.trabalho + r.trocas + r.extras;
    baseEscala = true;
  } else {
    // sem escala lançada: estima e desconta atestados do mês
    const desconto = diasPerdidosNoMes(atestados.filter((a) => a.funcionarioId === f.id), ym);
    dias = Math.max(diasBaseEstimados(f, ym) - desconto, 0);
    baseEscala = false;
  }
  if (f.status === "afastado" && !temEscala) dias = 0;

  return {
    funcionarioId: f.id,
    diasTrabalhados: dias,
    diasFerias: r.ferias,
    diasAfastamento: r.afastamento,
    diasAtestado: r.atestado,
    folgas: r.folgas,
    domingos: r.domingosTrabalhados,
    feriadosTrab: r.feriadosTrabalhados,
    custoDia: custo,
    valorTotal: Math.round(dias * custo * 100) / 100,
    baseEscala,
  };
}

/* =============================================================
 * INDICADORES
 * ============================================================= */

/** Carga diária média em horas por regime (para "horas perdidas") */
export function cargaDiariaHoras(f: Funcionario): number {
  return f.escala === "5x2" ? 9 : 7.33;
}

export interface Indicadores {
  ativos: number;
  afastados: number;
  emFerias: number;
  desligados12m: number;
  absenteismoPct: number;
  turnoverPct: number;
  diasPerdidosMes: number;
  horasPerdidasMes: number;
  atestadosMes: number;
}

export function calculaIndicadores(
  funcionarios: Funcionario[],
  atestados: Atestado[],
  ym: string
): Indicadores {
  const ativos = funcionarios.filter((x) => x.status !== "desligado");
  const afastados = funcionarios.filter((x) => x.status === "afastado").length;
  const emFerias = funcionarios.filter((x) => x.status === "ferias" || (x.feriasInicio && x.feriasInicio <= hojeISO() && (x.feriasFim ?? "9999") >= hojeISO())).length;

  const umAnoAtras = addDias(`${ym}-01`, -365);
  const desligados12m = funcionarios.filter(
    (x) => x.dataDesligamento && x.dataDesligamento >= umAnoAtras
  ).length;

  const diasPerdidos = diasPerdidosNoMes(atestados, ym);
  const diasUteisMedios = 24; // aproximação p/ varejo 6x1
  const absenteismo = ativos.length > 0 ? (diasPerdidos / (ativos.length * diasUteisMedios)) * 100 : 0;

  // turnover anualizado simplificado: desligados 12m / headcount médio
  const headcountMedio = ativos.length + desligados12m / 2;
  const turnover = headcountMedio > 0 ? (desligados12m / headcountMedio) * 100 : 0;

  const horasPerdidas = atestados.reduce((s, a) => {
    const f = funcionarios.find((x) => x.id === a.funcionarioId);
    return s + diasAtestadoNoMes(a, ym) * (f ? cargaDiariaHoras(f) : 7.33);
  }, 0);

  return {
    ativos: ativos.length,
    afastados,
    emFerias,
    desligados12m,
    absenteismoPct: Math.round(absenteismo * 100) / 100,
    turnoverPct: Math.round(turnover * 100) / 100,
    diasPerdidosMes: diasPerdidos,
    horasPerdidasMes: Math.round(horasPerdidas * 10) / 10,
    atestadosMes: atestados.filter((a) => a.dataEmissao.startsWith(ym)).length,
  };
}

/* =============================================================
 * ALERTAS GERAIS (notificações)
 * ============================================================= */

export interface Notificacao {
  id: string;
  nivel: "alto" | "medio" | "info";
  titulo: string;
  detalhe: string;
  href: string;
}

export function geraNotificacoes(
  funcionarios: Funcionario[],
  atestados: Atestado[],
  asos: ASO[],
  vtPagamentos: VTPagamento[],
  ym: string
): Notificacao[] {
  const hoje = hojeISO();
  const out: Notificacao[] = [];
  const ativos = funcionarios.filter((f) => f.status !== "desligado");

  // ASOs vencendo em até 30 dias ou vencidos
  for (const f of ativos) {
    const doFunc = asos.filter((a) => a.funcionarioId === f.id && a.validade);
    if (doFunc.length === 0) continue;
    const ultimo = doFunc.sort((a, b) => (b.validade ?? "").localeCompare(a.validade ?? ""))[0];
    const dias = diffDias(hoje, ultimo.validade!);
    if (dias < 0) {
      out.push({ id: `aso-${f.id}`, nivel: "alto", titulo: `ASO vencido — ${f.nome}`, detalhe: `Venceu há ${-dias} dia(s)`, href: "/medicina" });
    } else if (dias <= 30) {
      out.push({ id: `aso-${f.id}`, nivel: "medio", titulo: `ASO vencendo — ${f.nome}`, detalhe: `Vence em ${dias} dia(s)`, href: "/medicina" });
    }
  }

  // férias próximas (próximos 45 dias)
  for (const f of ativos) {
    if (f.feriasInicio && f.feriasInicio >= hoje && diffDias(hoje, f.feriasInicio) <= 45) {
      out.push({ id: `fer-${f.id}`, nivel: "info", titulo: `Férias próximas — ${f.nome}`, detalhe: `Início em ${f.feriasInicio.split("-").reverse().join("/")}`, href: "/funcionarios" });
    }
  }

  // período de experiência (30/45/90 dias) vencendo em até 7 dias
  for (const f of ativos) {
    for (const marco of [30, 45, 90]) {
      const dataMarco = addDias(f.admissao, marco);
      const dias = diffDias(hoje, dataMarco);
      if (dias >= 0 && dias <= 7) {
        out.push({ id: `exp-${f.id}-${marco}`, nivel: "medio", titulo: `Experiência ${marco} dias — ${f.nome}`, detalhe: `Vence em ${dias} dia(s)`, href: "/funcionarios" });
      }
    }
  }

  // atestados recorrentes
  for (const f of ativos) {
    const alertas = alertasAtestado(atestados.filter((a) => a.funcionarioId === f.id));
    for (const a of alertas.filter((x) => x.nivel === "alto")) {
      out.push({ id: `at-${f.id}-${a.texto}`, nivel: "alto", titulo: `Atestados — ${f.nome}`, detalhe: a.texto, href: "/atestados" });
    }
  }

  // VT da competência atual ainda não pago
  const pagosMes = new Set(vtPagamentos.filter((p) => p.competencia === ym).map((p) => p.funcionarioId));
  const pendentes = ativos.filter((f) => f.status === "ativo" && !pagosMes.has(f.id)).length;
  if (pendentes > 0) {
    out.push({ id: "vt-pend", nivel: "info", titulo: "Vale transporte do mês", detalhe: `${pendentes} colaboradora(s) sem pagamento registrado na competência atual`, href: "/vale-transporte" });
  }

  const peso = { alto: 0, medio: 1, info: 2 };
  return out.sort((a, b) => peso[a.nivel] - peso[b.nivel]);
}

/* =============================================================
 * SÉRIES PARA GRÁFICOS
 * ============================================================= */

/** Série mensal (últimos n meses): atestados e dias perdidos */
export function serieAtestadosMensal(atestados: Atestado[], n = 6) {
  return ultimasCompetencias(n).reverse().map((ym) => ({
    ym,
    atestados: atestados.filter((a) => a.dataEmissao.startsWith(ym)).length,
    diasPerdidos: diasPerdidosNoMes(atestados, ym),
  }));
}

/** Série mensal de VT pago */
export function serieVTMensal(pagamentos: VTPagamento[], n = 6) {
  return ultimasCompetencias(n).reverse().map((ym) => {
    const doMes = pagamentos.filter((p) => p.competencia === ym);
    return {
      ym,
      total: Math.round(doMes.reduce((s, p) => s + p.valorTotal, 0) * 100) / 100,
      pix: Math.round(doMes.reduce((s, p) => s + p.valorPix, 0) * 100) / 100,
      cartao: Math.round(doMes.reduce((s, p) => s + p.valorCartao, 0) * 100) / 100,
    };
  });
}
