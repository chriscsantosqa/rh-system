"use client";
/**
 * Menu lateral recolhível (desktop) e drawer (mobile).
 * Itens filtrados conforme o papel do usuário.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3, CalendarDays, ClipboardPlus, FileBarChart2, FileText,
  FolderOpen, HeartPulse, LayoutDashboard, Bus, Settings, Users, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

export const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/funcionarios", label: "Funcionários", icon: Users },
  { href: "/escalas", label: "Escalas", icon: CalendarDays },
  { href: "/vale-transporte", label: "Vale Transporte", icon: Bus },
  { href: "/atestados", label: "Atestados", icon: ClipboardPlus },
  { href: "/medicina", label: "Medicina do Trabalho", icon: HeartPulse },
  { href: "/documentos", label: "Documentos", icon: FolderOpen },
  { href: "/indicadores", label: "Indicadores", icon: BarChart3 },
  { href: "/relatorios", label: "Relatórios", icon: FileBarChart2 },
  { href: "/configuracoes", label: "Configurações", icon: Settings, permissao: "configuracoes" as const },
];

export function Sidebar({
  colapsada, mobileAberta, onFecharMobile,
}: {
  colapsada: boolean;
  mobileAberta: boolean;
  onFecharMobile: () => void;
}) {
  const pathname = usePathname();
  const { can } = useAuth();

  const itens = NAV_ITEMS.filter((i) => !i.permissao || can(i.permissao));

  const conteudo = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className={cn("flex h-16 items-center gap-2.5 px-4", colapsada && "justify-center px-2")}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow">
          <FileText className="h-4.5 w-4.5" />
        </div>
        {!colapsada && (
          <div className="leading-tight">
            <p className="text-sm font-bold text-white">RH Lupatelli</p>
            <p className="text-[11px] text-zinc-400">Gestão de Pessoas</p>
          </div>
        )}
      </div>

      {/* Navegação */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
        {itens.map((item) => {
          const ativo = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onFecharMobile}
              title={colapsada ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                colapsada && "justify-center px-2",
                ativo
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-zinc-400 hover:bg-white/[0.06] hover:text-white"
              )}
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              {!colapsada && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {!colapsada && (
        <div className="px-4 py-3 text-[11px] text-zinc-500">
          v1.0 — uso interno
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside
        className={cn(
          "hidden lg:block fixed inset-y-0 left-0 z-40 bg-sidebar transition-[width] duration-200",
          colapsada ? "w-[68px]" : "w-60"
        )}
      >
        {conteudo}
      </aside>

      {/* Mobile (drawer) */}
      {mobileAberta && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={onFecharMobile} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-sidebar shadow-xl animate-in slide-in-from-left duration-200">
            <button
              className="absolute right-3 top-4 text-zinc-400 hover:text-white"
              onClick={onFecharMobile}
              aria-label="Fechar menu"
            >
              <X className="h-5 w-5" />
            </button>
            {conteudo}
          </aside>
        </div>
      )}
    </>
  );
}
