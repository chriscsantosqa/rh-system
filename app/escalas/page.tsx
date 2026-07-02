"use client";
/**
 * Escalas: grade mensal (calendário) + banco de horas + horários cadastrados.
 */
import { useMemo, useState } from "react";
import { CalendarDays, Clock, Plus, Timer, Trash2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { useData } from "@/hooks/use-data";
import { useAuth } from "@/lib/auth";
import { api } from "@/services/api";
import { PageHeader } from "@/components/shared/page-header";
import { MonthPicker } from "@/components/shared/month-picker";
import { FiltroSelect } from "@/components/shared/filtro-select";
import { EscalaGrid } from "@/components/features/escala-grid";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "@/components/shared/form-field";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { ExportButtons } from "@/components/shared/export-buttons";
import { exportExcel, exportPDF } from "@/utils/export";
import { cn, diaSemana, diasNoMes, fmtCompetencia, fmtData, hojeISO, mesAtual } from "@/lib/utils";
import { ESCALA_DIA } from "@/lib/constants";
import type { BancoHorasEntry, EscalaEntry, Funcionario } from "@/types";

export default function EscalasPage() {
  const { funcionarios, lojas, horarios, escalas, bancoHoras, feriados, loading, refresh } = useData();
  const { can, user } = useAuth();
  const [ym, setYm] = useState(mesAtual());
  const [lojaFiltro, setLojaFiltro] = useState(user?.papel === "gerente" && user.lojaId ? user.lojaId : "todos");
  const [gerando, setGerando] = useState(false);

  // banco de horas
  const [bhAberto, setBhAberto] = useState(false);
  const [bhFunc, setBhFunc] = useState("");
  const [bhData, setBhData] = useState(hojeISO());
  const [bhHoras, setBhHoras] = useState("1");
  const [bhMotivo, setBhMotivo] = useState("");

  const ativos = useMemo(
    () =>
      funcionarios
        .filter((f) => f.status !== "desligado")
        .filter((f) => lojaFiltro === "todos" || f.lojaId === lojaFiltro)
        .sort((a, b) => {
          const la = lojas.findIndex((l) => l.id === a.lojaId);
          const lb = lojas.findIndex((l) => l.id === b.lojaId);
          return la - lb || a.nome.localeCompare(b.nome, "pt-BR");
        }),
    [funcionarios, lojaFiltro, lojas]
  );

  /**
   * Gera escala padrão para os dias ainda vazios do mês:
   * escritório 5x2 (seg–sex) e lojas 6x1 com folga rotativa + domingos alternados.
   */
  async function gerarPadrao() {
    if (!can("editar")) return;
    setGerando(true);
    try {
      const existentes = new Set(
        escalas.filter((e) => e.data.startsWith(ym)).map((e) => `${e.funcionarioId}|${e.data}`)
      );
      const feriadosSet = new Set(feriados.map((f) => f.data));
      const novos: Omit<EscalaEntry, "id">[] = [];

      ativos.forEach((f, idx) => {
        const folgaDia = (idx % 6) + 1; // seg..sáb rotativo
        const domingoPar = idx % 2 === 0;
        for (let d = 1; d <= diasNoMes(ym); d++) {
          const data = `${ym}-${String(d).padStart(2, "0")}`;
          if (existentes.has(`${f.id}|${data}`)) continue;
          const dow = diaSemana(data);
          const feriado = feriadosSet.has(data);
          let tipo: EscalaEntry["tipo"];
          let horarioId: string | undefined;

          if (f.status === "afastado") tipo = "afastamento";
          else if (f.feriasInicio && data >= f.feriasInicio && (!f.feriasFim || data <= f.feriasFim)) tipo = "ferias";
          else if (f.escala === "5x2") tipo = dow === 0 || dow === 6 || feriado ? "folga" : "trabalho";
          else if (dow === 0) {
            const semanaPar = Math.floor((d - 1) / 7) % 2 === 0;
            const trabalha = domingoPar ? semanaPar : !semanaPar;
            tipo = trabalha ? "trabalho" : "folga";
            if (trabalha) horarioId = "h-domfer";
          } else if (feriado) { tipo = "trabalho"; horarioId = "h-domfer"; }
          else if (dow === folgaDia) tipo = "folga";
          else tipo = "trabalho";

          novos.push({ funcionarioId: f.id, data, tipo, horarioId });
        }
      });

      if (novos.length === 0) {
        toast.info("Nenhum dia vazio para preencher.");
      } else {
        await api.create("escalas", novos as any);
        toast.success(`${novos.length} dia(s) de escala gerados.`);
        refresh();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao gerar escala.");
    } finally {
      setGerando(false);
    }
  }

  async function addBancoHoras() {
    if (!bhFunc) return toast.error("Selecione a colaboradora.");
    const horas = Number(bhHoras.replace(",", "."));
    if (!horas || Number.isNaN(horas)) return toast.error("Informe as horas (use negativo para débito).");
    if (!bhMotivo.trim()) return toast.error("Informe o motivo.");
    try {
      await api.create<BancoHorasEntry>("bancoHoras", { funcionarioId: bhFunc, data: bhData, horas, motivo: bhMotivo });
      toast.success("Lançamento registrado.");
      setBhAberto(false);
      setBhMotivo("");
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao lançar.");
    }
  }

  function exportarEscala(tipo: "excel" | "pdf") {
    const rows = ativos.map((f) => {
      const linha: Record<string, unknown> = { Colaboradora: f.nome, Loja: lojas.find((l) => l.id === f.lojaId)?.nome };
      for (let d = 1; d <= diasNoMes(ym); d++) {
        const data = `${ym}-${String(d).padStart(2, "0")}`;
        const e = escalas.find((x) => x.funcionarioId === f.id && x.data === data);
        linha[String(d)] = e ? ESCALA_DIA[e.tipo].sigla : "";
      }
      return linha;
    });
    if (tipo === "excel") exportExcel(`escala-${ym}`, [{ name: "Escala", rows }]);
    else {
      const head = ["Colaboradora", ...Array.from({ length: diasNoMes(ym) }, (_, i) => String(i + 1))];
      exportPDF(`escala-${ym}`, `Escala — ${fmtCompetencia(ym)}`, head,
        rows.map((r) => head.map((h) => String(r[h === "Colaboradora" ? "Colaboradora" : h] ?? ""))),
        { landscape: true });
    }
  }

  const saldos = useMemo(() => {
    return ativos.map((f) => ({
      func: f,
      saldo: bancoHoras.filter((b) => b.funcionarioId === f.id).reduce((s, b) => s + b.horas, 0),
      lancamentos: bancoHoras.filter((b) => b.funcionarioId === f.id).sort((a, b) => b.data.localeCompare(a.data)),
    })).filter((x) => x.lancamentos.length > 0 || x.saldo !== 0);
  }, [ativos, bancoHoras]);

  if (loading) return <Skeleton className="h-96" />;

  return (
    <div>
      <PageHeader titulo="Escalas" descricao="Calendário mensal, folgas, domingos, feriados, trocas e banco de horas">
        <MonthPicker value={ym} onChange={setYm} />
      </PageHeader>

      <Tabs defaultValue="escala">
        <TabsList>
          <TabsTrigger value="escala"><CalendarDays /> Escala mensal</TabsTrigger>
          <TabsTrigger value="banco"><Timer /> Banco de horas</TabsTrigger>
          <TabsTrigger value="horarios"><Clock /> Horários</TabsTrigger>
        </TabsList>

        {/* ============ ESCALA ============ */}
        <TabsContent value="escala" className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <FiltroSelect value={lojaFiltro} onChange={setLojaFiltro} opcoes={lojas.map((l) => ({ value: l.id, label: l.nome }))} placeholder="Loja" todosLabel="Todas as lojas" />
            <div className="ml-auto flex gap-2">
              <ExportButtons onExcel={() => exportarEscala("excel")} onPDF={() => exportarEscala("pdf")} />
              {can("editar") && (
                <Button onClick={gerarPadrao} disabled={gerando} variant="secondary">
                  <Wand2 /> {gerando ? "Gerando..." : "Gerar escala padrão"}
                </Button>
              )}
            </div>
          </div>
          <EscalaGrid ym={ym} funcionarios={ativos} escalas={escalas} horarios={horarios} feriados={feriados} onMudou={refresh} />
        </TabsContent>

        {/* ============ BANCO DE HORAS ============ */}
        <TabsContent value="banco">
          <div className="mb-3 flex justify-end">
            {can("editar") && (
              <Button onClick={() => { setBhFunc(ativos[0]?.id ?? ""); setBhAberto(true); }}>
                <Plus /> Novo lançamento
              </Button>
            )}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {saldos.length === 0 && (
              <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Nenhum lançamento de banco de horas.</CardContent></Card>
            )}
            {saldos.map(({ func, saldo, lancamentos }) => (
              <Card key={func.id}>
                <CardHeader className="flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm">{func.nome}</CardTitle>
                  <Badge variant={saldo >= 0 ? "success" : "destructive"} className="text-sm">
                    {saldo > 0 ? "+" : ""}{saldo}h
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  {lancamentos.map((l) => (
                    <div key={l.id} className="flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs">
                      <span className="text-muted-foreground">{fmtData(l.data)}</span>
                      <span className={cn("font-bold", l.horas >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive")}>
                        {l.horas > 0 ? "+" : ""}{l.horas}h
                      </span>
                      <span className="min-w-0 flex-1 truncate">{l.motivo}</span>
                      {can("editar") && (
                        <ConfirmDelete titulo="Excluir lançamento?" onConfirm={async () => { await api.remove("bancoHoras", l.id); refresh(); }}>
                          <button className="text-muted-foreground hover:text-destructive" aria-label="Excluir"><Trash2 className="h-3.5 w-3.5" /></button>
                        </ConfirmDelete>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          <Dialog open={bhAberto} onOpenChange={setBhAberto}>
            <DialogContent className="max-w-sm">
              <DialogHeader><DialogTitle>Lançamento de banco de horas</DialogTitle></DialogHeader>
              <Field label="Colaboradora" obrigatorio>
                <Select value={bhFunc} onValueChange={setBhFunc}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {ativos.map((f) => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Data" obrigatorio><Input type="date" value={bhData} onChange={(e) => setBhData(e.target.value)} /></Field>
              <Field label="Horas (negativo = débito)" obrigatorio>
                <Input type="number" step="0.5" value={bhHoras} onChange={(e) => setBhHoras(e.target.value)} />
              </Field>
              <Field label="Motivo" obrigatorio>
                <Input value={bhMotivo} onChange={(e) => setBhMotivo(e.target.value)} placeholder="Ex.: inventário, cobertura..." />
              </Field>
              <DialogFooter>
                <Button variant="outline" onClick={() => setBhAberto(false)}>Cancelar</Button>
                <Button onClick={addBancoHoras}>Lançar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ============ HORÁRIOS ============ */}
        <TabsContent value="horarios">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {horarios.map((h) => (
              <Card key={h.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-sm">
                    {h.nome}
                    <Badge variant="secondary">{h.aplicacao === "loja" ? "Loja" : "Escritório"}</Badge>
                  </CardTitle>
                  <CardDescription className="text-xs">{h.dias}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <p className="flex justify-between"><span className="text-muted-foreground">Horário</span><span className="font-medium">{h.entrada} às {h.saida}</span></p>
                  {h.entradaSexta && (
                    <p className="flex justify-between"><span className="text-muted-foreground">Sexta</span><span className="font-medium">{h.entradaSexta} às {h.saidaSexta}</span></p>
                  )}
                  <p className="flex justify-between"><span className="text-muted-foreground">Intervalo</span><span className="font-medium">{h.intervaloMin} min</span></p>
                  <p className="flex justify-between border-t pt-1.5"><span className="text-muted-foreground">Em uso por</span>
                    <span className="font-medium">{funcionarios.filter((f) => f.horarioId === h.id && f.status !== "desligado").length} colaboradora(s)</span>
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Para criar ou editar horários acesse <strong>Configurações → Horários</strong> (Administrador/RH).
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
