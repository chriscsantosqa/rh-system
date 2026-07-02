"use client";
/**
 * Tela de login demonstrativa: seleciona um dos usuários cadastrados.
 * Cada papel demonstra um nível de permissão (admin, RH, gerente, consulta).
 */
import { useEffect, useState } from "react";
import { FileText, LogIn, ShieldCheck } from "lucide-react";
import { api } from "@/services/api";
import { useAuth } from "@/lib/auth";
import { Avatar } from "@/components/shared/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PAPEL_LABEL } from "@/lib/constants";
import type { Usuario } from "@/types";

export default function LoginPage() {
  const { login } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[] | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    api.list<Usuario>("usuarios")
      .then(setUsuarios)
      .catch(() => setErro("Não foi possível carregar os usuários. Verifique se o servidor está rodando."));
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <FileText className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">RH Lupatelli & Enlace</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sistema de gestão de pessoas</p>
        </div>

        <Card>
          <CardContent className="p-5">
            <p className="mb-4 flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ShieldCheck className="h-4 w-4" /> Escolha um perfil para entrar (demonstração)
            </p>

            {erro && <p className="py-4 text-center text-sm text-destructive">{erro}</p>}

            {!usuarios && !erro && (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            )}

            <div className="space-y-2">
              {usuarios?.map((u) => (
                <button
                  key={u.id}
                  onClick={() => login(u)}
                  className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all hover:border-primary hover:shadow-sm"
                >
                  <Avatar nome={u.nome} className="h-10 w-10 text-xs" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{u.nome}</span>
                    <span className="block truncate text-xs text-muted-foreground">{u.email}</span>
                  </span>
                  <Badge>{PAPEL_LABEL[u.papel]}</Badge>
                  <LogIn className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>

            <p className="mt-4 text-center text-[11px] leading-relaxed text-muted-foreground">
              Autenticação local para demonstração. Os papéis controlam permissões reais dentro
              do sistema (edição, VT, configurações, backup).
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
