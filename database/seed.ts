/**
 * Seed do banco de dados com os dados reais das lojas Lupatelli & Enlace.
 * Gerado de forma determinística para facilitar testes (QA-friendly).
 * CPFs/RGs/contatos são FICTÍCIOS.
 */
import type {
  ASO, Atestado, BancoHorasEntry, DBShape, Documento, EscalaEntry,
  Feriado, Funcionario, Horario, Loja, Usuario, VTConfig, VTPagamento,
} from "@/types";

/* ===================== Lojas ===================== */

const lojas: Loja[] = [
  { id: "l-plaza", nome: "Lupatelli Plaza", gerente: "Dani Matias", cidade: "Guarulhos", cor: "#6366f1" },
  { id: "l-itaquera", nome: "Lupatelli Itaquera", gerente: "Claudia", cidade: "São Paulo", cor: "#14b8a6" },
  { id: "l-tatuape", nome: "Lupatelli Tatuapé", gerente: "Katia", cidade: "São Paulo", cor: "#f59e0b" },
  { id: "l-west", nome: "Enlace West", gerente: "Allanys", cidade: "São Paulo", cor: "#ec4899" },
  { id: "l-boulevard", nome: "Enlace Boulevard", gerente: "Isabela", cidade: "São Paulo", cor: "#0ea5e9" },
  { id: "l-atrium", nome: "Enlace Atrium", gerente: "Vitória", cidade: "Santo André", cor: "#8b5cf6" },
  { id: "l-escritorio", nome: "Escritório", gerente: "João Pedro", cidade: "São Paulo", cor: "#64748b" },
];

/* ===================== Horários ===================== */

const horarios: Horario[] = [
  { id: "h-manha", nome: "Manhã", dias: "Seg a Sáb", entrada: "09:40", saida: "18:00", intervaloMin: 60, aplicacao: "loja" },
  { id: "h-inter", nome: "Intermediário", dias: "Seg a Sáb", entrada: "12:00", saida: "21:00", intervaloMin: 60, aplicacao: "loja" },
  { id: "h-tarde", nome: "Tarde", dias: "Seg a Sáb", entrada: "13:25", saida: "21:45", intervaloMin: 60, aplicacao: "loja" },
  { id: "h-domfer", nome: "Domingos/Feriados", dias: "Dom e feriados", entrada: "14:00", saida: "19:45", intervaloMin: 15, aplicacao: "loja" },
  { id: "h-esc1", nome: "Escritório 07h", dias: "Seg a Sex", entrada: "07:00", saida: "17:00", entradaSexta: "07:00", saidaSexta: "16:30", intervaloMin: 60, aplicacao: "escritorio" },
  { id: "h-esc2", nome: "Escritório 07h30", dias: "Seg a Sex", entrada: "07:30", saida: "17:30", entradaSexta: "07:30", saidaSexta: "16:30", intervaloMin: 60, aplicacao: "escritorio" },
];

/* ===================== Funcionárias ===================== */
/** Tabela-fonte compacta: [id, nome, cargo, loja, horário, admissão, nascimento, validade do ASO vigente] */

type Meta = {
  id: string; nome: string; cargo: string; lojaId: string; horarioId: string;
  admissao: string; nascimento: string; asoValidade: string;
  status?: Funcionario["status"]; feriasInicio?: string; feriasFim?: string;
  dataDesligamento?: string; obs?: string;
};

