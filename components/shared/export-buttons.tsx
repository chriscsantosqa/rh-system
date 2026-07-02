"use client";
/** Botões padrão de exportação Excel + PDF */
import { FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ExportButtons({ onExcel, onPDF }: { onExcel: () => void; onPDF: () => void }) {
  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={onExcel}>
        <FileSpreadsheet className="text-emerald-600" /> Excel
      </Button>
      <Button variant="outline" size="sm" onClick={onPDF}>
        <FileText className="text-red-500" /> PDF
      </Button>
    </div>
  );
}
