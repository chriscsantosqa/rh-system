import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Combina classes Tailwind sem conflitos (padrão shadcn/ui) */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* ===================== Formatação ===================== */

export const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const num = (v: number, dec = 0) =>
  v.toLocaleString("pt-BR", { minimumFractionDigits: dec, maximumFractionDigits: dec });

/** yyyy-MM-dd → dd/MM/yyyy (sem problemas de fuso) */
export function fmtData(iso?: string): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

/** yyyy-MM → "julho/2026" */
export function fmtCompetencia(ym: string): string {
  const meses = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
  const [y, m] = ym.split("-").map(Number);
  return `${meses[(m ?? 1) - 1]}/${y}`;
}

export function fmtCompetenciaCurta(ym: string): string {
  const meses = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
  const [y, m] = ym.split("-").map(Number);
  return `${meses[(m ?? 1) - 1]}/${String(y).slice(2)}`;
}

export function maskCPF(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function maskTelefone(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
}

export function maskCEP(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 8);
  return d.replace(/(\d{5})(\d)/, "$1-$2");
}

/** Iniciais para avatar: "Dani Matias" → "DM" */
export function iniciais(nome: string): string {
  const p = nome.trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p[p.length - 1]?.[0] ?? "")).toUpperCase();
}

/* ===================== Datas (sem Date/fuso quando possível) ===================== */

export function hojeISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function mesAtual(): string {
  return hojeISO().slice(0, 7);
}

/** Diferença em dias entre duas datas ISO (b - a) */
export function diffDias(a: string, b: string): number {
  return Math.round((Date.parse(b + "T12:00:00") - Date.parse(a + "T12:00:00")) / 86400000);
}

export function addDias(iso: string, dias: number): string {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + dias);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function diasNoMes(ym: string): number {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

/** 0=domingo ... 6=sábado */
export function diaSemana(iso: string): number {
  return new Date(iso + "T12:00:00").getDay();
}

/** Lista de competências: [atual, atual-1, ...] com `n` itens */
export function ultimasCompetencias(n: number, base?: string): string[] {
  const [y0, m0] = (base ?? mesAtual()).split("-").map(Number);
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const m = m0 - i;
    const y = y0 + Math.floor((m - 1) / 12);
    const mm = ((m - 1) % 12 + 12) % 12 + 1;
    out.push(`${y}-${String(mm).padStart(2, "0")}`);
  }
  return out;
}

export function idadeAnos(nascimento: string): number {
  return Math.floor(diffDias(nascimento, hojeISO()) / 365.25);
}

/** Gera id único simples */
export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

/** Download de blob no navegador */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