const meta: Meta[] = [
  // Lupatelli Plaza
  { id: "f-marcela", nome: "Marcela", cargo: "Vendedora", lojaId: "l-plaza", horarioId: "h-manha", admissao: "2023-03-06", nascimento: "1996-07-07", asoValidade: "2026-08-10" },
  { id: "f-rogeria", nome: "Rogéria", cargo: "Vendedora", lojaId: "l-plaza", horarioId: "h-inter", admissao: "2021-09-13", nascimento: "1988-02-19", asoValidade: "2026-09-14" },
  { id: "f-lais", nome: "Laís", cargo: "Vendedora", lojaId: "l-plaza", horarioId: "h-tarde", admissao: "2024-05-20", nascimento: "1999-11-02", asoValidade: "2026-10-05", feriasInicio: "2026-07-20", feriasFim: "2026-08-03", obs: "Férias programadas de 20/07 a 03/08." },
  { id: "f-dani", nome: "Dani Matias", cargo: "Gerente", lojaId: "l-plaza", horarioId: "h-inter", admissao: "2019-02-04", nascimento: "1985-04-28", asoValidade: "2026-11-09" },
  // Lupatelli Itaquera
  { id: "f-saiany", nome: "Saiany", cargo: "Vendedora", lojaId: "l-itaquera", horarioId: "h-manha", admissao: "2022-08-01", nascimento: "1997-01-15", asoValidade: "2026-09-28" },
  { id: "f-karoynne", nome: "Karoynne", cargo: "Vendedora", lojaId: "l-itaquera", horarioId: "h-tarde", admissao: "2023-10-09", nascimento: "2000-06-23", asoValidade: "2026-06-20" },
  { id: "f-sueli", nome: "Sueli", cargo: "Vendedora", lojaId: "l-itaquera", horarioId: "h-inter", admissao: "2018-04-16", nascimento: "1979-09-30", asoValidade: "2026-12-01", status: "afastado", obs: "Afastada pelo INSS desde 28/04/2026 (lesão no ombro — M75.1). Aguardando perícia." },
  { id: "f-claudia", nome: "Claudia", cargo: "Gerente", lojaId: "l-itaquera", horarioId: "h-inter", admissao: "2017-06-12", nascimento: "1982-12-05", asoValidade: "2026-10-19" },
  // Lupatelli Tatuapé
  { id: "f-renata", nome: "Renata", cargo: "Vendedora", lojaId: "l-tatuape", horarioId: "h-manha", admissao: "2020-11-23", nascimento: "1993-03-17", asoValidade: "2026-07-28" },
  { id: "f-daniela", nome: "Daniela", cargo: "Vendedora", lojaId: "l-tatuape", horarioId: "h-inter", admissao: "2022-02-14", nascimento: "1995-08-09", asoValidade: "2026-09-01" },
  { id: "f-bruna", nome: "Bruna", cargo: "Vendedora", lojaId: "l-tatuape", horarioId: "h-tarde", admissao: "2025-01-13", nascimento: "2001-05-26", asoValidade: "2027-01-10" },
  { id: "f-katia", nome: "Katia", cargo: "Gerente", lojaId: "l-tatuape", horarioId: "h-inter", admissao: "2016-03-07", nascimento: "1980-10-11", asoValidade: "2026-11-23" },
  // Enlace West
  { id: "f-maria", nome: "Maria", cargo: "Vendedora", lojaId: "l-west", horarioId: "h-manha", admissao: "2021-05-10", nascimento: "1990-04-03", asoValidade: "2026-10-12" },
  { id: "f-mariana", nome: "Mariana", cargo: "Vendedora", lojaId: "l-west", horarioId: "h-tarde", admissao: "2023-07-03", nascimento: "1998-12-14", asoValidade: "2026-08-24" },
  { id: "f-allanys", nome: "Allanys", cargo: "Gerente", lojaId: "l-west", horarioId: "h-inter", admissao: "2020-01-20", nascimento: "1992-06-30", asoValidade: "2026-12-14" },
  // Enlace Boulevard
  { id: "f-eloisa", nome: "Eloisa", cargo: "Vendedora", lojaId: "l-boulevard", horarioId: "h-manha", admissao: "2022-10-17", nascimento: "1994-02-08", asoValidade: "2026-09-21" },
  { id: "f-joyce", nome: "Joyce", cargo: "Vendedora", lojaId: "l-boulevard", horarioId: "h-tarde", admissao: "2024-03-04", nascimento: "1997-07-21", asoValidade: "2026-10-26" },
  { id: "f-isabela", nome: "Isabela", cargo: "Gerente", lojaId: "l-boulevard", horarioId: "h-inter", admissao: "2019-08-26", nascimento: "1989-01-27", asoValidade: "2026-11-30" },
  // Enlace Atrium
  { id: "f-gislene", nome: "Gislene", cargo: "Vendedora", lojaId: "l-atrium", horarioId: "h-manha", admissao: "2021-02-08", nascimento: "1987-05-19", asoValidade: "2026-07-15" },
  { id: "f-bianca", nome: "Bianca", cargo: "Vendedora", lojaId: "l-atrium", horarioId: "h-tarde", admissao: "2026-05-18", nascimento: "2002-09-04", asoValidade: "2027-05-18", obs: "Em período de experiência (45 + 45 dias)." },
  { id: "f-vitoria", nome: "Vitória", cargo: "Gerente", lojaId: "l-atrium", horarioId: "h-inter", admissao: "2020-09-14", nascimento: "1991-11-08", asoValidade: "2026-12-07" },
  // Escritório
  { id: "f-joaopedro", nome: "João Pedro", cargo: "Analista de RH", lojaId: "l-escritorio", horarioId: "h-esc1", admissao: "2019-05-06", nascimento: "1990-08-15", asoValidade: "2026-11-16" },
  { id: "f-marina", nome: "Marina", cargo: "Analista Financeiro", lojaId: "l-escritorio", horarioId: "h-esc1", admissao: "2020-07-13", nascimento: "1994-07-30", asoValidade: "2026-12-21" },
  { id: "f-emanuelle", nome: "Emanuelle", cargo: "Encomendas", lojaId: "l-escritorio", horarioId: "h-esc2", admissao: "2022-04-11", nascimento: "1996-10-06", asoValidade: "2026-09-07" },
  { id: "f-alessandra", nome: "Alessandra", cargo: "Encomendas", lojaId: "l-escritorio", horarioId: "h-esc1", admissao: "2023-08-21", nascimento: "1993-01-22", asoValidade: "2026-10-30" },
  // Desligada (histórico para turnover)
  { id: "f-patricia", nome: "Patrícia", cargo: "Vendedora", lojaId: "l-plaza", horarioId: "h-tarde", admissao: "2023-02-06", nascimento: "1995-06-11", asoValidade: "2026-02-01", status: "desligado", dataDesligamento: "2026-03-14", obs: "Desligada em 14/03/2026 (pedido de demissão)." },
];

