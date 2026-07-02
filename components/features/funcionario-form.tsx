"use client";
/**
 * Formulário completo de colaboradora (criação e edição) em modal.
 * Validações: campos obrigatórios, CPF com máscara, total de férias.
 */
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "@/components/shared/form-field";
import { api } from "@/services/api";
import { hojeISO, maskCEP, maskCPF, maskTelefone } from "@/lib/utils";
import { STATUS_LABEL, UFS } from "@/lib/constants";
import type { Funcionario, Horario, Loja, StatusFuncionario } from "@/types";

const VAZIO: Omit<Funcionario, "id"> = {
  nome: "", cargo: "Vendedora", lojaId: "", horarioId: "", escala: "6x1",
  admissao: hojeISO(), nascimento: "", cpf: "", rg: "", telefone: "", email: "",
  endereco: "", cidade: "São Paulo", estado: "SP", cep: "", status: "ativo",
  obs: "", criadoEm: hojeISO(),
};

export function FuncionarioForm({
  aberto, onFechar, onSalvo, funcionario, lojas, horarios,
}: {
  aberto: boolean;
  onFechar: () => void;
  onSalvo: () => void;
  funcionario: Funcionario | null; // null = novo cadastro
  lojas: Loja[];
  horarios: Horario[];
}) {
  const [form, setForm] = useState<Omit<Funcionario, "id">>(VAZIO);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (aberto) setForm(funcionario ? { ...funcionario } : { ...VAZIO, lojaId: lojas[0]?.id ?? "", horarioId: horarios[0]?.id ?? "" });
  }, [aberto, funcionario, lojas, horarios]);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const gerenteDaLoja = lojas.find((l) => l.id === form.lojaId)?.gerente ?? "—";

  async function salvar() {
    // validações essenciais
    if (!form.nome.trim()) return toast.error("Informe o nome.");
    if (!form.lojaId) return toast.error("Selecione a loja.");
    if (!form.horarioId) return toast.error("Selecione o horário.");
    if (form.cpf && form.cpf.replace(/\D/g, "").length !== 11) return toast.error("CPF incompleto.");
    if (form.status === "desligado" && !form.dataDesligamento) {
      return toast.error("Informe a data de desligamento.");
    }
    if (form.feriasInicio && form.feriasFim && form.feriasFim < form.feriasInicio) {
      return toast.error("O fim das férias não pode ser antes do início.");
    }

    setSalvando(true);
    try {
      if (funcionario) {
        await api.update<Funcionario>("funcionarios", funcionario.id, form);
        toast.success("Cadastro atualizado.");
      } else {
        await api.create<Funcionario>("funcionarios", form);
        toast.success("Colaboradora cadastrada.");
      }
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
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{funcionario ? `Editar — ${funcionario.nome}` : "Nova colaboradora"}</DialogTitle>
          <DialogDescription>Cadastro completo com dados pessoais, loja, horário e status.</DialogDescription>
        </DialogHeader>

        {/* Dados profissionais */}
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dados profissionais</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Nome completo" obrigatorio className="sm:col-span-2">
            <Input value={form.nome} onChange={(e) => set("nome", e.target.value)} placeholder="Nome da colaboradora" />
          </Field>
          <Field label="Cargo" obrigatorio>
            <Input value={form.cargo} onChange={(e) => set("cargo", e.target.value)} />
          </Field>
          <Field label="Loja" obrigatorio>
            <Select value={form.lojaId} onValueChange={(v) => set("lojaId", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {lojas.map((l) => <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Gerente (da loja)">
            <Input value={gerenteDaLoja} disabled />
          </Field>
          <Field label="Horário" obrigatorio>
            <Select value={form.horarioId} onValueChange={(v) => set("horarioId", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {horarios.map((h) => (
                  <SelectItem key={h.id} value={h.id}>{h.nome} ({h.entrada}–{h.saida})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Escala">
            <Select value={form.escala} onValueChange={(v) => set("escala", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="6x1">6x1 (loja)</SelectItem>
                <SelectItem value="5x2">5x2 (escritório)</SelectItem>
                <SelectItem value="12x36">12x36</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Data de admissão" obrigatorio>
            <Input type="date" value={form.admissao} onChange={(e) => set("admissao", e.target.value)} />
          </Field>
          <Field label="Status">
            <Select value={form.status} onValueChange={(v) => set("status", v as StatusFuncionario)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(STATUS_LABEL) as StatusFuncionario[]).map((s) => (
                  <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        {form.status === "desligado" && (
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Data de desligamento" obrigatorio>
              <Input type="date" value={form.dataDesligamento ?? ""} onChange={(e) => set("dataDesligamento", e.target.value)} />
            </Field>
          </div>
        )}

        {/* Férias */}
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Férias programadas</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Início das férias">
            <Input type="date" value={form.feriasInicio ?? ""} onChange={(e) => set("feriasInicio", e.target.value || undefined)} />
          </Field>
          <Field label="Fim das férias">
            <Input type="date" value={form.feriasFim ?? ""} onChange={(e) => set("feriasFim", e.target.value || undefined)} />
          </Field>
        </div>

        {/* Dados pessoais */}
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dados pessoais</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Data de nascimento">
            <Input type="date" value={form.nascimento} onChange={(e) => set("nascimento", e.target.value)} />
          </Field>
          <Field label="CPF">
            <Input value={form.cpf} onChange={(e) => set("cpf", maskCPF(e.target.value))} placeholder="000.000.000-00" />
          </Field>
          <Field label="RG">
            <Input value={form.rg} onChange={(e) => set("rg", e.target.value)} />
          </Field>
          <Field label="Telefone">
            <Input value={form.telefone} onChange={(e) => set("telefone", maskTelefone(e.target.value))} placeholder="(11) 90000-0000" />
          </Field>
          <Field label="E-mail" className="sm:col-span-2">
            <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="email@empresa.com.br" />
          </Field>
          <Field label="Endereço" className="sm:col-span-2">
            <Input value={form.endereco} onChange={(e) => set("endereco", e.target.value)} />
          </Field>
          <Field label="CEP">
            <Input value={form.cep} onChange={(e) => set("cep", maskCEP(e.target.value))} placeholder="00000-000" />
          </Field>
          <Field label="Cidade" className="sm:col-span-2">
            <Input value={form.cidade} onChange={(e) => set("cidade", e.target.value)} />
          </Field>
          <Field label="Estado">
            <Select value={form.estado} onValueChange={(v) => set("estado", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {UFS.map((uf) => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Field label="Observações">
          <Textarea value={form.obs ?? ""} onChange={(e) => set("obs", e.target.value)} placeholder="Anotações internas do RH..." />
        </Field>

        <DialogFooter>
          <Button variant="outline" onClick={onFechar}>Cancelar</Button>
          <Button onClick={salvar} disabled={salvando}>
            {salvando ? "Salvando..." : funcionario ? "Salvar alterações" : "Cadastrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
