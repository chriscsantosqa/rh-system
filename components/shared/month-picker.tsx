"use client";
/** Seletor de competência (mês/ano) com navegação por setas */
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fmtCompetencia } from "@/lib/utils";

export function MonthPicker({ value, onChange }: { value: string; onChange: (ym: string) => void }) {
  function mover(delta: number) {
    const [y, m] = value.split("-").map(Number);
    const total = y * 12 + (m - 1) + delta;
    const ny = Math.floor(total / 12);
    const nm = (total % 12) + 1;
    onChange(`${ny}-${String(nm).padStart(2, "0")}`);
  }
  return (
    <div className="flex items-center gap-1 rounded-lg border bg-card px-1 py-0.5 shadow-sm">
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => mover(-1)} aria-label="Mês anterior">
        <ChevronLeft />
      </Button>
      <span className="min-w-[130px] text-center text-sm font-medium capitalize">{fmtCompetencia(value)}</span>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => mover(1)} aria-label="Próximo mês">
        <ChevronRight />
      </Button>
    </div>
  );
}