/** Dados de contato fictícios gerados deterministicamente */
function contato(i: number) {
  const ddd = 11;
  const tel = `(${ddd}) 9${String(6100 + i * 37).padStart(4, "0")}-${String(1000 + i * 211).slice(0, 4)}`;
  const cpf = `${String(100 + i * 7).padStart(3, "0")}.${String(200 + i * 13).slice(-3).padStart(3, "0")}.${String(300 + i * 17).slice(-3).padStart(3, "0")}-${String(10 + i).slice(-2)}`;
  const rg = `${String(20 + i)}.${String(100 + i * 3).slice(-3)}.${String(400 + i * 9).slice(-3)}-${(i % 9) + 1}`;
  return { tel, cpf, rg };
}

const enderecos = [
  ["Rua das Camélias, 120", "São Paulo", "SP", "03571-020"],
  ["Av. Águia de Haia, 850", "São Paulo", "SP", "03694-000"],
  ["Rua Tuiuti, 1420", "São Paulo", "SP", "03307-000"],
  ["Rua Itapura, 300", "São Paulo", "SP", "03310-000"],
  ["Av. Radial Leste, 2010", "São Paulo", "SP", "03652-000"],
  ["Rua Serra de Bragança, 95", "São Paulo", "SP", "03318-000"],
  ["Rua Cantagalo, 692", "São Paulo", "SP", "03319-000"],
  ["Av. Aricanduva, 5555", "São Paulo", "SP", "03930-350"],
  ["Rua Padre Estanislau, 77", "Guarulhos", "SP", "07095-000"],
  ["Rua das Figueiras, 410", "Santo André", "SP", "09080-300"],
];

