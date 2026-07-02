"use client";
/**
 * Documentos: upload por colaboradora e tipo (contratos, advertências,
 * suspensões, ASOs, pessoais, treinamentos, certificados).
 */
import { useMemo, useRef, useState } from "react";
import { Download, FolderOpen, Paperclip, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useData } from "@/hooks/use-data";
import { useAuth } from "@/lib/auth";
import { api } from "@/services/api";
import { PageHeader } from "@/components/shared/page-header";
import { FiltroSelect } from "@/components/shared/filtro-select";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { DataTable, type Coluna } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/shared/form-field";
import { TIPO_DOC_LABEL } from "@/lib/constants";
import { fmtData, hojeISO } from "@/lib/utils";
import type { Documento, TipoDocumento } from "@/types";

export default function DocumentosPage() {
  const { funcionarios, documentos, loading, refresh } = useData();
  const { can } = useAuth();
  const [funcFiltro, setFuncFiltro] = useState("todos");
  const [tipoFiltro, setTipoFiltro] = useState("todos");
  const [formAberto, setFormAberto] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    funcionarioId: "", tipo: "contrato" as TipoDocumento, titulo: "",
    data: hojeISO(), arquivo: "" as string | undefined, obs: "",
  });
  const [arquivoNome, setArquivoNome] = useState("");

  const nomeDe = (id: string) => funcionarios.find((f) => f.id === id)?.nome ?? "—";

  const filtrados = useMemo(() => {
    let out = [...documentos].sort((a, b) => b.data.localeCompare(a.data));
    if (funcFiltro !== "todos") out = out.filter((d) => d.funcionarioId === funcFiltro);
    if (tipoFiltro !== "todos") out = out.filter((d) => d.tipo === tipoFiltro);
    return out;
  }, [documentos, funcFiltro, tipoFiltro]);

  async function anexar(file: File) {
    try {
      const r = await api.upload(file);
      setForm((f) => ({ ...f, arquivo: r.path, titulo: f.titulo || r.nome }));
      setArquivoNome(r.nome);
      toast.success("Arquivo enviado.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha no upload.");
    }
  }

  async function salvar() {
    if (!form.funcionarioId) return toast.error("Selecione a colaboradora.");
    if (!form.titulo.trim()) return toast.error("Informe o título do documento.");
    try {
      await api.create<Documento>("documentos", { ...form, obs: form.obs || undefined });
      toast.success("Documento registrado.");
      setFormAberto(false);
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar.");
    }
  }

  const colunas: Coluna<Documento>[] = [
    { key: "titulo", header: "Documento", sortable: true,
      render: (d) => (
        <div className="flex items-center gap-2">
          <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div>
            <p className="font-medium">{d.titulo}</p>
            {d.obs && <p className="text-xs text-muted-foreground">{d.obs}</p>}
          </div>
        </div>
      ) },
    { key: "func", header: "Colaboradora", sortable: true, value: (d) => nomeDe(d.funcionarioId), render: (d) => nomeDe(d.funcionarioId) },
    { key: "tipo", header: "Tipo",
      render: (d) => (
        <Badge variant={d.tipo === "advertencia" || d.tipo === "suspensao" ? "destructive" : "secondary"}>
          {TIPO_DOC_LABEL[d.tipo]}
        </Badge>
      ) },
    { key: "data", header: "Data", sortable: true, render: (d) => fmtData(d.data) },
    { key: "acoes", header: "", className: "w-24 text-right",
      render: (d) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          {d.arquivo && (
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <a href={d.arquivo} target="_blank" download aria-label="Baixar"><Download className="h-4 w-4" /></a>
            </Button>
          )}
          {can("editar") && (
            <ConfirmDelete titulo="Excluir documento?" onConfirm={async () => { await api.remove("documentos", d.id); toast.success("Documento excluído."); refresh(); }}>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
            </ConfirmDelete>
          )}
        </div>
      ) },
  ];

  if (loading) return <Skeleton className="h-96" />;

  return (
    <div>
      <PageHeader titulo="Documentos" descricao="Contratos, advertências, suspensões, ASOs, treinamentos e certificados">
        {can("editar") && (
          <Button onClick={() => {
            setForm({ funcionarioId: funcionarios[0]?.id ?? "", tipo: "contrato", titulo: "", data: hojeISO(), arquivo: undefined, obs: "" });
            setArquivoNome("");
            setFormAberto(true);
          }}>
            <Plus /> Novo documento
          </Button>
        )}
      </PageHeader>

      {/* Resumo por tipo */}
      <div className="mb-6 flex flex-wrap gap-2">
        {(Object.keys(TIPO_DOC_LABEL) as TipoDocumento[]).map((t) => {
          const qtd = documentos.filter((d) => d.tipo === t).length;
          if (qtd === 0) return null;
          return (
            <button key={t} onClick={() => setTipoFiltro(tipoFiltro === t ? "todos" : t)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${tipoFiltro === t ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-accent"}`}>
              {TIPO_DOC_LABEL[t]} · {qtd}
            </button>
          );
        })}
      </div>

      <DataTable
        data={filtrados}
        colunas={colunas}
        busca={(d) => `${d.titulo} ${nomeDe(d.funcionarioId)} ${TIPO_DOC_LABEL[d.tipo]}`}
        placeholderBusca="Buscar documento..."
        pageSize={12}
        vazio="Nenhum documento no filtro atual."
        filtros={
          <FiltroSelect value={funcFiltro} onChange={setFuncFiltro} opcoes={funcionarios.map((f) => ({ value: f.id, label: f.nome }))} placeholder="Colaboradora" todosLabel="Todas as colaboradoras" className="w-[200px]" />
        }
      />

      <Dialog open={formAberto} onOpenChange={setFormAberto}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo documento</DialogTitle>
            <DialogDescription>Anexe o arquivo e classifique o documento.</DialogDescription>
          </DialogHeader>
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
              <Select value={form.tipo} onValueChange={(v) => setForm((f) => ({ ...f, tipo: v as TipoDocumento }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(TIPO_DOC_LABEL) as TipoDocumento[]).map((t) => (
                    <SelectItem key={t} value={t}>{TIPO_DOC_LABEL[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Data">
              <Input type="date" value={form.data} onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))} />
            </Field>
          </div>
          <Field label="Título" obrigatorio>
            <Input value={form.titulo} onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))} placeholder="Ex.: Contrato de experiência" />
          </Field>
          <Field label="Observações">
            <Textarea value={form.obs} onChange={(e) => setForm((f) => ({ ...f, obs: e.target.value }))} />
          </Field>
          <div className="flex items-center gap-2">
            <input ref={fileRef} type="file" className="hidden" onChange={(e) => e.target.files?.[0] && anexar(e.target.files[0])} />
            <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              <Paperclip /> {form.arquivo ? "Trocar arquivo" : "Anexar arquivo"}
            </Button>
            {arquivoNome && <span className="text-xs text-muted-foreground">{arquivoNome}</span>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormAberto(false)}>Cancelar</Button>
            <Button onClick={salvar}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {documentos.length === 0 && (
        <div className="mt-10 flex flex-col items-center text-muted-foreground">
          <FolderOpen className="mb-2 h-10 w-10" />
          <p className="text-sm">Nenhum documento cadastrado ainda.</p>
        </div>
      )}
    </div>
  );
}
