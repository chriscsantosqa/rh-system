/**
 * Tipos centrais do sistema de RH.
 * Todas as datas são strings ISO (yyyy-MM-dd). Competências usam yyyy-MM.
 */

export type StatusFuncionario = "ativo" | "desligado" | "ferias" | "afastado";

export interface Loja {
  id: string;
  nome: string;
  /** Nome do(a) gerente responsável (exibição rápida) */
  gerente: string;
  cidade?: string;
  cor?: string; // cor de destaque usada em gráficos/badges
}

export interface Horario {
  id: string;
  nome: string;
  /** ex.: "Seg a Sáb", "Seg a Qui", "Domingos e feriados" */
  dias: string;
  entrada: string; // "09:40"
  saida: string;   // "18:00"
  /** Horário diferenciado de sexta-feira (escritório) */
  entradaSexta?: string;
  saidaSexta?: string;
  intervaloMin: number;
  aplicacao: "loja" | "escritorio";
}

export interface Funcionario {
  id: string;
  nome: string;
  cargo: string;
  lojaId: string;
  horarioId: string;
  /** Regime de escala, ex.: "6x1", "5x2" */
  escala: string;
  admissao: string;
  nascimento: string;
  cpf: string;
  rg: string;
  telefone: string;
  email: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  status: StatusFuncionario;
  dataDesligamento?: string;
  /** Período de férias programado/atual */
  feriasInicio?: string;
  feriasFim?: string;
  obs?: string;
  criadoEm: string;
}

/** Tipo de dia na escala mensal */
export type TipoDiaEscala =
  | "trabalho"
  | "folga"
  | "ferias"
  | "atestado"
  | "afastamento"
  | "troca"
  | "extra";

export interface EscalaEntry {
  id: string;
  funcionarioId: string;
  data: string; // yyyy-MM-dd
  tipo: TipoDiaEscala;
  /** Permite mudança de horário em dia específico */
  horarioId?: string;
  obs?: string;
}

export interface BancoHorasEntry {
  id: string;
  funcionarioId: string;
  data: string;
  /** Horas positivas (crédito) ou negativas (débito) */
  horas: number;
  motivo: string;
}

export type TipoAtestado = "com_cid" | "sem_cid" | "acidente" | "inss";

export interface Atestado {
  id: string;
  funcionarioId: string;
  dataEmissao: string;
  /** Quantidade de dias de afastamento do atestado */
  dias: number;
  cid?: string;
  medico: string;
  crm: string;
  hospital: string;
  tipo: TipoAtestado;
  obs?: string;
  /** Caminho do arquivo enviado (upload) */
  arquivo?: string;
  criadoEm: string;
}

export type FormaPagamentoVT = "cartao" | "pix" | "misto";

export interface VTConfig {
  id: string;
  funcionarioId: string;
  recebeVT: boolean;
  valorIda: number;
  valorVolta: number;
  qtdIntegracoes: number;
  valorIntegracao: number;
  /** Conduções por dia (ida + volta + integrações) — informativo */
  condPorDia: number;
  formaPadrao: FormaPagamentoVT;
}

export interface VTPagamento {
  id: string;
  funcionarioId: string;
  competencia: string; // yyyy-MM
  diasConsiderados: number;
  custoDia: number;
  valorTotal: number;
  valorCartao: number;
  valorPix: number;
  dataPagamento: string;
  responsavel: string;
  obs?: string;
}

export type TipoASO =
  | "admissional"
  | "periodico"
  | "demissional"
  | "mudanca_funcao"
  | "retorno_trabalho";

export interface ASO {
  id: string;
  funcionarioId: string;
  tipo: TipoASO;
  dataRealizacao: string;
  /** Data de validade (próximo exame). Demissional não possui. */
  validade?: string;
  medico?: string;
  clinica?: string;
  resultado: "apto" | "inapto" | "apto_restricoes";
  obs?: string;
}

export type TipoDocumento =
  | "contrato"
  | "advertencia"
  | "suspensao"
  | "aso"
  | "pessoal"
  | "treinamento"
  | "certificado"
  | "outro";

export interface Documento {
  id: string;
  funcionarioId: string;
  tipo: TipoDocumento;
  titulo: string;
  data: string;
  arquivo?: string;
  obs?: string;
}

export type Papel = "admin" | "rh" | "gerente" | "consulta";

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  papel: Papel;
  /** Gerentes enxergam apenas a própria loja */
  lojaId?: string;
}

export interface Feriado {
  data: string;
  nome: string;
}

export interface AuditEntry {
  id: string;
  dataHora: string;
  usuario: string;
  acao: "criar" | "editar" | "excluir" | "restaurar" | "importar";
  colecao: string;
  itemId: string;
  detalhe: string;
}

/** Formato completo do banco de dados JSON */
export interface DBShape {
  lojas: Loja[];
  horarios: Horario[];
  funcionarios: Funcionario[];
  escalas: EscalaEntry[];
  bancoHoras: BancoHorasEntry[];
  atestados: Atestado[];
  vtConfigs: VTConfig[];
  vtPagamentos: VTPagamento[];
  asos: ASO[];
  documentos: Documento[];
  usuarios: Usuario[];
  feriados: Feriado[];
  auditoria: AuditEntry[];
}

export type CollectionName = keyof DBShape;