const funcionarios: Funcionario[] = meta.map((m, i) => {
  const c = contato(i);
  const end = enderecos[i % enderecos.length];
  const slug = m.nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, ".");
  return {
    id: m.id,
    nome: m.nome,
    cargo: m.cargo,
    lojaId: m.lojaId,
    horarioId: m.horarioId,
    escala: m.lojaId === "l-escritorio" ? "5x2" : "6x1",
    admissao: m.admissao,
    nascimento: m.nascimento,
    cpf: c.cpf,
    rg: c.rg,
    telefone: c.tel,
    email: `${slug}@lupatelli.com.br`,
    endereco: end[0],
    cidade: end[1],
    estado: end[2],
    cep: end[3],
    status: m.status ?? "ativo",
    dataDesligamento: m.dataDesligamento,
    feriasInicio: m.feriasInicio,
    feriasFim: m.feriasFim,
    obs: m.obs,
    criadoEm: m.admissao,
  };
});

/* ===================== Atestados (jan–jul/2026) ===================== */

const medicos = [
  { medico: "Dr. Carlos Menezes", crm: "112345-SP", hospital: "Hospital Santa Marcelina" },
  { medico: "Dra. Paula Rocha", crm: "98221-SP", hospital: "AMA Itaquera" },
  { medico: "Dr. Felipe Arantes", crm: "130877-SP", hospital: "Hospital São Luiz" },
  { medico: "Dra. Renata Cunha", crm: "87554-SP", hospital: "UBS Tatuapé" },
  { medico: "Dr. Marcio Tanaka", crm: "121009-SP", hospital: "Hospital IGESP" },
];

/** [funcionarioId, dataEmissao, dias, cid|null, tipo] */
const atestadosFonte: Array<[string, string, number, string | null, Atestado["tipo"]]> = [
  ["f-rogeria", "2026-01-19", 2, "J06", "com_cid"],
  ["f-rogeria", "2026-02-23", 1, "M54.5", "com_cid"],
  ["f-rogeria", "2026-04-06", 3, "A09", "com_cid"],
  ["f-rogeria", "2026-05-18", 2, "G43", "com_cid"],
  ["f-rogeria", "2026-06-22", 1, null, "sem_cid"],
  ["f-daniela", "2026-02-10", 1, "R51", "com_cid"],
  ["f-daniela", "2026-03-16", 2, "J06", "com_cid"],
  ["f-daniela", "2026-05-11", 1, null, "sem_cid"],
  ["f-daniela", "2026-06-29", 2, "A09", "com_cid"],
  ["f-eloisa", "2026-03-02", 1, "M54.5", "com_cid"],
  ["f-eloisa", "2026-05-04", 2, "J11", "com_cid"],
  ["f-eloisa", "2026-06-15", 1, "N39.0", "com_cid"],
  ["f-sueli", "2026-04-13", 15, "M75.1", "com_cid"],
  ["f-sueli", "2026-04-28", 60, "M75.1", "inss"],
  ["f-marcela", "2026-01-12", 1, "R51", "com_cid"],
  ["f-marcela", "2026-06-08", 2, "J06", "com_cid"],
  ["f-saiany", "2026-02-02", 3, "A09", "com_cid"],
  ["f-karoynne", "2026-04-20", 1, null, "sem_cid"],
  ["f-karoynne", "2026-06-01", 1, "G43", "com_cid"],
  ["f-renata", "2026-05-25", 2, "M54.5", "com_cid"],
  ["f-bruna", "2026-06-17", 1, null, "sem_cid"],
  ["f-maria", "2026-03-09", 2, "J06", "com_cid"],
  ["f-maria", "2026-07-01", 1, "R51", "com_cid"],
  ["f-mariana", "2026-01-26", 1, null, "sem_cid"],
  ["f-joyce", "2026-05-06", 1, "S93.4", "acidente"],
  ["f-gislene", "2026-02-16", 2, "J11", "com_cid"],
  ["f-bianca", "2026-06-24", 1, "R51", "com_cid"],
  ["f-emanuelle", "2026-04-08", 1, "M54.5", "com_cid"],
  ["f-alessandra", "2026-06-10", 1, null, "sem_cid"],
  ["f-dani", "2026-03-23", 1, "G43", "com_cid"],
];

