"use client";
/**
 * Configurações: lojas, horários, feriados, usuários e permissões,
 * importação via Excel, backup/restauração e log de auditoria.
 */
import { useRef, useState } from "react";
import {
  CalendarDays, Clock, Database, Download, FileUp, History,
  Pencil, Plus, RotateCcw, Store, Trash2, Upload, Users2,
} from "lucide-react";
import { toast } from "sonner";
import { useData } from "@/hooks/use-data";
import { useAuth } from "@/lib/auth";
import { api } from "@/services/api";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { Field } from "@/components/shared/form-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PAPEL_LABEL } from "@/lib/constants";
import { exportExcel, readExcel } from "@/utils/export";
import { fmtData, hojeISO } from "@/lib/utils";
import type { AuditEntry, Feriado, Funcionario, Horario, Loja, Papel, Usuario } from "@/types";

export default function ConfiguracoesPage() {
  const { lojas, horarios, feriados, usuarios, funcionarios, auditoria, loading, refresh } = useData();
  const { can, user } = useAuth();

  /* ---------- lojas ---------- */
  const [lojaDialog, setLojaDialog] = useState<{ loja: Loja | null } | null>(null);
  const [lojaForm, setLojaForm] = useState({ nome: "", gerente: "", cidade: "", cor: "#6366f1" });

  function abrirLoja(l: Loja | null) {
    setLojaForm(l ? { nome: l.nome, gerente: l.gerente, cidade: l.cidade ?? "", cor: l.cor ?? "#6366f1" } : { nome: "", gerente: "", cidade: "", cor: "#6366f1" });
    setLojaDialog({ loja: l });
  }
  async function salvarLoja() {
    if (!lojaForm.nome.trim()) return toast.error("Informe o nome da loja.");
    try {
      if (lojaDialog?.loja) await api.update<Loja>("lojas", lojaDialog.loja.id, lojaForm);
      else await api.create<Loja>("lojas", lojaForm);
      toast.success("Loja salva.");
      setLojaDialog(null);
      refresh();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro."); }
  }

  /* ---------- horários ---------- */
  const [horDialog, setHorDialog] = useState<{ hor: Horario | null } | null>(null);
  const [horForm, setHorForm] = useState({
    nome: "", dias: "Seg a Sáb", entrada: "09:00", saida: "18:00",
    entradaSexta: "", saidaSexta: "", intervaloMin: "60", aplicacao: "loja" as Horario["aplicacao"],
  });

  function abrirHorario(h: Horario | null) {
    setHorForm(h ? {
      nome: h.nome, dias: h.dias, entrada: h.entrada, saida: h.saida,
      entradaSexta: h.entradaSexta ?? "", saidaSexta: h.saidaSexta ?? "",
      intervaloMin: String(h.intervaloMin), aplicacao: h.aplicacao,
    } : { nome: "", dias: "Seg a Sáb", entrada: "09:00", saida: "18:00", entradaSexta: "", saidaSexta: "", intervaloMin: "60", aplicacao: "loja" });
    setHorDialog({ hor: h });
  }
  async function salvarHorario() {
    if (!horForm.nome.trim()) return toast.error("Informe o nome do horário.");
    const payload = {
      nome: horForm.nome, dias: horForm.dias, entrada: horForm.entrada, saida: horForm.saida,
      entradaSexta: horForm.entradaSexta || undefined, saidaSexta: horForm.saidaSexta || undefined,
      intervaloMin: Number(horForm.intervaloMin) || 60, aplicacao: horForm.aplicacao,
    };
    try {
      if (horDialog?.hor) await api.update<Horario>("horarios", horDialog.hor.id, payload);
      else await api.create<Horario>("horarios", payload);
      toast.success("Horário salvo.");
      setHorDialog(null);
      refresh();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro."); }
  }

  /* ---------- feriados ---------- */
  const [ferData, setFerData] = useState(hojeISO());
  const [ferNome, setFerNome] = useState("");
  async function addFeriado() {
    if (!ferNome.trim()) return toast.error("Informe o nome do feriado.");
    try {
      await api.create<Feriado & { id: string }>("feriados", { data: ferData, nome: ferNome } as any);
      toast.success("Feriado adicionado.");
      setFerNome("");
      refresh();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro."); }
  }

  /* ---------- usuários ---------- */
  const [usuDialog, setUsuDialog] = useState<{ usu: Usuario | null } | null>(null);
  const [usuForm, setUsuForm] = useState({ nome: "", email: "", papel: "consulta" as Papel, lojaId: "nenhuma" });

  function abrirUsuario(u: Usuario | null) {
    setUsuForm(u ? { nome: u.nome, email: u.email, papel: u.papel, lojaId: u.lojaId ?? "nenhuma" } : { nome: "", email: "", papel: "consulta", lojaId: "nenhuma" });
    setUsuDialog({ usu: u });
  }
  async function salvarUsuario() {
    if (!usuForm.nome.trim() || !usuForm.email.trim()) return toast.error("Informe nome e e-mail.");
    if (usuForm.papel === "gerente" && usuForm.lojaId === "nenhuma") return toast.error("Gerente precisa de uma loja.");
    const payload = { nome: usuForm.nome, email: usuForm.email, papel: usuForm.papel, lojaId: usuForm.lojaId === "nenhuma" ? undefined : usuForm.lojaId };
    try {
      if (usuDialog?.usu) await api.update<Usuario>("usuarios", usuDialog.usu.id, payload);
      else await api.create<Usuario>("usuarios", payload);
      toast.success("Usuário salvo.");
      setUsuDialog(null);
      refresh();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro."); }
  }

  /* ---------- importação Excel ---------- */
  const importRef = useRef<HTMLInputElement>(null);
  const [importando, setImportando] = useState(false);

  function baixarModelo() {
    exportExcel("modelo-importacao-funcionarios", [{
      name: "Funcionários",
      rows: [{
        nome: "Exemplo da Silva", cargo: "Vendedora", loja: lojas[0]?.nome ?? "Lupatelli Plaza",
        horario: horarios[0]?.nome ?? "Manhã", escala: "6x1", admissao: "2026-01-15",
        nascimento: "1995-05-20", cpf: "000.000.000-00", rg: "00.000.000-0",
        telefone: "(11) 90000-0000", email: "exemplo@empresa.com.br",
        endereco: "Rua Exemplo, 100", cidade: "São Paulo", estado: "SP", cep: "00000-000", status: "ativo",
      }],
    }]);
  }

  async function importar(file: File) {
    setImportando(true);
    try {
      const rows = await readExcel(file);
      if (rows.length === 0) throw new Error("Planilha vazia.");
      const novos: Partial<Funcionario>[] = [];
      const erros: string[] = [];
      rows.forEach((r, i) => {
        const nome = String(r["nome"] ?? "").trim();
        if (!nome) { erros.push(`Linha ${i + 2}: sem nome`); return; }
        const lojaNome = String(r["loja"] ?? "").trim().toLowerCase();
        const loja = lojas.find((l) => l.nome.toLowerCase() === lojaNome) ?? lojas[0];
        const horNome = String(r["horario"] ?? "").trim().toLowerCase();
        const hor = horarios.find((h) => h.nome.toLowerCase() === horNome) ?? horarios[0];
        novos.push({
          nome, cargo: String(r["cargo"] ?? "Vendedora"), lojaId: loja?.id, horarioId: hor?.id,
          escala: String(r["escala"] ?? "6x1"), admissao: String(r["admissao"] ?? hojeISO()),
          nascimento: String(r["nascimento"] ?? ""), cpf: String(r["cpf"] ?? ""), rg: String(r["rg"] ?? ""),
          telefone: String(r["telefone"] ?? ""), email: String(r["email"] ?? ""),
          endereco: String(r["endereco"] ?? ""), cidade: String(r["cidade"] ?? ""), estado: String(r["estado"] ?? "SP"),
          cep: String(r["cep"] ?? ""), status: (String(r["status"] ?? "ativo") as Funcionario["status"]),
          criadoEm: hojeISO(),
        });
      });
      if (novos.length === 0) throw new Error("Nenhuma linha válida. " + erros.join("; "));
      await api.create("funcionarios", novos as any);
      toast.success(`${novos.length} colaboradora(s) importada(s).${erros.length ? ` ${erros.length} linha(s) ignorada(s).` : ""}`);
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha na importação.");
    } finally {
      setImportando(false);
      if (importRef.current) importRef.current.value = "";
    }
  }

  /* ---------- backup ---------- */
  const restoreRef = useRef<HTMLInputElement>(null);
  async function restaurar(file: File) {
    try {
      const texto = await file.text();
      const json = JSON.parse(texto);
      await api.backup.restore(json);
      toast.success("Backup restaurado com sucesso.");
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Backup inválido.");
    } finally {
      if (restoreRef.current) restoreRef.current.value = "";
    }
  }
  async function resetar() {
    try {
      await api.backup.reset();
      toast.success("Banco resetado para os dados de demonstração.");
      refresh();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro."); }
  }

  if (loading) return <Skeleton className="h-96" />;

  if (!can("configuracoes")) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        <p>Seu perfil ({user ? PAPEL_LABEL[user.papel] : "—"}) não tem acesso às configurações.</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader titulo="Configurações" descricao="Cadastros base, usuários, importação, backup e auditoria" />

      <Tabs defaultValue="lojas">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="lojas"><Store /> Lojas</TabsTrigger>
          <TabsTrigger value="horarios"><Clock /> Horários</TabsTrigger>
          <TabsTrigger value="feriados"><CalendarDays /> Feriados</TabsTrigger>
          {can("usuarios") && <TabsTrigger value="usuarios"><Users2 /> Usuários</TabsTrigger>}
          <TabsTrigger value="importacao"><FileUp /> Importação</TabsTrigger>
          {can("backup") && <TabsTrigger value="backup"><Database /> Backup</TabsTrigger>}
          {can("auditoria") && <TabsTrigger value="auditoria"><History /> Auditoria</TabsTrigger>}
        </TabsList>

        {/* ============ LOJAS ============ */}
        <TabsContent value="lojas">
          <div className="mb-3 flex justify-end">
            <Button onClick={() => abrirLoja(null)}><Plus /> Nova loja</Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {lojas.map((l) => (
              <Card key={l.id}>
                <CardContent className="flex items-center gap-3 p-4">
                  <span className="h-9 w-9 shrink-0 rounded-lg" style={{ backgroundColor: l.cor ?? "#6366f1" }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{l.nome}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      Gerente: {l.gerente} · {funcionarios.filter((f) => f.lojaId === l.id && f.status !== "desligado").length} ativa(s)
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => abrirLoja(l)}><Pencil className="h-4 w-4" /></Button>
                  <ConfirmDelete
                    titulo={`Excluir ${l.nome}?`}
                    descricao="Colaboradoras vinculadas ficarão sem loja. Esta ação não pode ser desfeita."
                    onConfirm={async () => { await api.remove("lojas", l.id); toast.success("Loja excluída."); refresh(); }}
                  >
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </ConfirmDelete>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ============ HORÁRIOS ============ */}
        <TabsContent value="horarios">
          <div className="mb-3 flex justify-end">
            <Button onClick={() => abrirHorario(null)}><Plus /> Novo horário</Button>
          </div>
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-transparent">
                  <TableHead>Nome</TableHead>
                  <TableHead>Dias</TableHead>
                  <TableHead>Horário</TableHead>
                  <TableHead>Sexta</TableHead>
                  <TableHead>Intervalo</TableHead>
                  <TableHead>Aplicação</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {horarios.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell className="font-medium">{h.nome}</TableCell>
                    <TableCell className="text-muted-foreground">{h.dias}</TableCell>
                    <TableCell>{h.entrada} – {h.saida}</TableCell>
                    <TableCell>{h.entradaSexta ? `${h.entradaSexta} – ${h.saidaSexta}` : "—"}</TableCell>
                    <TableCell>{h.intervaloMin} min</TableCell>
                    <TableCell><Badge variant="secondary">{h.aplicacao === "loja" ? "Loja" : "Escritório"}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => abrirHorario(h)}><Pencil className="h-4 w-4" /></Button>
                        <ConfirmDelete titulo={`Excluir horário ${h.nome}?`} onConfirm={async () => { await api.remove("horarios", h.id); toast.success("Horário excluído."); refresh(); }}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                        </ConfirmDelete>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ============ FERIADOS ============ */}
        <TabsContent value="feriados">
          <Card className="mb-4">
            <CardContent className="flex flex-wrap items-end gap-3 p-4">
              <Field label="Data"><Input type="date" value={ferData} onChange={(e) => setFerData(e.target.value)} className="w-40" /></Field>
              <Field label="Nome do feriado"><Input value={ferNome} onChange={(e) => setFerNome(e.target.value)} placeholder="Ex.: Aniversário da cidade" className="w-64" /></Field>
              <Button onClick={addFeriado}><Plus /> Adicionar</Button>
            </CardContent>
          </Card>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {[...feriados].sort((a, b) => a.data.localeCompare(b.data)).map((f: any) => (
              <div key={f.id ?? f.data} className="flex items-center gap-3 rounded-lg border bg-card p-3 text-sm">
                <Badge variant="secondary">{fmtData(f.data)}</Badge>
                <span className="min-w-0 flex-1 truncate">{f.nome}</span>
                {f.id && (
                  <ConfirmDelete titulo="Excluir feriado?" onConfirm={async () => { await api.remove("feriados", f.id); refresh(); }}>
                    <button className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                  </ConfirmDelete>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        {/* ============ USUÁRIOS ============ */}
        {can("usuarios") && (
          <TabsContent value="usuarios">
            <div className="mb-3 flex justify-end">
              <Button onClick={() => abrirUsuario(null)}><Plus /> Novo usuário</Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {usuarios.map((u) => (
                <Card key={u.id}>
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{u.nome}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    <Badge>{PAPEL_LABEL[u.papel]}</Badge>
                    {u.lojaId && <Badge variant="secondary">{lojas.find((l) => l.id === u.lojaId)?.nome}</Badge>}
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => abrirUsuario(u)}><Pencil className="h-4 w-4" /></Button>
                    <ConfirmDelete titulo={`Excluir usuário ${u.nome}?`} onConfirm={async () => { await api.remove("usuarios", u.id); toast.success("Usuário excluído."); refresh(); }}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </ConfirmDelete>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card className="mt-4">
              <CardContent className="p-4 text-xs leading-relaxed text-muted-foreground">
                <strong>Permissões:</strong> Administrador — tudo, incluindo usuários e backup ·
                RH — edição completa, VT, configurações e auditoria ·
                Gerente — edição restrita à própria loja ·
                Consulta — somente leitura.
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* ============ IMPORTAÇÃO ============ */}
        <TabsContent value="importacao">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Importação de funcionários via Excel</CardTitle>
              <CardDescription>
                Baixe o modelo, preencha uma linha por colaboradora e importe. Loja e horário são
                localizados pelo nome; linhas sem nome são ignoradas.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={baixarModelo}><Download /> Baixar modelo</Button>
              <input ref={importRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => e.target.files?.[0] && importar(e.target.files[0])} />
              <Button onClick={() => importRef.current?.click()} disabled={importando}>
                <Upload /> {importando ? "Importando..." : "Importar planilha"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ BACKUP ============ */}
        {can("backup") && (
          <TabsContent value="backup">
            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Backup</CardTitle>
                  <CardDescription>Baixa o banco completo (JSON) com todos os dados.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => api.backup.download()}><Download /> Baixar backup</Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Restauração</CardTitle>
                  <CardDescription>Substitui todos os dados pelo backup enviado.</CardDescription>
                </CardHeader>
                <CardContent>
                  <input ref={restoreRef} type="file" accept=".json" className="hidden" onChange={(e) => e.target.files?.[0] && restaurar(e.target.files[0])} />
                  <Button variant="outline" onClick={() => restoreRef.current?.click()}><Upload /> Restaurar backup</Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Reset de demonstração</CardTitle>
                  <CardDescription>Volta ao estado inicial com os dados de exemplo.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ConfirmDelete titulo="Resetar o banco?" descricao="Todos os dados atuais serão substituídos pelos dados de demonstração." onConfirm={resetar}>
                    <Button variant="destructive"><RotateCcw /> Resetar dados</Button>
                  </ConfirmDelete>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}

        {/* ============ AUDITORIA ============ */}
        {can("auditoria") && (
          <TabsContent value="auditoria">
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-transparent">
                    <TableHead>Data/hora</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Coleção</TableHead>
                    <TableHead>Detalhe</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditoria.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Nenhuma alteração registrada ainda.</TableCell></TableRow>
                  )}
                  {(auditoria as AuditEntry[]).slice(0, 100).map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="whitespace-nowrap text-xs">{new Date(a.dataHora).toLocaleString("pt-BR")}</TableCell>
                      <TableCell className="text-xs font-medium">{a.usuario}</TableCell>
                      <TableCell>
                        <Badge variant={a.acao === "excluir" ? "destructive" : a.acao === "criar" ? "success" : "secondary"}>{a.acao}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">{a.colecao}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{a.detalhe}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Exibindo os últimos 100 registros (máx. 2000 retidos).</p>
          </TabsContent>
        )}
      </Tabs>

      {/* ---------- diálogos ---------- */}
      <Dialog open={!!lojaDialog} onOpenChange={(o) => !o && setLojaDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{lojaDialog?.loja ? "Editar loja" : "Nova loja"}</DialogTitle></DialogHeader>
          <Field label="Nome" obrigatorio><Input value={lojaForm.nome} onChange={(e) => setLojaForm((f) => ({ ...f, nome: e.target.value }))} /></Field>
          <Field label="Gerente"><Input value={lojaForm.gerente} onChange={(e) => setLojaForm((f) => ({ ...f, gerente: e.target.value }))} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cidade"><Input value={lojaForm.cidade} onChange={(e) => setLojaForm((f) => ({ ...f, cidade: e.target.value }))} /></Field>
            <Field label="Cor (gráficos)"><Input type="color" value={lojaForm.cor} onChange={(e) => setLojaForm((f) => ({ ...f, cor: e.target.value }))} className="h-9 p-1" /></Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLojaDialog(null)}>Cancelar</Button>
            <Button onClick={salvarLoja}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!horDialog} onOpenChange={(o) => !o && setHorDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{horDialog?.hor ? "Editar horário" : "Novo horário"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nome" obrigatorio className="col-span-2"><Input value={horForm.nome} onChange={(e) => setHorForm((f) => ({ ...f, nome: e.target.value }))} placeholder="Ex.: Manhã" /></Field>
            <Field label="Dias"><Input value={horForm.dias} onChange={(e) => setHorForm((f) => ({ ...f, dias: e.target.value }))} placeholder="Seg a Sáb" /></Field>
            <Field label="Aplicação">
              <Select value={horForm.aplicacao} onValueChange={(v) => setHorForm((f) => ({ ...f, aplicacao: v as Horario["aplicacao"] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="loja">Loja</SelectItem>
                  <SelectItem value="escritorio">Escritório</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Entrada"><Input type="time" value={horForm.entrada} onChange={(e) => setHorForm((f) => ({ ...f, entrada: e.target.value }))} /></Field>
            <Field label="Saída"><Input type="time" value={horForm.saida} onChange={(e) => setHorForm((f) => ({ ...f, saida: e.target.value }))} /></Field>
            <Field label="Entrada sexta (opcional)"><Input type="time" value={horForm.entradaSexta} onChange={(e) => setHorForm((f) => ({ ...f, entradaSexta: e.target.value }))} /></Field>
            <Field label="Saída sexta (opcional)"><Input type="time" value={horForm.saidaSexta} onChange={(e) => setHorForm((f) => ({ ...f, saidaSexta: e.target.value }))} /></Field>
            <Field label="Intervalo (min)"><Input type="number" value={horForm.intervaloMin} onChange={(e) => setHorForm((f) => ({ ...f, intervaloMin: e.target.value }))} /></Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHorDialog(null)}>Cancelar</Button>
            <Button onClick={salvarHorario}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!usuDialog} onOpenChange={(o) => !o && setUsuDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{usuDialog?.usu ? "Editar usuário" : "Novo usuário"}</DialogTitle></DialogHeader>
          <Field label="Nome" obrigatorio><Input value={usuForm.nome} onChange={(e) => setUsuForm((f) => ({ ...f, nome: e.target.value }))} /></Field>
          <Field label="E-mail" obrigatorio><Input type="email" value={usuForm.email} onChange={(e) => setUsuForm((f) => ({ ...f, email: e.target.value }))} /></Field>
          <Field label="Papel">
            <Select value={usuForm.papel} onValueChange={(v) => setUsuForm((f) => ({ ...f, papel: v as Papel }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(PAPEL_LABEL) as Papel[]).map((p) => (
                  <SelectItem key={p} value={p}>{PAPEL_LABEL[p]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {usuForm.papel === "gerente" && (
            <Field label="Loja do gerente" obrigatorio>
              <Select value={usuForm.lojaId} onValueChange={(v) => setUsuForm((f) => ({ ...f, lojaId: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nenhuma">Selecione...</SelectItem>
                  {lojas.map((l) => <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setUsuDialog(null)}>Cancelar</Button>
            <Button onClick={salvarUsuario}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
