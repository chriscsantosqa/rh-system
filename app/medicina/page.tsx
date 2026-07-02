"use client";
/**
 * Medicina do Trabalho: ASOs (admissional, periódico, demissional,
 * mudança de função, retorno ao trabalho) com alertas de vencimento.
 */
import { useMemo, useState } from "react";
import { HeartPulse, Pencil, Plus, ShieldAlert, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useData } from "@/hooks/use-data";
import { useAuth } from "@/lib/auth";
import { api } from "@/services/api";
import { PageHeader } from "@/components/shared/page-header";
import { FiltroSelect } from "@/components/shared/filtro-select";
import { StatCard } from "@/components/shared/stat-card";
import { ExportButtons } from "@/components/shared/export-buttons";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { DataTable, type Coluna } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/shared/form-field";
import { TIPO_ASO_LABEL } from "@/lib/constants";
import { exportExcel, exportPDF } from "@/utils/export";
import { addDias, diffDias, fmtData, hojeISO } from "@/lib/utils";
import type { ASO, TipoASO } from "@/types";

type StatusASO = "vencido" | "vencendo" | "valido" | "sem_validade";

function statusDe(a: ASO): { st: StatusASO; dias: number } {
  if (!a.validade) return { st: "sem_validade", dias: 0 };
  const dias = diffDias(hojeISO(), a.validade);
  if (dias < 0) return { st: "vencido", dias };
  if (dias <= 30) return { st: "vencendo", dias };
  return { st: "valido", dias };
}

