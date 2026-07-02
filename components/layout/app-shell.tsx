"use client";
/**
 * Casca da aplicação: sidebar + topbar + conteúdo.
 * Na rota /login (ou sem usuário) renderiza apenas o conteúdo.
 */
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, pronto } = useAuth();
  const pathname = usePathname();
  const [colapsada, setColapsada] = useState(false);
  const [mobileAberta, setMobileAberta] = useState(false);

  // persiste a preferência de sidebar recolhida
  useEffect(() => {
    setColapsada(localStorage.getItem("rh_sidebar") === "1");
  }, []);
  function toggleColapso() {
    setColapsada((c) => {
      localStorage.setItem("rh_sidebar", c ? "0" : "1");
      return !c;
    });
  }

  if (!pronto) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user || pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen">
      <Sidebar colapsada={colapsada} mobileAberta={mobileAberta} onFecharMobile={() => setMobileAberta(false)} />
      <div className={cn("transition-[padding] duration-200", colapsada ? "lg:pl-[68px]" : "lg:pl-60")}>
        <Topbar colapsada={colapsada} onToggleColapso={toggleColapso} onAbrirMobile={() => setMobileAberta(true)} />
        <main className="mx-auto max-w-[1400px] p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
