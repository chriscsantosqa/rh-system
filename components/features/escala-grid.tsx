"use client";
/**
 * Grade mensal de escalas: linhas = colaboradoras, colunas = dias do mês.
 * Clique na célula para definir trabalho, folga, férias, atestado, troca,
 * extra, mudança de horário e observações.
 */
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/shared/form-field";
import { api } from "@/services/api";
import { useAuth } from "@/lib/auth";
import { ESCALA_DIA } from "@/lib/constants";
import { resumoEscala } from "@/lib/calc";
import { cn, diaSemana, diasNoMes } from "@/lib/utils";
import type { EscalaEntry, Feriado, Funcionario, Horario, TipoDiaEscala } from "@/types";

const DOW = ["D", "S", "T", "Q", "Q", "S", "S"];

export function EscalaGrid({
  ym, funcionarios, escalas, horarios, feriados, onMudou,
}: {
  ym: string;
  funcionarios: Funcionario[];
  escalas: EscalaEntry[];
  horarios: Horario[];
  feriados: Feriado[];
  onMudou: () => void;
}) {
  const { can } = useAuth();
  const [editando, setEditando] = useState<{ func: Funcionario; data: string; entry?: EscalaEntry } | null>(null);
  const [tipo, setTipo] = useState<TipoDiaEscala>("trabalho");
  const [horarioId, setHorarioId] = useState<string>("padrao");
  const [obs, setObs] = useState("");
  const [salvando, setSalvando] = useState(false);

  const nDias = diasNoMes(ym);
  const dias = Array.from({ length: nDias }, (_, i) => `${ym}-${String(i + 1).padStart(2, "0")}`);
  const feriadosSet = useMemo(() => new Set(feriados.map((f) => f.data)), [feriados]);

  /** índice rápido: funcionarioId|data → entry */
  const mapa = useMemo(() => {
    const m = new Map<string, EscalaEntry>();
    for (const e of escalas) if (e.data.startsWith(ym)) m.set(`${e.funcionarioId}|${e.data}`, e);
    return m;
  }, [escalas, ym]);

  function abrir(func: Funcionario, data: string) {
    if (!can("editar")) return;
    const entry = mapa.get(`${func.id}|${data}`);
    setTipo(entry?.tipo ?? "trabalho");
    setHorarioId(entry?.horarioId ?? "padrao");
    setObs(entry?.obs ?? "");
    setEditando({ func, data, entry });
  }

  async function salvar() {
    if (!editando) return;
    setSalvando(true);
    try {
      const payload = {
        funcionarioId: editando.func.id,
        data: editando.data,
        tipo,
        horarioId: horarioId === "padrao" ? undefined : horarioId,
        obs: obs || undefined,
      };
      if (editando.entry) await api.update<EscalaEntry>("escalas", editando.entry.id, payload);
      else await api.create<EscalaEntry>("escalas", payload);
      toast.success("Escala atualizada.");
      setEditando(null);
      onMudou();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  async function limpar() {
    if (!editando?.entry) { setEditando(null); return; }
    setSalvando(true);
    try {
      await api.remove("escalas", editando.entry.id);
      toast.success("Dia limpo.");
      setEditando(null);
      onMudou();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao limpar.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 min-w-[150px] border-b bg-card px-3 py-2 text-left font-semibold">
                Colaboradora
              </th>
              {dias.map((d, i) => {
                const dow = diaSemana(d);
                const feriado = feriadosSet.has(d);
                return (
                  <th
                    key={d}
                    className={cn(
                      "border-b px-0.5 py-1.5 text-center font-medium min-w-[30px]",
                      dow === 0 && "bg-red-500/10 text-red-600 dark:text-red-400",
                      feriado && "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                    )}
                    title={feriado ? feriados.find((f) => f.data === d)?.nome : undefined}
                  >
                    <span className="block text-[10px] opacity-70">{DOW[dow]}</span>
                    <span className="flex items-center justify-center gap-0.5">
                      {i + 1}
                      {feriado && <Star className="h-2.5 w-2.5 fill-current" />}
                    </span>
                  </th>
                );
              })}
              <th className="border-b px-2 py-1.5 text-center font-semibold min-w-[90px]">Resumo</th>
            </tr>
          </thead>
          <tbody>
            {funcionarios.map((f) => {
              const r = resumoEscala(escalas, f.id, ym, feriados);
              return (
                <tr key={f.id} className="hover:bg-muted/30">
                  <td className="sticky left-0 z-10 border-b bg-card px-3 py-1.5 font-medium whitespace-nowrap">
                    {f.nome}
                  </td>
                  {dias.map((d) => {
                    const e = mapa.get(`${f.id}|${d}`);
                    const cfg = e ? ESCALA_DIA[e.tipo] : null;
                    return (
                      <td key={d} className="border-b p-0.5 text-center">
                        <button
                          onClick={() => abrir(f, d)}
                          title={e ? `${cfg!.label}${e.obs ? " — " + e.obs : ""}` : "Definir"}
                          className={cn(
                            "h-7 w-full min-w-[26px] rounded text-[10px] font-bold transition-transform hover:scale-105",
                            cfg ? cfg.cls : "bg-muted/40 text-muted-foreground/40 hover:bg-muted",
                            e?.obs && "ring-1 ring-primary/50"
                          )}
                        >
                          {cfg?.sigla ?? "·"}
                        </button>
                      </td>
                    );
                  })}
                  <td className="border-b px-2 py-1 text-center text-[10px] leading-tight text-muted-foreground whitespace-nowrap">
                    T {r.trabalho + r.trocas + r.extras} · F {r.folgas}
                    <br />
                    D {r.domingosTrabalhados} · Fer {r.feriadosTrabalhados}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap items-center gap-2 border-t px-3 py-2 text-[11px] text-muted-foreground">
        {Object.values(ESCALA_DIA).map((e) => (
          <span key={e.sigla} className={cn("rounded px-1.5 py-0.5 font-medium", e.cls)}>
            {e.sigla} {e.label}
          </span>
        ))}
        <span className="ml-auto flex items-center gap-1"><Star className="h-3 w-3 fill-amber-500 text-amber-500" /> feriado · células com borda têm observação</span>
      </div>

      {/* Editor do dia */}
      <Dialog open={!!editando} onOpenChange={(o) => !o && setEditando(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editando?.func.nome} — {editando?.data.split("-").reverse().join("/")}
            </DialogTitle>
            <DialogDescription>
              Defina o tipo do dia, mudança de horário e observações (trocas, coberturas...).
            </DialogDescription>
          </DialogHeader>

          <Field label="Tipo do dia">
            <Select value={tipo} onValueChange={(v) => setTipo(v as TipoDiaEscala)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(ESCALA_DIA) as TipoDiaEscala[]).map((t) => (
                  <SelectItem key={t} value={t}>{ESCALA_DIA[t].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Horário (mudança pontual)">
            <Select value={horarioId} onValueChange={setHorarioId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="padrao">Horário padrão da colaboradora</SelectItem>
                {horarios.map((h) => (
                  <SelectItem key={h.id} value={h.id}>{h.nome} ({h.entrada}–{h.saida})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Observações">
            <Textarea value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Ex.: troca com Marcela, cobertura de férias..." />
          </Field>

          <DialogFooter className="sm:justify-between">
            <Button variant="ghost" className="text-destructive" onClick={limpar} disabled={salvando}>
              Limpar dia
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditando(null)}>Cancelar</Button>
              <Button onClick={salvar} disabled={salvando}>{salvando ? "Salvando..." : "Salvar"}</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
