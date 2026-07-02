"use client";
/**
 * Barra superior: menu mobile, recolher sidebar, busca global,
 * notificações, alternância de tema e menu do usuário.
 */
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { Bell, LogOut, Menu, Moon, PanelLeftClose, PanelLeftOpen, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar } from "@/components/shared/avatar";
import { GlobalSearch } from "@/components/layout/global-search";
import { useAuth } from "@/lib/auth";
import { useData } from "@/hooks/use-data";
import { geraNotificacoes } from "@/lib/calc";
import { mesAtual, cn } from "@/lib/utils";
import { PAPEL_LABEL } from "@/lib/constants";

export function Topbar({
  colapsada, onToggleColapso, onAbrirMobile,
}: {
  colapsada: boolean;
  onToggleColapso: () => void;
  onAbrirMobile: () => void;
}) {
  const { user, logout } = useAuth();
  const { funcionarios, atestados, asos, vtPagamentos } = useData();
  const { resolvedTheme, setTheme } = useTheme();
  const router = useRouter();

  const notifs = geraNotificacoes(funcionarios, atestados, asos, vtPagamentos, mesAtual());
  const altas = notifs.filter((n) => n.nivel === "alto").length;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-md lg:px-6">
      {/* mobile: abre drawer */}
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onAbrirMobile} aria-label="Abrir menu">
        <Menu />
      </Button>
      {/* desktop: recolhe sidebar */}
      <Button variant="ghost" size="icon" className="hidden lg:inline-flex" onClick={onToggleColapso} aria-label="Recolher menu">
        {colapsada ? <PanelLeftOpen /> : <PanelLeftClose />}
      </Button>

      <GlobalSearch />

      <div className="ml-auto flex items-center gap-1.5">
        {/* Notificações */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label="Notificações">
              <Bell />
              {notifs.length > 0 && (
                <span
                  className={cn(
                    "absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white",
                    altas > 0 ? "bg-red-500" : "bg-primary"
                  )}
                >
                  {notifs.length}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-96 max-h-[70vh] overflow-y-auto">
            <DropdownMenuLabel>Alertas e notificações</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifs.length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">Tudo em dia! 🎉</p>
            )}
            {notifs.slice(0, 12).map((n) => (
              <DropdownMenuItem key={n.id} onClick={() => router.push(n.href)} className="items-start py-2.5">
                <span
                  className={cn(
                    "mt-1 h-2 w-2 shrink-0 rounded-full",
                    n.nivel === "alto" ? "bg-red-500" : n.nivel === "medio" ? "bg-amber-500" : "bg-sky-500"
                  )}
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium leading-snug">{n.titulo}</span>
                  <span className="block text-xs text-muted-foreground">{n.detalhe}</span>
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Tema */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          aria-label="Alternar tema"
        >
          <Sun className="hidden dark:block" />
          <Moon className="dark:hidden" />
        </Button>

        {/* Usuário */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-accent transition-colors">
                <Avatar nome={user.nome} />
                <span className="hidden text-left sm:block">
                  <span className="block text-sm font-medium leading-tight">{user.nome}</span>
                  <span className="block text-[11px] text-muted-foreground">{PAPEL_LABEL[user.papel]}</span>
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>
                {user.email}
                <Badge className="ml-0 mt-1 block w-fit">{PAPEL_LABEL[user.papel]}</Badge>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { logout(); }}>
                <LogOut /> Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