const atestados: Atestado[] = atestadosFonte.map((a, i) => {
  const m = medicos[i % medicos.length];
  return {
    id: `at-${String(i + 1).padStart(3, "0")}`,
    funcionarioId: a[0],
    dataEmissao: a[1],
    dias: a[2],
    cid: a[3] ?? undefined,
    tipo: a[4],
    medico: m.medico,
    crm: m.crm,
    hospital: m.hospital,
    obs: a[4] === "inss" ? "Encaminhada ao INSS após 15 dias de afastamento pela empresa." : undefined,
    criadoEm: a[1],
  };
});

/* ===================== Vale Transporte ===================== */

const TARIFA = 5.2; // tarifa fictícia de ônibus (editável em Configurações por colaboradora)

/** Colaboradoras que NÃO recebem VT */
const semVT = new Set(["f-joaopedro", "f-marina", "f-allanys", "f-patricia"]);
/** Itaquera usa integração (CPTM) */
const comIntegracao = new Set(["f-saiany", "f-karoynne", "f-sueli", "f-claudia"]);

const vtConfigs: VTConfig[] = funcionarios.map((f, i) => {
  const integra = comIntegracao.has(f.id);
  const forma: VTConfig["formaPadrao"] =
    f.id === "f-marcela" ? "misto" : f.id === "f-joyce" || f.id === "f-alessandra" ? "pix" : "cartao";
  return {
    id: `vt-${f.id}`,
    funcionarioId: f.id,
    recebeVT: !semVT.has(f.id),
    valorIda: TARIFA,
    valorVolta: TARIFA,
    qtdIntegracoes: integra ? 2 : 0,
    valorIntegracao: integra ? 2.55 : 0,
    condPorDia: integra ? 4 : 2,
    formaPadrao: forma,
  };
});

/** Histórico de pagamentos: competências abr, mai e jun/2026 */
const compPagas: Array<[string, number, string]> = [
  ["2026-04", 23, "2026-03-27"],
  ["2026-05", 24, "2026-04-28"],
  ["2026-06", 23, "2026-05-28"],
];

const vtPagamentos: VTPagamento[] = [];
for (const [comp, diasBase, dataPag] of compPagas) {
  for (const cfg of vtConfigs) {
    if (!cfg.recebeVT) continue;
    const f = funcionarios.find((x) => x.id === cfg.funcionarioId)!;
    if (f.status === "desligado") continue;
    // Sueli afastada a partir de abril: sem VT nas competências seguintes
    if (f.id === "f-sueli" && comp >= "2026-05") continue;
    // desconta dias de atestado da colaboradora dentro da competência
    const descontos = atestados
      .filter((a) => a.funcionarioId === f.id && a.dataEmissao.startsWith(comp))
      .reduce((s, a) => s + Math.min(a.dias, 5), 0);
    const dias = Math.max(diasBase - descontos, 0);
    const custoDia = cfg.valorIda + cfg.valorVolta + cfg.qtdIntegracoes * cfg.valorIntegracao;
    const total = Math.round(dias * custoDia * 100) / 100;
    const cartao = cfg.formaPadrao === "pix" ? 0 : cfg.formaPadrao === "misto" ? 180 : total;
    vtPagamentos.push({
      id: `vtp-${comp}-${f.id}`,
      funcionarioId: f.id,
      competencia: comp,
      diasConsiderados: dias,
      custoDia,
      valorTotal: total,
      valorCartao: Math.min(cartao, total),
      valorPix: Math.round((total - Math.min(cartao, total)) * 100) / 100,
      dataPagamento: dataPag,
      responsavel: "Marina",
      obs: descontos > 0 ? `Descontados ${descontos} dia(s) de atestado.` : undefined,
    });
  }
}

