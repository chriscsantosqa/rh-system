"use client";
/** Select compacto para filtros ("todos" = sem filtro) */
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface Opcao {
  value: string;
  label: string;
}

export function FiltroSelect({
  value, onChange, opcoes, placeholder, todosLabel = "Todos", className,
}: {
  value: string;
  onChange: (v: string) => void;
  opcoes: Opcao[];
  placeholder: string;
  todosLabel?: string;
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className ?? "w-[180px]"}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="todos">{todosLabel}</SelectItem>
        {opcoes.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
