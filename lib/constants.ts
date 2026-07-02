import type { Papel, StatusFuncionario, TipoASO, TipoAtestado, TipoDiaEscala, TipoDocumento } from "@/types";

/* ===================== Rótulos e cores ===================== */

export const STATUS_LABEL: Record<StatusFuncionario, string> = {
  ativo: "Ativo",
  desligado: "Desligado",
  ferias: "Férias",
  afastado: "Afastado",
};

export const STATUS_BADGE: Record<StatusFuncionario, string> = {
  ativo: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  desligado: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30",
  ferias: "bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/30",
  afastado: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
};

export const TIPO_ATESTADO_LABEL: Record<TipoAtestado, string> = {
  com_cid: "Com CID",
  sem_cid: "Sem CID",
  acidente: "Acidente",
  inss: "INSS",
};

export const TIPO_ASO_LABEL: Record<TipoASO, string> = {
  admissional: "Admissional",
  periodico: "Periódico",
  demissional: "Demissional",
  mudanca_funcao: "Mudança de função",
  retorno_trabalho: "Retorno ao trabalho",
};

export const TIPO_DOC_LABEL: Record<TipoDocumento, string> = {
  contrato: "Contrato",
  advertencia: "Advertência",
  suspensao: "Suspensão",
  aso: "ASO",
  pessoal: "Documento pessoal",
  treinamento: "Treinamento",
  certificado: "Certificado",
  outro: "Outro",
};

export const PAPEL_LABEL: Record<Papel, string> = {
  admin: "Administrador",
  rh: "RH",
  gerente: "Gerente",
  consulta: "Consulta",
};

/** Escala: rótulo curto, cor e descrição de cada tipo de dia */
export const ESCALA_DIA: Record<TipoDiaEscala, { sigla: string; label: string; cls: string }> = {
  trabalho:    { sigla: "T",  label: "Trabalho",    cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" },
  folga:       { sigla: "F",  label: "Folga",       cls: "bg-zinc-400/20 text-zinc-600 dark:text-zinc-400" },
  ferias:      { sigla: "FÉ", label: "Férias",      cls: "bg-sky-500/15 text-sky-700 dark:text-sky-400" },
  atestado:    { sigla: "AT", label: "Atestado",    cls: "bg-amber-500/20 text-amber-700 dark:text-amber-400" },
  afastamento: { sigla: "AF", label: "Afastamento", cls: "bg-red-500/15 text-red-700 dark:text-red-400" },
  troca:       { sigla: "TR", label: "Troca",       cls: "bg-violet-500/15 text-violet-700 dark:text-violet-400" },
  extra:       { sigla: "EX", label: "Extra",       cls: "bg-orange-500/20 text-orange-700 dark:text-orange-400" },
};

export const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

/** Paleta usada nos gráficos (referencia as CSS vars do tema) */
export const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(243 40% 45%)",
  "hsl(172 40% 32%)",
];