/* ===================== Feriados 2026 (nacionais + SP) ===================== */

const feriados: Feriado[] = [
  { data: "2026-01-01", nome: "Confraternização Universal" },
  { data: "2026-02-16", nome: "Carnaval" },
  { data: "2026-02-17", nome: "Carnaval" },
  { data: "2026-04-03", nome: "Paixão de Cristo" },
  { data: "2026-04-21", nome: "Tiradentes" },
  { data: "2026-05-01", nome: "Dia do Trabalho" },
  { data: "2026-06-04", nome: "Corpus Christi" },
  { data: "2026-07-09", nome: "Revolução Constitucionalista (SP)" },
  { data: "2026-09-07", nome: "Independência do Brasil" },
  { data: "2026-10-12", nome: "Nossa Senhora Aparecida" },
  { data: "2026-11-02", nome: "Finados" },
  { data: "2026-11-15", nome: "Proclamação da República" },
  { data: "2026-11-20", nome: "Dia da Consciência Negra" },
  { data: "2026-12-25", nome: "Natal" },
];

/* ===================== Escala de julho/2026 ===================== */

function gerarEscalaJulho(): EscalaEntry[] {
  const out: EscalaEntry[] = [];
  const ativos = funcionarios.filter((f) => f.status !== "desligado");
  const feriadosSet = new Set(feriados.map((x) => x.data));
  let seq = 1;

  ativos.forEach((f, idx) => {
    // dia da semana de folga fixa nas lojas (rotaciona entre seg..sáb por colaboradora)
    const folgaDia = (idx % 6) + 1; // 1=seg ... 6=sáb
    const trabalhaDomingoPar = idx % 2 === 0;

    for (let d = 1; d <= 31; d++) {
      const data = `2026-07-${String(d).padStart(2, "0")}`;
      const dow = new Date(data + "T12:00:00").getDay(); // 0=dom
      const ehFeriado = feriadosSet.has(data);
      let tipo: EscalaEntry["tipo"];
      let horarioId: string | undefined;

      if (f.id === "f-sueli") {
        tipo = "afastamento";
      } else if (f.feriasInicio && data >= f.feriasInicio && (!f.feriasFim || data <= f.feriasFim)) {
        tipo = "ferias";
      } else if (atestados.some((a) => a.funcionarioId === f.id && data >= a.dataEmissao && data <= addDiasISO(a.dataEmissao, a.dias - 1))) {
        tipo = "atestado";
      } else if (f.lojaId === "l-escritorio") {
        tipo = dow === 0 || dow === 6 || ehFeriado ? "folga" : "trabalho";
      } else if (dow === 0) {
        // domingo: metade da equipe trabalha em domingos alternados
        const semanaPar = Math.floor((d - 1) / 7) % 2 === 0;
        const trabalha = trabalhaDomingoPar ? semanaPar : !semanaPar;
        tipo = trabalha ? "trabalho" : "folga";
        if (trabalha) horarioId = "h-domfer";
      } else if (ehFeriado) {
        tipo = "trabalho"; // shopping abre em feriados
        horarioId = "h-domfer";
      } else if (dow === folgaDia) {
        tipo = "folga";
      } else {
        tipo = "trabalho";
      }

      out.push({ id: `esc-${String(seq++).padStart(4, "0")}`, funcionarioId: f.id, data, tipo, horarioId });
    }
  });
  return out;
}

