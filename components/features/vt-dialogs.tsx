"use client";
/**
 * Diálogos do Vale Transporte:
 *  - VTConfigDialog: configuração de tarifas/forma de pagamento por colaboradora
 *  - VTPagamentoDialog: registro do pagamento mensal com validação
 *    (cartão + PIX deve ser exatamente igual ao valor calculado)
 */
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "@/components/shared/form-field";
import { Badge } from "@/components/ui/badge";
import { api } from "@/services/api";
import { custoDiaVT, type CalculoVT } from "@/lib/calc";
import { brl, fmtCompetencia, hojeISO } from "@/lib/utils";
import type { FormaPagamentoVT, Funcionario, VTConfig, VTPagamento } from "@/types";

/* ===================== Configuração ===================== */

export function VTConfigDialog({
  aberto, onFechar, onSalvo, funcionario, config,
}: {
  aberto: boolean;
  onFechar: () => void;
  onSalvo: () => void;
  funcionario: Funcionario | null;
  config: VTConfig | null;
}) {
  const [form, setForm] = useState({
    recebeVT: true, valorIda: "5,20", valorVolta: "5,20",
    qtdIntegracoes: "0", valorIntegracao: "0", condPorDia: "2",
    formaPadrao: "cartao" as FormaPagamentoVT,
  });
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (aberto && config) {
      setForm({
        recebeVT: config.recebeVT,
        valorIda: config.valorIda.toFixed(2).replace(".", ","),
        valorVolta: config.valorVolta.toFixed(2).replace(".", ","),
        qtdIntegracoes: String(config.qtdIntegracoes),
        valorIntegracao: config.valorIntegracao.toFixed(2).replace(".", ","),
        condPorDia: String(config.condPorDia),
        formaPadrao: config.formaPadrao,
      });
    }
  }, [aberto, config]);

  const numero = (s: string) => Number(s.replace(",", ".")) || 0;
  const custoDia =
    numero(form.valorIda) + numero(form.valorVolta) + (Number(form.qtdIntegracoes) || 0) * numero(form.valorIntegracao);

  async function salvar() {
    if (!funcionario) return;
    setSalvando(true);
    try {
      const payload: Partial<VTConfig> = {
        funcionarioId: funcionario.id,
        recebeVT: form.recebeVT,
        valorIda: numero(form.valorIda),
        valorVolta: numero(form.valorVolta),
        qtdIntegracoes: Number(form.qtdIntegracoes) || 0,
        valorIntegracao: numero(form.valorIntegracao),
        condPorDia: Number(form.condPorDia) || 2,
        formaPadrao: form.formaPadrao,
      };
      if (config) await api.update<VTConfig>("vtConfigs", config.id, payload);
      else await api.create<VTConfig>("vtConfigs", payload);
      toast.success("Configuração de VT salva.");
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Vale transporte — {funcionario?.nome}</DialogTitle>
          <DialogDescription>Tarifas, integrações e forma de pagamento padrão.</DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between rounded-lg border p-3">
          <span className="text-sm font-medium">Recebe vale transporte</span>
          <Switch checked={form.recebeVT} onCheckedChange={(v) => setForm((f) => ({ ...f, recebeVT: v }))} />
        </div>

        {form.recebeVT && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Passagem de ida (R$)">
                <Input value={form.valorIda} onChange={(e) => setForm((f) => ({ ...f, valorIda: e.target.value }))} />
              </Field>
              <Field label="Passagem de volta (R$)">
                <Input value={form.valorVolta} onChange={(e) => setForm((f) => ({ ...f, valorVolta: e.target.value }))} />
              </Field>
              <Field label="Qtd. integrações/dia">
                <Input type="number" min={0} value={form.qtdIntegracoes} onChange={(e) => setForm((f) => ({ ...f, qtdIntegracoes: e.target.value }))} />
              </Field>
              <Field label="Valor da integração (R$)">
                <Input value={form.valorIntegracao} onChange={(e) => setForm((f) => ({ ...f, valorIntegracao: e.target.value }))} />
              </Field>
              <Field label="Conduções por dia">
                <Input type="number" min={1} value={form.condPorDia} onChange={(e) => setForm((f) => ({ ...f, condPorDia: e.target.value }))} />
              </Field>
              <Field label="Forma de pagamento padrão">
                <Select value={form.formaPadrao} onValueChange={(v) => setForm((f) => ({ ...f, formaPadrao: v as FormaPagamentoVT }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cartao">100% cartão VT</SelectItem>
                    <SelectItem value="pix">100% PIX</SelectItem>
                    <SelectItem value="misto">Misto (cartão + PIX)</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className="rounded-lg bg-accent p-3 text-sm">
              Custo por dia trabalhado: <strong>{brl(custoDia)}</strong>
            </div>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onFechar}>Cancelar</Button>
          <Button onClick={salvar} disabled={salvando}>{salvando ? "Salvando..." : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ===================== Pagamento ===================== */

export function VTPagamentoDialog({
  aberto, onFechar, onSalvo, funcionario, config, calculo, competencia, responsavel,
}: {
  aberto: boolean;
  onFechar: () => void;
  onSalvo: () => void;
  funcionario: Funcionario | null;
  config: VTConfig | null;
  calculo: CalculoVT | null;
  competencia: string;
  responsavel: string;
}) {
  const [dias, setDias] = useState("0");
  const [cartao, setCartao] = useState("0");
  const [pix, setPix] = useState("0");
  const [data, setData] = useState(hojeISO());
  const [obs, setObs] = useState("");
  const [salvando, setSalvando] = useState(false);

  const custoDia = config ? custoDiaVT(config) : 0;
  const numero = (s: string) => Math.round((Number(s.replace(",", ".")) || 0) * 100) / 100;
  const total = useMemo(() => Math.round(Number(dias || 0) * custoDia * 100) / 100, [dias, custoDia]);

  // ao abrir: preenche dias calculados e distribui conforme a forma padrão
  useEffect(() => {
    if (aberto && calculo && config) {
      const d = calculo.diasTrabalhados;
      setDias(String(d));
      const t = Math.round(d * custoDiaVT(config) * 100) / 100;
      if (config.formaPadrao === "pix") { setCartao("0"); setPix(t.toFixed(2).replace(".", ",")); }
      else if (config.formaPadrao === "misto") {
        const c = Math.min(180, t);
        setCartao(c.toFixed(2).replace(".", ","));
        setPix((t - c).toFixed(2).replace(".", ","));
      } else { setCartao(t.toFixed(2).replace(".", ",")); setPix("0"); }
      setObs("");
      setData(hojeISO());
    }
  }, [aberto, calculo, config]);

  // recalcula distribuição quando os dias mudam (mantém proporção cartão primeiro)
  useEffect(() => {
    if (!aberto) return;
    const c = Math.min(numero(cartao), total);
    setPix((Math.round((total - c) * 100) / 100).toFixed(2).replace(".", ","));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  function setCartaoAjustando(v: string) {
    setCartao(v);
    const c = numero(v);
    if (c <= total) setPix((Math.round((total - c) * 100) / 100).toFixed(2).replace(".", ","));
  }

  const soma = Math.round((numero(cartao) + numero(pix)) * 100) / 100;
  const valido = Math.abs(soma - total) < 0.01 && total > 0;

  async function salvar() {
    if (!funcionario || !config) return;
    // trava de segurança: total dividido tem que bater com o calculado
    if (!valido) {
      toast.error(`A soma cartão + PIX (${brl(soma)}) precisa ser igual ao total calculado (${brl(total)}).`);
      return;
    }
    setSalvando(true);
    try {
      await api.create<VTPagamento>("vtPagamentos", {
        funcionarioId: funcionario.id,
        competencia,
        diasConsiderados: Number(dias) || 0,
        custoDia,
        valorTotal: total,
        valorCartao: numero(cartao),
        valorPix: numero(pix),
        dataPagamento: data,
        responsavel,
        obs: obs || undefined,
      });
      toast.success(`Pagamento de ${funcionario.nome} registrado.`);
      onSalvo();
      onFechar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao registrar.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar pagamento — {funcionario?.nome}</DialogTitle>
          <DialogDescription className="capitalize">Competência {fmtCompetencia(competencia)}</DialogDescription>
        </DialogHeader>

        {calculo && (
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            {([
              ["Trabalh.", calculo.diasTrabalhados], ["Atestado", calculo.diasAtestado],
              ["Férias", calculo.diasFerias], ["Folgas", calculo.folgas],
            ] as [string, number][]).map(([k, v]) => (
              <div key={k} className="rounded-md bg-muted/60 p-2">
                <p className="font-bold">{v}</p>
                <p className="text-muted-foreground">{k}</p>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Dias considerados">
            <Input type="number" min={0} value={dias} onChange={(e) => setDias(e.target.value)} />
          </Field>
          <Field label="Custo por dia">
            <Input value={brl(custoDia)} disabled />
          </Field>
        </div>

        <div className="rounded-lg border-2 border-primary/30 bg-accent/60 p-3 text-center">
          <p className="text-xs text-muted-foreground">{dias} dia(s) × {brl(custoDia)}</p>
          <p className="text-2xl font-bold">{brl(total)}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Cartão VT (R$)">
            <Input value={cartao} onChange={(e) => setCartaoAjustando(e.target.value)} />
          </Field>
          <Field label="PIX (R$)">
            <Input value={pix} onChange={(e) => setPix(e.target.value)} />
          </Field>
        </div>

        {!valido && total > 0 && (
          <Badge variant="destructive" className="justify-center py-1.5">
            Divisão inválida: {brl(soma)} ≠ {brl(total)}
          </Badge>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Data do pagamento">
            <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </Field>
          <Field label="Responsável">
            <Input value={responsavel} disabled />
          </Field>
        </div>

        <Field label="Observações">
          <Textarea value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Ex.: desconto de 2 dias de atestado..." />
        </Field>

        <DialogFooter>
          <Button variant="outline" onClick={onFechar}>Cancelar</Button>
          <Button onClick={salvar} disabled={salvando || !valido}>
            {salvando ? "Registrando..." : `Registrar ${brl(total)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