export default function MedicinaPage() {
  const { funcionarios, lojas, asos, loading, refresh } = useData();
  const { can } = useAuth();
  const [tipoFiltro, setTipoFiltro] = useState("todos");
  const [statusFiltro, setStatusFiltro] = useState("todos");
  const [formAberto, setFormAberto] = useState(false);
  const [editando, setEditando] = useState<ASO | null>(null);

  const [form, setForm] = useState({
    funcionarioId: "", tipo: "periodico" as TipoASO, dataRealizacao: hojeISO(),
    validade: "", medico: "", clinica: "", resultado: "apto" as ASO["resultado"], obs: "",
  });

  const nomeDe = (id: string) => funcionarios.find((f) => f.id === id)?.nome ?? "—";
  const lojaDe = (fid: string) => lojas.find((l) => l.id === funcionarios.find((f) => f.id === fid)?.lojaId)?.nome ?? "";

  const filtrados = useMemo(() => {
    let out = [...asos].sort((a, b) => (a.validade ?? "9999").localeCompare(b.validade ?? "9999"));
    if (tipoFiltro !== "todos") out = out.filter((a) => a.tipo === tipoFiltro);
    if (statusFiltro !== "todos") out = out.filter((a) => statusDe(a).st === statusFiltro);
    return out;
  }, [asos, tipoFiltro, statusFiltro]);

  const vencidos = asos.filter((a) => statusDe(a).st === "vencido").length;
  const vencendo = asos.filter((a) => statusDe(a).st === "vencendo").length;
  const validos = asos.filter((a) => statusDe(a).st === "valido").length;

  function abrirNovo() {
    setEditando(null);
    setForm({
      funcionarioId: funcionarios[0]?.id ?? "", tipo: "periodico", dataRealizacao: hojeISO(),
      validade: addDias(hojeISO(), 365), medico: "", clinica: "", resultado: "apto", obs: "",
    });
    setFormAberto(true);
  }
  function abrirEdicao(a: ASO) {
    setEditando(a);
    setForm({
      funcionarioId: a.funcionarioId, tipo: a.tipo, dataRealizacao: a.dataRealizacao,
      validade: a.validade ?? "", medico: a.medico ?? "", clinica: a.clinica ?? "",
      resultado: a.resultado, obs: a.obs ?? "",
    });
    setFormAberto(true);
  }

  async function salvar() {
    if (!form.funcionarioId) return toast.error("Selecione a colaboradora.");
    if (form.tipo !== "demissional" && !form.validade) return toast.error("Informe a validade do ASO.");
    try {
      const payload = { ...form, validade: form.tipo === "demissional" ? undefined : form.validade, obs: form.obs || undefined };
      if (editando) await api.update<ASO>("asos", editando.id, payload);
      else await api.create<ASO>("asos", payload);
      toast.success("ASO salvo.");
      setFormAberto(false);
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar.");
    }
  }

  const colunas: Coluna<ASO>[] = [
    { key: "func", header: "Colaboradora", sortable: true, value: (a) => nomeDe(a.funcionarioId),
      render: (a) => (
        <div>
          <p className="font-medium">{nomeDe(a.funcionarioId)}</p>
          <p className="text-xs text-muted-foreground">{lojaDe(a.funcionarioId)}</p>
        </div>
      ) },
    { key: "tipo", header: "Tipo", render: (a) => <Badge variant="secondary">{TIPO_ASO_LABEL[a.tipo]}</Badge> },
    { key: "dataRealizacao", header: "Realização", sortable: true, render: (a) => fmtData(a.dataRealizacao) },
    { key: "validade", header: "Validade", sortable: true, value: (a) => a.validade ?? "",
      render: (a) => {
        const { st, dias } = statusDe(a);
        if (st === "sem_validade") return <span className="text-muted-foreground">—</span>;
        return (
          <div>
            {fmtData(a.validade)}
            <Badge className="ml-2" variant={st === "vencido" ? "destructive" : st === "vencendo" ? "warning" : "success"}>
              {st === "vencido" ? `vencido há ${-dias}d` : st === "vencendo" ? `vence em ${dias}d` : "válido"}
            </Badge>
          </div>
        );
      } },
    { key: "resultado", header: "Resultado", render: (a) => (
      <Badge variant={a.resultado === "apto" ? "success" : a.resultado === "inapto" ? "destructive" : "warning"}>
        {a.resultado === "apto" ? "Apto" : a.resultado === "inapto" ? "Inapto" : "Apto c/ restrições"}
      </Badge>
    ) },
    { key: "clinica", header: "Clínica / Médico", className: "hidden lg:table-cell",
      render: (a) => <span className="text-xs text-muted-foreground">{a.clinica}<br />{a.medico}</span> },
    { key: "acoes", header: "", className: "w-20 text-right",
      render: (a) => can("editar") ? (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => abrirEdicao(a)}><Pencil className="h-4 w-4" /></Button>
          <ConfirmDelete titulo="Excluir ASO?" onConfirm={async () => { await api.remove("asos", a.id); toast.success("ASO excluído."); refresh(); }}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
          </ConfirmDelete>
        </div>
      ) : null },
  ];

  function doExcel() {
    exportExcel("asos", [{
      name: "ASOs",
      rows: filtrados.map((a) => ({
        Colaboradora: nomeDe(a.funcionarioId), Loja: lojaDe(a.funcionarioId), Tipo: TIPO_ASO_LABEL[a.tipo],
        "Realização": fmtData(a.dataRealizacao), Validade: a.validade ? fmtData(a.validade) : "",
        Situação: statusDe(a).st, Resultado: a.resultado, "Clínica": a.clinica ?? "", "Médico": a.medico ?? "",
      })),
    }]);
  }
  function doPDF() {
    exportPDF("asos", "Medicina do Trabalho — ASOs",
      ["Colaboradora", "Tipo", "Realização", "Validade", "Situação"],
      filtrados.map((a) => [nomeDe(a.funcionarioId), TIPO_ASO_LABEL[a.tipo], fmtData(a.dataRealizacao), a.validade ? fmtData(a.validade) : "—", statusDe(a).st]));
  }

  if (loading) return <Skeleton className="h-96" />;

  return (
    <div>
      <PageHeader titulo="Medicina do Trabalho" descricao="ASOs com alertas automáticos de vencimento">
        <ExportButtons onExcel={doExcel} onPDF={doPDF} />
        {can("editar") && <Button onClick={abrirNovo}><Plus /> Novo ASO</Button>}
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard titulo="ASOs vencidos" valor={vencidos} icon={ShieldAlert} tom={vencidos > 0 ? "alerta" : "ok"} />
        <StatCard titulo="Vencendo em 30 dias" valor={vencendo} icon={HeartPulse} tom={vencendo > 0 ? "info" : "ok"} />
        <StatCard titulo="Válidos" valor={validos} icon={ShieldCheck} tom="ok" />
      </div>

      <DataTable
        data={filtrados}
        colunas={colunas}
        busca={(a) => `${nomeDe(a.funcionarioId)} ${TIPO_ASO_LABEL[a.tipo]} ${a.clinica ?? ""}`}
        placeholderBusca="Buscar por colaboradora, tipo..."
        pageSize={12}
        filtros={
          <>
            <FiltroSelect value={tipoFiltro} onChange={setTipoFiltro} opcoes={Object.entries(TIPO_ASO_LABEL).map(([v, l]) => ({ value: v, label: l }))} placeholder="Tipo" todosLabel="Todos os tipos" />
            <FiltroSelect value={statusFiltro} onChange={setStatusFiltro} opcoes={[
              { value: "vencido", label: "Vencidos" },
              { value: "vencendo", label: "Vencendo (30d)" },
              { value: "valido", label: "Válidos" },
            ]} placeholder="Situação" todosLabel="Todas as situações" className="w-[170px]" />
          </>
        }
      />

      <Dialog open={formAberto} onOpenChange={setFormAberto}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editando ? "Editar ASO" : "Novo ASO"}</DialogTitle></DialogHeader>
          <Field label="Colaboradora" obrigatorio>
            <Select value={form.funcionarioId} onValueChange={(v) => setForm((f) => ({ ...f, funcionarioId: v }))}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {funcionarios.map((f) => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tipo" obrigatorio>
              <Select value={form.tipo} onValueChange={(v) => setForm((f) => ({ ...f, tipo: v as TipoASO }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(TIPO_ASO_LABEL) as TipoASO[]).map((t) => (
                    <SelectItem key={t} value={t}>{TIPO_ASO_LABEL[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Resultado">
              <Select value={form.resultado} onValueChange={(v) => setForm((f) => ({ ...f, resultado: v as ASO["resultado"] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="apto">Apto</SelectItem>
                  <SelectItem value="apto_restricoes">Apto c/ restrições</SelectItem>
                  <SelectItem value="inapto">Inapto</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Data de realização" obrigatorio>
              <Input type="date" value={form.dataRealizacao} onChange={(e) => setForm((f) => ({ ...f, dataRealizacao: e.target.value }))} />
            </Field>
            {form.tipo !== "demissional" && (
              <Field label="Validade" obrigatorio>
                <Input type="date" value={form.validade} onChange={(e) => setForm((f) => ({ ...f, validade: e.target.value }))} />
              </Field>
            )}
            <Field label="Médico">
              <Input value={form.medico} onChange={(e) => setForm((f) => ({ ...f, medico: e.target.value }))} />
            </Field>
            <Field label="Clínica">
              <Input value={form.clinica} onChange={(e) => setForm((f) => ({ ...f, clinica: e.target.value }))} />
            </Field>
          </div>
          <Field label="Observações">
            <Textarea value={form.obs} onChange={(e) => setForm((f) => ({ ...f, obs: e.target.value }))} />
          </Field>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormAberto(false)}>Cancelar</Button>
            <Button onClick={salvar}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