function addDiasISO(iso: string, dias: number): string {
  const dt = new Date(iso + "T12:00:00");
  dt.setDate(dt.getDate() + dias);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

/* ===================== Demais coleções ===================== */

const bancoHoras: BancoHorasEntry[] = [
  { id: "bh-001", funcionarioId: "f-marcela", data: "2026-06-05", horas: 2, motivo: "Inventário da loja" },
  { id: "bh-002", funcionarioId: "f-renata", data: "2026-06-12", horas: -1.5, motivo: "Saída antecipada autorizada" },
  { id: "bh-003", funcionarioId: "f-daniela", data: "2026-06-20", horas: 3, motivo: "Cobertura de colega de folga" },
  { id: "bh-004", funcionarioId: "f-bianca", data: "2026-06-28", horas: 1, motivo: "Treinamento após expediente" },
  { id: "bh-005", funcionarioId: "f-marcela", data: "2026-06-27", horas: -1, motivo: "Compensação de saldo" },
];

const asos: ASO[] = meta
  .filter((m) => m.status !== "desligado")
  .map((m, i) => {
    const recente = m.admissao >= "2025-07-01";
    const realizacao = recente ? m.admissao : addDiasISO(m.asoValidade, -365);
    return {
      id: `aso-${String(i + 1).padStart(3, "0")}`,
      funcionarioId: m.id,
      tipo: recente ? "admissional" : "periodico",
      dataRealizacao: realizacao,
      validade: m.asoValidade,
      medico: "Dra. Helena Prado",
      clinica: "Clínica OcupMed",
      resultado: "apto",
    } as ASO;
  });

const documentos: Documento[] = [
  { id: "doc-001", funcionarioId: "f-marcela", tipo: "contrato", titulo: "Contrato de trabalho", data: "2023-03-06" },
  { id: "doc-002", funcionarioId: "f-bianca", tipo: "contrato", titulo: "Contrato de experiência 45+45", data: "2026-05-18" },
  { id: "doc-003", funcionarioId: "f-rogeria", tipo: "advertencia", titulo: "Advertência escrita — atrasos recorrentes", data: "2026-05-19", obs: "Três atrasos superiores a 15 min no mês de maio." },
  { id: "doc-004", funcionarioId: "f-sueli", tipo: "aso", titulo: "ASO afastamento INSS", data: "2026-04-28" },
  { id: "doc-005", funcionarioId: "f-dani", tipo: "certificado", titulo: "Academia de Líderes — Módulo 1", data: "2026-02-27" },
  { id: "doc-006", funcionarioId: "f-claudia", tipo: "certificado", titulo: "Academia de Líderes — Módulo 1", data: "2026-02-27" },
  { id: "doc-007", funcionarioId: "f-katia", tipo: "treinamento", titulo: "Treinamento de atendimento premium", data: "2026-03-18" },
  { id: "doc-008", funcionarioId: "f-joaopedro", tipo: "certificado", titulo: "Certificação DP/eSocial", data: "2025-11-10" },
  { id: "doc-009", funcionarioId: "f-lais", tipo: "pessoal", titulo: "Comprovante de residência", data: "2026-01-08" },
  { id: "doc-010", funcionarioId: "f-patricia", tipo: "contrato", titulo: "Termo de rescisão", data: "2026-03-14" },
];

const usuarios: Usuario[] = [
  { id: "u-admin", nome: "Administrador", email: "admin@lupatelli.com.br", papel: "admin" },
  { id: "u-joao", nome: "João Pedro", email: "joao.pedro@lupatelli.com.br", papel: "rh" },
  { id: "u-marina", nome: "Marina", email: "marina@lupatelli.com.br", papel: "rh" },
  { id: "u-dani", nome: "Dani Matias", email: "dani.matias@lupatelli.com.br", papel: "gerente", lojaId: "l-plaza" },
  { id: "u-diretoria", nome: "Diretoria", email: "diretoria@lupatelli.com.br", papel: "consulta" },
];

/* ===================== Exportação do seed ===================== */

export function buildSeed(): DBShape {
  return {
    lojas,
    horarios,
    funcionarios,
    escalas: gerarEscalaJulho(),
    bancoHoras,
    atestados,
    vtConfigs,
    vtPagamentos,
    asos,
    documentos,
    usuarios,
    feriados,
    auditoria: [],
  };
}
