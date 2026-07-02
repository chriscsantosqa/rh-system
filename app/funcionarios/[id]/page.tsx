"use client";
/**
 * Ficha completa da colaboradora com abas:
 * dados, atestados, vale transporte, ASOs, documentos e escala.
 */
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, ClipboardPlus, FileText, HeartPulse, Pencil, Bus, User } from "lucide-react";
import { useData } from "@/hooks/use-data";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { Avatar } from "@/components/shared/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { FuncionarioForm } from "@/components/features/funcionario-form";
import { STATUS_BADGE, STATUS_LABEL, TIPO_ASO_LABEL, TIPO_ATESTADO_LABEL, TIPO_DOC_LABEL, ESCALA_DIA } from "@/lib/constants";
import { alertasAtestado, custoDiaVT, resumoEscala } from "@/lib/calc";
import { brl, fmtData, hojeISO, idadeAnos, mesAtual, diffDias, cn } from "@/lib/utils";

export default function FuncionarioDetalhe({ params }: { params: { id: string } }) {
  const { funcionarios, lojas, horarios, atestados, vtConfigs, vtPagamentos, asos, documentos, escalas, bancoHoras, feriados, loading, refresh } = useData();
  const { can } = useAuth();
  const [editando, setEditando] = useState(false);

  const f = funcionarios.find((x) => x.id === params.id);

  if (loading) return <Skeleton className="h-96" />;
  if (!f) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">Colaboradora não encontrada (ou fora do seu escopo de acesso).</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/funcionarios"><ArrowLeft /> Voltar</Link>
        </Button>
      </div>
    );
  }

  const loja = lojas.find((l) => l.id === f.lojaId);
  const horario = horarios.find((h) => h.id === f.horarioId);
  const ats = atestados.filter((a) => a.funcionarioId === f.id).sort((a, b) => b.dataEmissao.localeCompare(a.dataEmissao));
  const cfg = vtConfigs.find((v) => v.funcionarioId === f.id);
  const pags = vtPagamentos.filter((p) => p.funcionarioId === f.id).sort((a, b) => b.competencia.localeCompare(a.competencia));
  const asosFunc = asos.filter((a) => a.funcionarioId === f.id).sort((a, b) => b.dataRealizacao.localeCompare(a.dataRealizacao));
  const docs = documentos.filter((d) => d.funcionarioId === f.id).sort((a, b) => b.data.localeCompare(a.data));
  const bh = bancoHoras.filter((b) => b.funcionarioId === f.id);
  const saldoBH = bh.reduce((s, b) => s + b.horas, 0);
  const alertas = alertasAtestado(ats);
  const resumo = resumoEscala(escalas, f.id, mesAtual(), feriados);
  const tempoCasa = Math.floor(diffDias(f.admissao, hojeISO()) / 30.44);

  const info: [string, string][] = [
    ["Cargo", f.cargo],
    ["Loja", loja?.nome ?? "—"],
    ["Gerente", loja?.gerente ?? "—"],
    ["Horário", horario ? `${horario.nome} (${horario.entrada}–${horario.saida})` : "—"],
    ["Escala", f.escala],
    ["Admissão", `${fmtData(f.admissao)} (${Math.floor(tempoCasa / 12)}a ${tempoCasa % 12}m)`],
    ["Nascimento", f.nascimento ? `${fmtData(f.nascimento)} (${idadeAnos(f.nascimento)} anos)` : "—"],
    ["CPF", f.cpf || "—"],
    ["RG", f.rg || "—"],
    ["Telefone", f.telefone || "—"],
    ["E-mail", f.email || "—"],
    ["Endereço", [f.endereco, f.cidade, f.estado, f.cep].filter(Boolean).join(", ") || "—"],
  ];

  return (
    <div>
      <PageHeader titulo={f.nome} descricao={`${f.cargo} — ${loja?.nome ?? ""}`}>
        <Button variant="outline" asChild>
          <Link href="/funcionarios"><ArrowLeft /> Voltar</Link>
        </Button>
        {can("editar") && (
          <Button onClick={() => setEditando(true)}><Pencil /> Editar cadastro</Button>
        )}
      </PageHeader>

      {/* Cabeçalho da ficha */}
      <Card className="mb-6 animate-fade-in">
        <CardContent className="flex flex-wrap items-center gap-4 p-5">
          <Avatar nome={f.nome} className="h-14 w-14 text-lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-lg font-bold">{f.nome}</p>
              <Badge className={STATUS_BADGE[f.status]}>{STATUS_LABEL[f.status]}</Badge>
              {f.feriasInicio && f.feriasInicio >= hojeISO() && (
                <Badge variant="secondary">Férias em {fmtData(f.feriasInicio)}</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{f.email} · {f.telefone}</p>
          </div>
          <div className="flex gap-6 text-center">
            <div><p className="text-xl font-bold">{ats.length}</p><p className="text-[11px] text-muted-foreground">Atestados</p></div>
            <div><p className="text-xl font-bold">{ats.reduce((s, a) => s + a.dias, 0)}</p><p className="text-[11px] text-muted-foreground">Dias perdidos</p></div>
            <div><p className={cn("text-xl font-bold", saldoBH < 0 && "text-destructive")}>{saldoBH > 0 ? "+" : ""}{saldoBH}h</p><p className="text-[11px] text-muted-foreground">Banco de horas</p></div>
          </div>
        </CardContent>
        {alertas.length > 0 && (
          <CardContent className="border-t pt-3">
            <div className="flex flex-wrap gap-2">
              {alertas.map((a, i) => (
                <Badge key={i} variant={a.nivel === "alto" ? "destructive" : "warning"}>{a.texto}</Badge>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      <Tabs defaultValue="dados">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="dados"><User /> Dados</TabsTrigger>
          <TabsTrigger value="atestados"><ClipboardPlus /> Atestados ({ats.length})</TabsTrigger>
          <TabsTrigger value="vt"><Bus /> Vale Transporte</TabsTrigger>
          <TabsTrigger value="asos"><HeartPulse /> ASOs ({asosFunc.length})</TabsTrigger>
          <TabsTrigger value="docs"><FileText /> Documentos ({docs.length})</TabsTrigger>
          <TabsTrigger value="escala"><CalendarDays /> Escala do mês</TabsTrigger>
        </TabsList>

        <TabsContent value="dados">
          <Card>
            <CardContent className="grid gap-x-8 gap-y-3 p-5 sm:grid-cols-2">
              {info.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b pb-2 text-sm last:border-0">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="text-right font-medium">{v}</span>
                </div>
              ))}
              {f.obs && (
                <div className="sm:col-span-2 rounded-lg bg-muted/50 p-3 text-sm">
                  <p className="mb-1 text-xs font-semibold text-muted-foreground">Observações</p>
                  {f.obs}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="atestados">
          <Card>
            <CardContent className="p-5">
              {ats.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Nenhum atestado registrado.</p>}
              <div className="space-y-2">
                {ats.map((a) => (
                  <div key={a.id} className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
                    <Badge variant="secondary">{fmtData(a.dataEmissao)}</Badge>
                    <span className="text-sm font-medium">{a.dias} dia(s)</span>
                    {a.cid && <Badge>CID {a.cid}</Badge>}
                    <Badge variant="outline">{TIPO_ATESTADO_LABEL[a.tipo]}</Badge>
                    <span className="text-xs text-muted-foreground">{a.medico} · CRM {a.crm} · {a.hospital}</span>
                    {a.arquivo && (
                      <a href={a.arquivo} target="_blank" className="text-xs text-primary underline">anexo</a>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vt">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-sm">Configuração</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {!cfg || !cfg.recebeVT ? (
                  <p className="text-muted-foreground">Não recebe vale transporte.</p>
                ) : (
                  <>
                    <p className="flex justify-between"><span className="text-muted-foreground">Passagem ida</span><span>{brl(cfg.valorIda)}</span></p>
                    <p className="flex justify-between"><span className="text-muted-foreground">Passagem volta</span><span>{brl(cfg.valorVolta)}</span></p>
                    <p className="flex justify-between"><span className="text-muted-foreground">Integrações</span><span>{cfg.qtdIntegracoes} × {brl(cfg.valorIntegracao)}</span></p>
                    <p className="flex justify-between"><span className="text-muted-foreground">Conduções/dia</span><span>{cfg.condPorDia}</span></p>
                    <p className="flex justify-between border-t pt-2 font-semibold"><span>Custo por dia</span><span>{brl(custoDiaVT(cfg))}</span></p>
                  </>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Histórico de pagamentos</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {pags.length === 0 && <p className="text-sm text-muted-foreground">Nenhum pagamento registrado.</p>}
                {pags.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border p-2.5 text-sm">
                    <span className="capitalize">{p.competencia.split("-").reverse().join("/")}</span>
                    <span className="text-xs text-muted-foreground">{p.diasConsiderados} dias</span>
                    <span className="font-semibold">{brl(p.valorTotal)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="asos">
          <Card>
            <CardContent className="p-5 space-y-2">
              {asosFunc.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Nenhum ASO registrado.</p>}
              {asosFunc.map((a) => {
                const dias = a.validade ? diffDias(hojeISO(), a.validade) : null;
                return (
                  <div key={a.id} className="flex flex-wrap items-center gap-3 rounded-lg border p-3 text-sm">
                    <Badge>{TIPO_ASO_LABEL[a.tipo]}</Badge>
                    <span>Realizado em {fmtData(a.dataRealizacao)}</span>
                    {a.validade && (
                      <Badge variant={dias! < 0 ? "destructive" : dias! <= 30 ? "warning" : "success"}>
                        {dias! < 0 ? `Vencido há ${-dias!}d` : `Válido até ${fmtData(a.validade)}`}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">{a.clinica} · {a.medico}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="docs">
          <Card>
            <CardContent className="p-5 space-y-2">
              {docs.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Nenhum documento anexado.</p>}
              {docs.map((d) => (
                <div key={d.id} className="flex flex-wrap items-center gap-3 rounded-lg border p-3 text-sm">
                  <Badge variant={d.tipo === "advertencia" || d.tipo === "suspensao" ? "destructive" : "secondary"}>
                    {TIPO_DOC_LABEL[d.tipo]}
                  </Badge>
                  <span className="font-medium">{d.titulo}</span>
                  <span className="text-xs text-muted-foreground">{fmtData(d.data)}</span>
                  {d.arquivo && <a href={d.arquivo} target="_blank" className="text-xs text-primary underline">abrir</a>}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="escala">
          <Card>
            <CardContent className="p-5">
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9">
                {([
                  ["Trabalho", resumo.trabalho], ["Folgas", resumo.folgas], ["Férias", resumo.ferias],
                  ["Atestado", resumo.atestado], ["Afastam.", resumo.afastamento], ["Trocas", resumo.trocas],
                  ["Extras", resumo.extras], ["Domingos", resumo.domingosTrabalhados], ["Feriados", resumo.feriadosTrabalhados],
                ] as [string, number][]).map(([k, v]) => (
                  <div key={k} className="rounded-lg border p-3 text-center">
                    <p className="text-lg font-bold">{v}</p>
                    <p className="text-[11px] text-muted-foreground">{k}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                {Object.values(ESCALA_DIA).map((e) => (
                  <span key={e.sigla} className={cn("rounded px-1.5 py-0.5", e.cls)}>{e.sigla} = {e.label}</span>
                ))}
              </div>
              <Button variant="outline" size="sm" className="mt-4" asChild>
                <Link href="/escalas"><CalendarDays /> Abrir escala completa</Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <FuncionarioForm
        aberto={editando}
        onFechar={() => setEditando(false)}
        onSalvo={refresh}
        funcionario={f}
        lojas={lojas}
        horarios={horarios}
      />
    </div>
  );
}
