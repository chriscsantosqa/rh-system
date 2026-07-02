import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Card de indicador do dashboard */
export function StatCard({
  titulo, valor, sub, icon: Icon, tom = "default", onClick,
}: {
  titulo: string;
  valor: string | number;
  sub?: string;
  icon: LucideIcon;
  tom?: "default" | "alerta" | "ok" | "info";
  onClick?: () => void;
}) {
  const tons = {
    default: "bg-primary/10 text-primary",
    alerta: "bg-red-500/10 text-red-600 dark:text-red-400",
    ok: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    info: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  };
  return (
    <Card
      className={cn("animate-fade-in transition-shadow", onClick && "cursor-pointer hover:shadow-md")}
      onClick={onClick}
    >
      <CardContent className="flex items-center gap-4 p-5">
        <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-lg", tons[tom])}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">{titulo}</p>
          <p className="text-2xl font-bold leading-tight">{valor}</p>
          {sub && <p className="truncate text-xs text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
