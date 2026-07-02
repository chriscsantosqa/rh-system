"use client";
/**
 * Cadastro/edição de atestado médico com upload do arquivo.
 */
import { useEffect, useRef, useState } from "react";
import { Paperclip, X } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "@/components/shared/form-field";
import { api } from "@/services/api";
import { TIPO_ATESTADO_LABEL } from "@/lib/constants";
import { hojeISO } from "@/lib/utils";
import type { Atestado, Funcionario, TipoAtestado } from "@/types";

export function AtestadoForm({
  aberto, onFechar, onSalvo, atestado, funcionarios, funcionarioFixo,
}: {
  aberto: boolean;
  onFechar: () => void;
  onSalvo: () => void;
  atestado: Atestado | null;
  funcionarios: Funcionario[];
  /** quando aberto a partir da ficha da colaboradora */
  funcionarioFixo?: string;
}) {
  const [form, setForm] = useState({
    funcionarioId: "", dataEmissao: hojeISO(), dias: "1", cid: "",
    medico: "", crm: "", hospital: "", tipo: "com_cid" as TipoAtestado, obs: "",
    arquivo: "" as string | undefined,
  });
  const [arquivoNome, setArquivoNome] = useState("");
  const [salvando, setSalvando] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!aberto) return;
    if (atestado) {
      setForm({
        funcionarioId: atestado.funcionarioId,
        dataEmissao: atestado.dataEmissao,
        dias: String(atestado.dias),
        cid: atestado.cid ?? "",
        medico: atestado.medico,
        crm: atestado.crm,
        hospital: atestado.hospital,
        tipo: atestado.tipo,
        obs: atestado.obs ?? "",
        arquivo: atestado.arquivo,
      });
      setArquivoNome(atestado.arquivo ? "arquivo anexado" : "");
    } else {
      setForm({
        funcionarioId: funcionarioFixo ?? funcionarios[0]?.id ?? "",
        dataEmissao: hojeISO(), dias: "1", cid: "", medico: "", crm: "",
        hospital: "", tipo: "com_cid", obs: "", arquivo: undefined,
      });
      setArquivoNome("");
    }
  }, [aberto, atestado, funcionarioFixo, funcionarios]);

  async function anexar(file: File) {
    try {
      const r = await api.upload(file);
      setForm((f) => ({ ...f, arquivo: r.path }));
      setArquivoNome(r.nome);
      toast.success("Arquivo anexado.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha no upload.");
    }
  }

  async function salvar() {
    if (!form.funcionarioId) return toast.error("Selecione a colaboradora.");
    const dias = Number(form.dias);
    if (!dias || dias < 1) return toast.error("Informe a quantidade de dias (mínimo 1).");
    if (form.tipo === "com_cid" && !form.cid.trim()) return toast.error("Informe o CID (ou mude o tipo para Sem CID).");
    if (!form.medico.trim()) return toast.error("Informe o médico.");

    setSalvando(true);
    try {
      const payload = {
        funcionarioId: form.funcionarioId,
        dataEmissao: form.dataEmissao,
        dias,
        cid: form.cid.trim() || undefined,
        medico: form.medico.trim(),
        crm: form.crm.trim(),
        hospital: form.hospital.trim(),
        tipo: form.tipo,
        obs: form.obs.trim() || undefined,
        arquivo: form.arquivo,
        criadoEm: atestado?.criadoEm ?? hojeISO(),
      };
      if (atestado) await api.update<Atestado>("atestados", atestado.id, payload);
      else await api.create<Atestado>("atestados", payload);
      toast.success(atestado ? "Atestado atualizado." : "Atestado registrado.");
      onSalvo();
      onFechar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{atestado ? "Editar atestado" : "Novo atestado"}</DialogTitle>
          <DialogDescription>Registre os dados do atestado e anexe o arquivo digitalizado.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Colaboradora" obrigatorio className="col-span-2">
            <Select value={form.funcionarioId} onValueChange={(v) => setForm((f) => ({ ...f, funcionarioId: v }))} disabled={!!funcionarioFixo}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {funcionarios.map((f) => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Data de emissão" obrigatorio>
            <Input type="date" value={form.dataEmissao} onChange={(e) => setForm((f) => ({ ...f, dataEmissao: e.target.value }))} />
          </Field>
          <Field label="Dias de afastamento" obrigatorio>
            <Input type="number" min={1} value={form.dias} onChange={(e) => setForm((f) => ({ ...f, dias: e.target.value }))} />
          </Field>
          <Field label="Tipo" obrigatorio>
            <Select value={form.tipo} onValueChange={(v) => setForm((f) => ({ ...f, tipo: v as TipoAtestado }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(TIPO_ATESTADO_LABEL) as TipoAtestado[]).map((t) => (
                  <SelectItem key={t} value={t}>{TIPO_ATESTADO_LABEL[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="CID">
            <Input value={form.cid} onChange={(e) => setForm((f) => ({ ...f, cid: e.target.value.toUpperCase() }))} placeholder="Ex.: M54.5" />
          </Field>
          <Field label="Médico" obrigatorio>
            <Input value={form.medico} onChange={(e) => setForm((f) => ({ ...f, medico: e.target.value }))} />
          </Field>
          <Field label="CRM">
            <Input value={form.crm} onChange={(e) => setForm((f) => ({ ...f, crm: e.target.value }))} placeholder="000000-UF" />
          </Field>
          <Field label="Hospital / Clínica" className="col-span-2">
            <Input value={form.hospital} onChange={(e) => setForm((f) => ({ ...f, hospital: e.target.value }))} />
          </Field>
        </div>

        <Field label="Observações">
          <Textarea value={form.obs} onChange={(e) => setForm((f) => ({ ...f, obs: e.target.value }))} />
        </Field>

        {/* Upload */}
        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && anexar(e.target.files[0])}
          />
          <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            <Paperclip /> {form.arquivo ? "Trocar arquivo" : "Anexar atestado"}
          </Button>
          {form.arquivo && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              {arquivoNome || "arquivo anexado"}
              <button onClick={() => { setForm((f) => ({ ...f, arquivo: undefined })); setArquivoNome(""); }} aria-label="Remover anexo">
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onFechar}>Cancelar</Button>
          <Button onClick={salvar} disabled={salvando}>{salvando ? "Salvando..." : "Salvar atestado"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
